# AssurIntellec Decap Turbo Publish troubleshooting

## What was changed in this package

- The CMS loader is pinned to the stable `decap-cms@^3.17.0` range. Decap's official Turbo guide says Turbo backends are included from 3.17.0 onward.
- The backend remains `turbo-github`, with the current configured site UUID and `main` branch; this package deliberately does not invent or replace the Turbo site ID.
- An opt-in diagnostics panel is available at `/admin/?debugPublish=1`. Normal `/admin/` use is unchanged. The panel logs CMS publish lifecycle events, browser JavaScript errors, failed `fetch` responses and request URLs with query strings removed. It does not change content or send diagnostic logs anywhere.

## Test the Publish button

1. Deploy the updated `admin/index.html` and `admin/publish-diagnostics.js` to the same website hosting environment used for `/admin/`.
2. Open `https://www.assurintellec.in/admin/?debugPublish=1` in a desktop browser. If you normally use the apex domain, repeat at `https://assurintellec.in/admin/?debugPublish=1`.
3. Sign in to Turbo. Open a harmless text field in **Site Settings → Complete Website Settings** and change one word.
4. Click Publish and wait for the panel log. Do not publish repeated changes if the first attempt is still pending.
5. Use **Copy diagnostics** or take a screenshot of the panel. The useful outcomes are:
   - `Decap CMS event: prePublish` followed by `postPublish`: CMS reports success; check GitHub for a commit on `main`, then check the hosting deployment separately.
   - `prePublish` appears but no `postPublish`, plus `HTTP 401/403/404/409/5xx` or a network failure: backend/account/repository/configuration or service error.
   - The Publish button click is detected but no `prePublish`: likely a CMS UI/validation/browser-JavaScript issue or stale code. Check Console and hard refresh the admin page.
   - `CMS event API not available` or CMS did not initialize: check the CDN script request and `admin/config.yml` request in the Network tab.

## Verify account-side Turbo settings

The local ZIP cannot read the user's Turbo dashboard; verify these values in Decap Turbo:

- The configured Site ID exactly matches the `turbo_site_id` value in `admin/config.yml`.
- Provider is GitHub and the site row is connected to repository `assurintellec/AssurIntellec`.
- Branch is `main`.
- Config path is `admin/config.yml`.
- Admin interface URLs include each exact URL used, including protocol, host and path: `https://www.assurintellec.in/admin/` and (if used) `https://assurintellec.in/admin/`.
- Your Turbo account has access to this exact site and the GitHub connection has repository access.

For Turbo, the site row in the dashboard is authoritative for the repository; adding a `repo:` field to this config is not a fix. Do not switch to the plain `github` backend unless an OAuth server has been configured.

Official docs:
- https://decapcms.org/docs/turbo-connecting-a-site/
- https://decapcms.org/docs/turbo-troubleshooting-faq/
- https://decapcms.org/docs/registering-events/
