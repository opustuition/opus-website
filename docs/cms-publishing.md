# CMS publishing and access control

## Who can publish

The editor is at `/admin/`, but it is not a public feature. Decap authenticates with GitHub OAuth and publishes through the GitHub API to `opustuition/opus-website` on `main`.

An administrator must have both:

- a GitHub account that is a member of the approved publisher team (or explicitly approved account); and
- permission to push to `main`, as allowed by the repository's branch-protection rule.

Decap's simple publishing mode commits directly to `main`. If the branch rule requires pull requests, the approved publisher team must be permitted to bypass that requirement; otherwise use a rule that restricts direct pushes to that team without requiring a pull request.

Do not create visitor accounts for the CMS and do not expose `/admin/` in navigation, marketing links, or robots sitemaps. Authentication and GitHub authorization, rather than obscurity of the URL, protect the editor.

## Hosting-provider setup

Configure the Netlify GitHub OAuth provider for `calm-semolina-dc21f4.netlify.app`. Create a GitHub OAuth App and use `https://api.netlify.com/auth/done` as its callback URL, then add the app's client ID and client secret under the project's GitHub authentication provider settings. Keep the secret in the hosting dashboard; it must never be committed. Netlify is used only for the OAuth exchange; GitHub Pages remains the public host.

Each CMS publish creates a commit to `main`. GitHub Pages rebuilds and deploys that commit through the repository's existing Pages workflow.

## Administrator verification checklist

1. Visit `/admin/` in an incognito window and select **Login with GitHub**.
2. Log in as an approved administrator and publish a clearly labelled test article.
3. Confirm the commit appears on `main` in GitHub and that the GitHub Pages deployment for that commit succeeds.
4. Confirm the post is visible on the live blog, then delete the test article if appropriate.
5. Repeat the sign-in attempt with an account that lacks repository write access. The CMS must not be able to save or publish.
6. Review GitHub organization/repository access periodically and remove former staff from the approved publisher team immediately.

## Normal publishing

1. Go to `/admin/` and sign in with the approved GitHub account.
2. Open **Articles**, choose **New Article**, and complete every required field, including cover-image alt text.
3. Check the preview, then select **Publish**. The editor commits the article and any uploaded image to `main`.
4. Wait for the hosting deployment to finish, then open the live article and verify its title, image, links, and mobile layout.

For a correction, edit and publish the existing article, then repeat the final live-site check.
