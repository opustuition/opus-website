# Guest likes, comments and sharing

GitHub Pages still serves the Jekyll site. Supabase provides Postgres, its browser API and anonymous Auth sessions. No server, database password or Supabase secret key is shipped with the site. Sharing uses the device share menu, clipboard/manual copy fallback, or WhatsApp and works without Supabase.

## One-time setup

1. Create a Supabase project. Run `supabase/migrations/202610200001_blog_engagement.sql` in its SQL Editor as the project owner. This registers both existing article routes, creates the tables, enables Row Level Security and grants only approved-comment reads and restricted database functions to visitors.
2. Enable **Allow anonymous sign-ins** in Supabase Authentication settings. Readers never enter an email address. A guest account is created only on the first like or comment; returning visits reuse the browser session.
3. For a public deployment, configure Cloudflare Turnstile for the site hostname and local test hostname. Enable Turnstile CAPTCHA protection in Supabase Auth using the Turnstile **secret** key. Set the matching **site** key below. The widget verifies new guest sessions; existing sessions do not need another challenge. Leave both the Supabase CAPTCHA setting and site key empty for local testing without CAPTCHA.
4. Set the browser-safe values in `_config.yml`:

   ```yaml
   supabase:
     url: "https://YOUR-PROJECT.supabase.co"
     publishable_key: "sb_publishable_..."
     turnstile_site_key: "YOUR-PUBLIC-TURNSTILE-SITE-KEY"
   ```

   A legacy `anon` key also works. Never use a secret key, `service_role` key, database password, or Turnstile secret in this file. The publishable key is intentionally public; database permissions protect the data.
5. Build and deploy through the existing GitHub Pages process. There are no GitHub Actions secrets or Netlify changes needed for this feature. Supabase remains disabled while its URL/key are empty; sharing still works.

The browser loads Supabase JS 2.58.0 from jsDelivr on article pages when configured. If the CDN, CAPTCHA or Supabase is unavailable, the article and share controls remain usable.

## Publishing articles

The database only accepts interactions on registered routes, preventing guests from creating arbitrary article records. After publishing a new article through Decap, copy its URL path from the rendered site and register it in Supabase's SQL Editor:

```sql
insert into public.blog_posts (id) values ('/blog/new-article-slug/') on conflict do nothing;
```

Use the URL path without a domain or GitHub Pages `baseurl`. Existing routes are `/blog/test-article/` and `/blog/how-to-study-mathematics/`. Titles can change without affecting interactions as long as the route stays the same. When changing a route, insert the new route, update `post_id` in both interaction tables, then delete the old registry entry in one transaction. Deleting a registry entry cascades to its interactions.

## Moderation

In the Supabase Table Editor, open `blog_comments` and filter `approved = false`. Review each submission and change `approved` to `true` to publish it, or delete it to reject it. Approved comments appear on the next article load. This is separate from Decap's article publishing permissions.

Guests cannot approve, update or delete comments through the API. Pending comments and guest IDs are not exposed publicly. Comments are plain text, rendered with `textContent`, and limited to 2,000 characters; names are limited to 60. A guest can submit once per minute and at most ten times per rolling day. The database serializes concurrent submissions to enforce these limits.

Likes are unique per article and Supabase guest identity. Clearing browser storage, using private browsing or using another device creates a new identity and can bypass per-guest limits. Turnstile reduces automated guest creation; it cannot establish one person per identity. Review Supabase usage and periodically remove unused anonymous accounts according to your retention needs. Deleting an Auth user cascades to their likes and comments, so retain accounts whose contributions you want to preserve.

## Verification

Run `bundle exec jekyll build` and `node --test tests/blog-engagement.test.cjs` locally. With a configured test Supabase project:

1. Open an article before signing in. Verify approved comments and like count load, and that simply reading creates no Auth user.
2. Complete the CAPTCHA, like the article, reload, then unlike. Check there is at most one row for that guest/article. Use another browser to confirm shared counts.
3. Submit a comment. Confirm it is pending in the dashboard and absent publicly, including when querying the REST API directly. Approve it and reload to see it.
4. Try another submission within a minute and confirm it is rejected. Verify direct table writes, reading `user_id`, and browser attempts to approve comments are denied.
5. Test native sharing on mobile, desktop copying and denied clipboard access. Shared URLs should contain neither tracking parameters nor session tokens.
6. Disable Supabase/network access and confirm the article and sharing still work. Check the empty-config state too.

## References

- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Browser-safe API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database function security](https://supabase.com/docs/guides/database/functions)
