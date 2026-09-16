# Netlify OAuth proxy setup

The public OPUS site remains on GitHub Pages. Netlify serves only `/auth` and `/callback` for the Decap CMS GitHub OAuth flow.

## Netlify settings

In the `calm-semolina-dc21f4` Netlify project, add these environment variables. They must be available to Functions and must never be committed to Git.

| Name | Value |
| --- | --- |
| `GITHUB_OAUTH_CLIENT_ID` | The Client ID from the OPUS Tuition Admin GitHub OAuth App |
| `GITHUB_OAUTH_CLIENT_SECRET` | The Client secret from that OAuth App |
| `OAUTH_CALLBACK_URL` | `https://calm-semolina-dc21f4.netlify.app/callback` |
| `CMS_ORIGIN` | `https://opustuition.com` |

Redeploy the Netlify project after saving the variables so the Functions receive them.

## GitHub OAuth App settings

Edit the existing **OPUS Tuition Admin** OAuth App in GitHub:

- Homepage URL: `https://opustuition.com/admin/`
- Authorization callback URL: `https://calm-semolina-dc21f4.netlify.app/callback`
- Wildcard matching: disabled
- Device flow: disabled

The old `https://api.netlify.com/auth/done` callback is no longer used. The new callback is served by the code in this repository and sends Decap the final authorization message itself.

## Verification

1. Let GitHub Pages deploy the commit that contains these functions and the CMS configuration.
2. In an incognito window, visit `https://opustuition.com/admin/` and choose **Login with GitHub**.
3. After GitHub approval, the Netlify popup should close automatically and Decap should load **Articles**.
4. Publish a labelled test article, verify the commit appears on `main`, and verify GitHub Pages deploys it.
5. Repeat login with a GitHub account that lacks repository write access. It must be unable to publish.
