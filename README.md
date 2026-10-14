# AssurIntellec™ website — upgraded package

**Canonical site:** https://www.assurintellec.in/  
**Existing repository:** https://github.com/assurintellec/AssurIntellec (`main`)  
**CMS:** https://www.assurintellec.in/admin/  
**Hosting:** the existing Cloudflare Workers Builds deployment

This package updates the supplied website project in place. It is not a replacement repository and it does not require DNS, domain, or repository changes. Keep your current repository, `main` branch, Cloudflare build connection, custom domain, and secrets.

## What changed

- Added a short white-background logo splash screen, a subtle header-logo entrance, and a shared scroll-reveal animation system. The effects honor `prefers-reduced-motion`, have fallbacks, and can be disabled/adjusted in CMS settings.
- Added an Expert Team section directly below the founder content on About Us, with ten CMS-managed slots and an accessible keyboard-operable detail dialog. Disabled or unnamed slots are not published.
- Replaced the visitor counter's browser-side authoritative total with an Apps Script server-side total, script properties, a hashed visit log, and lock-protected increments/baseline changes. See the counter section below before deployment.
- Updated the configured Apps Script enquiry URL to the current URL specified by the site owner, strengthened success/error handling, and retained the contact values for the follow-on WhatsApp action.
- Added an optional local MP4 source and poster for up to five Reel items. Instagram URL/embed remains the fallback. A cross-origin Instagram iframe may still show Instagram-controlled interface because the site cannot edit its internal UI.
- Added responsive styling for the Expert Team/dialog, loading splash, reveals, local Reel video, and visitor counter, and connected the new settings to Decap CMS.
- Replaced the compatible existing logo asset at `images/uploads/logo_transparent_png_tm.png` with the supplied transparent logo without changing that URL. Existing image/video paths and the seven individual service pages are retained.

## Deploy to the existing GitHub repository

1. Download and extract this ZIP locally. Its contents are at the archive root (there is no extra top-level project folder).
2. Before replacing files, make a backup or commit of the current `main` branch. **Do not delete existing repository secrets or Cloudflare bindings.**
3. Copy the extracted project contents into the existing `assurintellec/AssurIntellec` repository working tree, allowing the revised files to replace same-named files and keeping any repository-only private configuration that is not in this package.
4. Review the diff and ensure that files under `videos/`, `images/`, and `images/uploads/` are present. Commit and push to `main`.
5. The existing Cloudflare Workers Builds workflow should perform its configured deployment. Monitor the existing build logs and deployment status. Do not create another repository or Worker and do not change DNS.
6. Verify `https://www.assurintellec.in/`, each service page, and `https://www.assurintellec.in/admin/` after deployment. If the CMS backend/authentication was customized in the live repository outside this ZIP, compare that live config before overwriting it.

This ZIP includes the revised Apps Script source for review, but an Apps Script project is separate from the website repository runtime. See the Apps Script deployment steps below; pushing the ZIP does not automatically deploy `Code.gs` to Google.

## Decap CMS editing

Use the existing `/admin/` URL and authenticate with the current GitHub/Decap flow.

### Branding, splash, and motion

Open **Site Settings → Complete Website Settings**. The **Branding & Loading Splash** fields control whether the initial logo screen appears and its display/fade duration. The **Global Animation System** controls the shared reveal system, intensity, timing, and stagger. Header/navigation and theme fields provide logo dimensions, navigation font/gaps, social icon sizes, and other visual defaults. A disabled setting should leave the site content usable without the effect.

### Expert Team

Open **Expert Team**. There are exactly ten saved profile slots. Enable a slot, set its serial/display order, name, designation, short introduction, image and alt text, then add biography, experience, qualifications, expertise, achievements, or extra information only when the real details are available. The public page orders enabled profiles by their serial/order field; an enabled slot without a name is suppressed. Turning a profile off hides it without deleting the saved data.

The first three portraits are small crops taken from the supplied reference screenshot, not full-resolution originals. Replace these with original, higher-resolution images through CMS when available. The fourth reference row has no photograph; it uses a clearly generic illustration placeholder, not an asserted photograph. No unsupported biographies, qualifications, achievements, or other personal claims have been invented. Slots 5–10 are disabled and blank by default.

Clicking a profile opens its dialog. The dialog supports Escape, a visible close control, focus management, focus restoration, and scrolling on smaller screens.

