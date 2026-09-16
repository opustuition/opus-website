# OPUS Tuition website

This is a Jekyll site for [opustuition.com](https://opustuition.com).

## Local development

```powershell
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000`. Do not open the source `index.html` directly: Jekyll must render the Liquid templates and asset paths first.

## Secure article editor

The Decap CMS editor is available at `/admin/`. In production it authenticates each editor with GitHub OAuth, writes only to `main` in `opustuition/opus-website`, and GitHub Pages deploys the resulting commit.

Only approved administrators should have GitHub write access to this repository. Visitors have no account, no editor link in the public navigation, and no permission to publish.

### One-time production setup

This needs to be completed by an owner of both the GitHub repository and the Netlify OAuth project. The site configuration is already set for this route.

1. Create a Netlify project at `calm-semolina-dc21f4.netlify.app`. It is used only for authentication; do not point `opustuition.com` at Netlify.
2. Follow [the Netlify OAuth proxy setup](docs/netlify-oauth-proxy.md): set the GitHub OAuth App callback to `https://calm-semolina-dc21f4.netlify.app/callback` and add its client ID and secret as Netlify Function environment variables. Never commit the secret.
3. In GitHub, give publishing access only to the approved administrator team or accounts. Protect `main` by restricting pushes to that same administrator team, and do not give write access to visitor accounts. Because Decap publishes direct commits to `main`, do not require pull requests for those publishers unless they are explicitly included in the rule's bypass list.
4. Sign in at `https://opustuition.com/admin/` with an approved GitHub account. Create a small test post and publish it. Confirm the new commit lands on `main`, the GitHub Pages deployment succeeds, and the post appears on the live blog. Delete the test post afterward if it is not intended to remain live.

The GitHub backend deliberately relies on GitHub repository permissions: a successful OAuth login alone is insufficient to publish. Anyone without push permission will be denied by GitHub.

### Local CMS development

For local-only editing, temporarily change `admin/config.yml` to use `local_backend: true` and a local backend, then restore the production GitHub backend before committing. Do not run the local proxy as a production service.

In a second PowerShell window, install the editor helper once and then start it:

```powershell
npm install
npm run cms:local
```

Keep the Jekyll server running in the first window. The built-in preview lets the author review Markdown before saving.

## Project structure

```text
_data/                  Shared content such as contact details
_includes/              Reusable page components
_layouts/               Shared HTML shell
assets/
  css/                  Global and page-specific styles
  fonts/                Local webfonts and licences
  images/               Categorised image assets
  js/                   Shared site behaviour
pages/                   Route-backed content pages
index.html               Home page
_config.yml              Jekyll site configuration
```

Page source files can live under `pages/` because their front matter preserves the public routes. Contact details and WhatsApp URLs should be changed in `_data/contact.yml`.

## Production build

```powershell
bundle exec jekyll build
```

The generated site is written to `_site/`, which is intentionally ignored by Git.
