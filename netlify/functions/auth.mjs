import { randomBytes } from 'node:crypto';

const STATE_COOKIE = '__Host-opus_oauth_state';
const STATE_TTL_SECONDS = 600;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function page(body, headers = {}) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>OPUS CMS login</title>${body}</html>`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
      ...headers,
    },
  });
}

export default async request => {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });

  try {
    const requestUrl = new URL(request.url);
    const requestedScope = requestUrl.searchParams.get('scope');
    const scope = requestedScope === 'repo' ? 'repo' : 'public_repo';
    const state = randomBytes(32).toString('base64url');
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');

    authorizeUrl.searchParams.set('client_id', required('GITHUB_OAUTH_CLIENT_ID'));
    authorizeUrl.searchParams.set('redirect_uri', required('OAUTH_CALLBACK_URL'));
    authorizeUrl.searchParams.set('scope', scope);
    authorizeUrl.searchParams.set('state', state);

    // Decap first verifies that the popup is the expected OAuth origin. Only
    // navigate to GitHub after its parent window completes that handshake.
    const authorizationUrl = JSON.stringify(authorizeUrl.toString());
    const body = `<body><p>Opening GitHub login…</p><script>
      (() => {
        const authorizationUrl = ${authorizationUrl};
        if (!window.opener) {
          document.body.textContent = 'This login window must be opened from the OPUS CMS.';
          return;
        }
        window.addEventListener('message', event => {
          if (event.data === 'authorizing:github') window.location.replace(authorizationUrl);
        }, { once: true });
        window.opener.postMessage('authorizing:github', window.location.origin);
      })();
    </script></body>`;

    return page(body, {
      'Set-Cookie': `${STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_TTL_SECONDS}`,
    });
  } catch (error) {
    return page(`<body><p>Unable to start CMS login.</p></body>`, { 'X-Error': error.message });
  }
};