### Website Visitor Counter — read before resetting

The live value is **not** stored in `content/site.json`, HTML, or browser storage. Apps Script stores the authoritative numeric total in the script property `ASSURINTELLEC_VISITOR_TOTAL_V1`; the last applied baseline version is stored in `ASSURINTELLEC_VISITOR_BASELINE_VERSION_V1`. LockService protects the read/change/write path. A `Visitor Sessions` tab is created in the bound spreadsheet and logs a salted-by-baseline hashed token, time, counting policy, and baseline version; it does not record raw IP addresses or the raw browser token.

The default counting policy is a browser-tab session: refreshing the same tab with its session token does not increment repeatedly. It is an approximate session counter, not a count of verified individual humans. A new tab/session can count separately. It does not promise perfect bot exclusion or unique-person measurement.

The **Starting Visitor Count** is only applied as a baseline if **Baseline Reset Date / Version** is changed to a new unique value, or if there is no stored total yet. Changing the number alone intentionally does not reset the live total.

**To continue from the last known total:**

1. First allow the updated Apps Script to try a one-time read-only import from the old CounterAPI namespace/action/key. This will work only if the old service still exposes its count.
2. If that import is unavailable or the old count cannot be confirmed, enter the last known displayed total in **Starting Visitor Count** (for example `12850`) and set **Baseline Reset Date / Version** to a new unique text value, such as `2026-10-14-manual-baseline-1`.
3. Publish the settings. The first counted visit after applying a baseline of `12850` should display `12851`, then `12852` for the next new session. When resetting to `13020`, change the baseline version as well; the next counted session is `13021`.
4. Do not keep changing the baseline-version field after each publication. Only change it when you intentionally want to apply a new baseline.
5. Verify the count from two devices/browsers and refresh repeatedly in the same tab. The shared total should be returned by the server.

If the old CounterAPI import fails and you have not set a baseline, the new API deliberately reports that setup is required instead of asserting a false zero. The frontend may then show the old endpoint's read-only count as a fallback; that fallback does not provide persistent increments. Do not claim a successful persistent migration until you have checked the live counter.

The public counter endpoint is a read/count endpoint only; it does not accept a client-supplied starting count. Baseline values are read from the published, CMS-managed site settings. Protect CMS credentials and the Apps Script project as you protect your other admin credentials.

### Services, contact, social, and Reels

Existing home page/service/About/contact/footer and social content remains CMS-managed through the original collections. Reels have five fixed slots so the CMS retains a stable shape. For video-only presentation, upload an authorized MP4 in a slot's **Local MP4 Video** field and optionally upload a poster. The browser renders it through a native `<video>` element. If only an Instagram URL is provided, the page uses an Instagram embed. It cannot hide UI inside Instagram's cross-origin iframe, so use a supplied/authorized MP4 when a clean video-only appearance is required. Do not download/re-publish someone else's content without authorization. The Reel audio toggle was removed; the existing hero-video audio control is preserved.

## Google Apps Script setup (required for live counter and enquiry workflow)

The website's configured URL remains:

`https://script.google.com/macros/s/AKfycbzbex51OibeHYoRRSaKvDjxAMuvW7YLu9KrYxgVnVPFeQMJnoNFRl58jdp3mqpeDmIiHw/exec`

