const STATE_COOKIE = '__Host-opus_oauth_state';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function cookieValue(request, name) {
  const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : undefined;
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function callbackPage(message, targetOrigin) {
  const body = `<body><p>Finishing login…</p><script>
    (() => {
      const message = ${escapeJson(message)};
      const targetOrigin = ${escapeJson(targetOrigin)};
      if (window.opener) window.opener.postMessage(message, targetOrigin);
      window.close();
      document.body.textContent = message.includes(':success:') ? 'Authorized. You can close this window.' : 'Login failed. You can close this window.';
    })();
  </script></body>`;

  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>OPUS CMS login</title>${body}</html>`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
      'Set-Cookie': `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
}

export default async request => {
  const targetOrigin = process.env.CMS_ORIGIN || 'https://opustuition.com';
  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get('state');

  if (request.method !== 'GET' || !state || state !== cookieValue(request, STATE_COOKIE)) {
    return callbackPage('authorization:github:error:' + JSON.stringify({ message: 'Invalid OAuth state.' }), targetOrigin);
  }

  const providerError = requestUrl.searchParams.get('error');
  if (providerError) {
    return callbackPage('authorization:github:error:' + JSON.stringify({ message: providerError }), targetOrigin);
  }

  const code = requestUrl.searchParams.get('code');
  if (!code) {
    return callbackPage('authorization:github:error:' + JSON.stringify({ message: 'GitHub did not return an authorization code.' }), targetOrigin);
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: required('GITHUB_OAUTH_CLIENT_ID'),
        client_secret: required('GITHUB_OAUTH_CLIENT_SECRET'),
        code,
        redirect_uri: required('OAUTH_CALLBACK_URL'),
      }),
    });
    const token = await response.json();

    if (!response.ok || !token.access_token) {
      throw new Error(token.error_description || token.error || 'GitHub token exchange failed.');
    }

    return callbackPage(
      'authorization:github:success:' + JSON.stringify({ token: token.access_token, provider: 'github' }),
      targetOrigin,
    );
  } catch (error) {
    return callbackPage('authorization:github:error:' + JSON.stringify({ message: error.message }), targetOrigin);
  }
};
