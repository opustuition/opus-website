# OPUS Tuition website

This is a Jekyll site for [opustuition.com](https://opustuition.com).

## Local development

```powershell
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000`. Do not open the source `index.html` directly: Jekyll must render the Liquid templates and asset paths first.

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