1. Open the existing Google Apps Script project that is bound to the existing enquiry spreadsheet. Back up the current script and sheet first.
2. Update the existing project's `Code.gs` from `integrations/Code.gs` and its HTML file `Bridge.html` from `integrations/Bridge.html`. Keep the existing spreadsheet and its `Enquiries` data; do not create a fresh spreadsheet just to deploy this ZIP.
3. In **Project Settings → Script Properties** (or the project's existing property-management UI), set `EMAIL_WORKER_URL` to the base HTTPS URL of the existing Cloudflare mail Worker (without a route suffix) and `EMAIL_WORKER_TOKEN` to the existing shared `WORKER_BRIDGE_TOKEN` value. The script normalizes a previously stored `/send` or `/health` suffix and then uses `/send` for mail and `/health` for its health check. Do not commit these values to GitHub or paste them into public website files.
4. In the existing bound spreadsheet, confirm the `Enquiries` tab and its current records remain intact. The script will create a `Visitor Sessions` tab if missing. Authorize the script's spreadsheet, URL fetch, and mail-worker access when prompted.
5. In **Deploy → Manage deployments**, edit the current Web app deployment and select **New version**. Preserve the existing deployment (and URL) rather than creating a separate deployment. It must execute as the script owner. Set access to the same intended public access level needed by the current site endpoint (`Anyone`) if the existing integration currently relies on public website requests. Review your organization's security policy before changing access.
6. Test `.../exec?action=visitor-counter&callback=testCallback&session_id=abcdefghijklmnopqrstuvwx&counting_policy=session` from a browser or test harness. It should return a JSONP response; this raw example token is for a single test only. Repeat the same token to verify the count does not increment again. Do not rely only on a `200` status; inspect the payload.
7. Test a contact enquiry and confirm: one row is added to `Enquiries`, a unique `AI-000001`-style reference is returned, the notification email reaches `info@assurintellec.in`, the customer confirmation reaches the provided customer email, and both email statuses are recorded honestly. Existing references determine the next sequential number.

The script reads the published public `content/site.json` under the counter lock for each counted request so it does not use a stale cached baseline version. Publish the CMS setting before testing a baseline reset. Google Apps Script services, actual Sheet permissions, the deployment, and the current live total cannot be proven from offline ZIP inspection alone.

## Cloudflare mail Worker and verified sender

The existing Worker source is under `cloudflare-worker/`. It still uses the existing deployment name/configuration and expects secrets to be set in the existing Cloudflare Worker environment:

- `TITAN_SMTP_USER` — must be the actual verified sending mailbox `info@assurintellec.in` for the requested From identity.
- `TITAN_SMTP_PASS` — that mailbox/provider's SMTP password or app password.
- `WORKER_BRIDGE_TOKEN` — shared secret also stored as Apps Script property `EMAIL_WORKER_TOKEN`.

Set or review them via Cloudflare's secret/environment settings (or the approved `wrangler secret` workflow), never in frontend JavaScript, JSON, HTML, this README, or a committed config file. The Worker now rejects a requested sender address that does not match the configured SMTP username. This prevents a misleading From claim; it also means the live customer email will not send as `info@assurintellec.in` unless that exact mailbox is actually configured and permitted by the SMTP provider. Confirm mail logs and a real inbox; static checks cannot verify mail delivery.

## Enquiry form and WhatsApp behavior

The Apps Script is expected to validate the enquiry, append it to the existing sheet, assign a sequential reference under a lock, send the notification, and send the customer confirmation through the existing mail Worker. The web form now waits for the bridge's actual `postMessage` result rather than interpreting iframe load as success. The success popup appears only after an affirmative backend result. Form values are intentionally retained after submission so the visitor can open WhatsApp with the same name, company, email, phone, requirement, and message. Opening WhatsApp only prefills a draft; the visitor must still tap Send in WhatsApp. No SMS integration is added.

If the Apps Script has been updated but the bridge result is not received, test the deployed `/exec` URL and allowed website origins, browser console, Apps Script executions, and Worker logs. A transport timeout can be ambiguous if the server has already processed the enquiry; check the sheet before asking the customer to resubmit.

## Reel / responsive / content checks after deploying

- Test the About page with a valid uploaded MP4 and with an Instagram-only URL, both on desktop and mobile.
- Test all five Reel slot navigation controls; blank optional slots should not appear.
- Check keyboard navigation through the profile dialog and contact success dialog.
- Check the header, footer, and forms at 320, 360/375, 390–430, 768, 1024, 1280–1366, and 1440+ pixel widths.
- Review Cloudflare build output and the browser console on each important page.

## Files of interest

- `admin/config.yml` — CMS schema and editable controls.
- `content/site.json` and `content/services.json` — published content/default settings.
- `assets/site.js` and `assets/site.css` — client functionality and responsive presentation.
- `integrations/Code.gs` and `integrations/Bridge.html` — Google Apps Script source; deploy separately.
- `cloudflare-worker/src/index.js` and `cloudflare-worker/wrangler.toml` — existing mail Worker source/configuration.
- `tests/visitor-counter-model.test.cjs` — local mocked logic checks, not a substitute for live Apps Script tests.
- `VALIDATION_REPORT.md` — checks run and outstanding live validations.

---

**Important:** this is a code/package delivery, not a claim that changes have already been deployed to your live website. Follow the external setup steps and validate the published site, CMS authentication, Sheet writes, shared counter, and real email delivery after deployment.
