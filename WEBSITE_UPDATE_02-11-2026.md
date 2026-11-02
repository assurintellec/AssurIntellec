# AssurIntellec website update — 2 November 2026

Read this guide first. It supersedes older setup instructions for the seven changes in `7.Website_Update_02-11-2026.docx`.

## Installation: the website ZIP is only one part

1. Back up the current website and Google Sheets.
2. Merge the contents of `AssurIntellec-main` into your existing website source. Keep all your existing image and video folders/files. Do not delete or replace them with the empty folders in this package. All existing content/media references, service content, contact settings, Decap backend and published integration URLs are preserved.
3. Publish the main website Worker using the existing root `wrangler.toml` / `maintenance-router.js` setup. Keep `VISITOR_COUNTER`, its existing migration and all existing secrets. A static-files-only upload does not install `/api/newsletter` or `/api/visitor-analytics`.
4. Update the existing **newsletter** Google Apps Script project using the instructions below. Do not create a new newsletter spreadsheet or deployment: the old tokens and subscriber records must stay in the same project/sheet.
5. Update the existing **enquiry** Google Apps Script project separately, using the instructions below. Keep its Bridge.html and email-worker settings.
6. If the deployed Titan mail Worker predates the inline-icon update, update it from `cloudflare-worker/src/index.js`, preserving all SMTP credentials and its existing URL. Replacing the website files does not update this separate Worker.

Large photographs and videos are intentionally excluded from the download. The tiny email icon PNGs and existing favicons are included because the email feature needs its own small assets. No external account, production deployment, spreadsheet or message was changed during preparation of this ZIP.

## 1. Social media logos in both thank-you emails

Both enquiry confirmation and newsletter welcome emails contain clickable Facebook, Instagram, LinkedIn, YouTube, WhatsApp Channel, Telegram, Threads, X and Google icons. Links come from the published `content/site.json` / Decap Social settings. Each image is embedded as a CID attachment; it does not depend on an icon-font CDN. A readable platform name accompanies every icon.

Update all relevant deployed components, not only their source files: newsletter script, enquiry script, and the separate Titan mail Worker if still old. Existing `EMAIL_WORKER_URL` / `EMAIL_WORKER_TOKEN`, SMTP username/password and sender settings stay unchanged. Some email clients control image display; their image preferences cannot be overridden by website code.

## 2–4. Newsletter, seven service tabs and unsubscribe

### Update the SAME newsletter Apps Script project

1. Open the existing newsletter spreadsheet. Choose **Extensions → Apps Script**.
2. Replace that project's `Code.gs` with `integrations/newsletter/Code.gs` from this package.
3. Add a script file named **VisitorAnalytics.gs**, and paste `integrations/newsletter/VisitorAnalytics.gs` into it. Both files belong to this newsletter project, not the enquiry project.
4. Run **setupWebsiteUpdate** once from the function dropdown and authorize its requested spreadsheet/email permissions. Setup sends no welcome emails to the existing list. It adds columns N:O (Service Keys / Previous Tokens), seven service tabs, visitor report tabs, and the existing pending-email retry trigger. If it reports an occupied column or an unrelated tab, preserve/rename that data first; do not erase your data.
5. Choose **Deploy → Manage deployments → edit the EXISTING Web app → New version → Deploy**. Execute as **Me** (the owner) and allow **Anyone**, including people who are not signed in. Do not use “Anyone with a Google account”, an owner-only deployment or a `/dev` testing URL. If your Google organization prevents anonymous web apps, the account administrator must resolve that restriction.
6. Keep the existing `/exec` URL in **Decap → Site Settings → Complete Website Settings → Newsletter & Subscriptions**. The package preserves your current URL.
7. Open `https://www.assurintellec.in/api/newsletter?action=health`. It must report `ready: true`, protocol `2026-11-02-v3`. `UPDATE_GOOGLE_DEPLOYMENT` means the old deployment is still serving, even if the editor shows the new code.

### Repeat subscribers and service lists

Every deliberate signup, including an already-active subscriber, gets a fresh thank-you acknowledgement if the mail quota/service permits. There is one master row per normalized email address. Selecting another service adds it to that person's preferences; “All service updates” includes all seven services. A resubscribe after an unsubscribe starts with the newly selected interest.

The live service tabs are:

| Tab | Included subscribers |
| --- | --- |
| 1. GMP Engineering & Compliance | Active subscribers to service 1 or all services |
| 2. Advisory & Transactions | Active subscribers to service 2 or all services |
| 3. Talent & Recruitment | Active subscribers to service 3 or all services |
| 4. Life Sciences Trade | Active subscribers to service 4 or all services |
| 5. Pharma & Laboratory Technologies | Active subscribers to service 5 or all services |
| 6. Research & Scientific Services | Active subscribers to service 6 or all services |
| 7. Pharma Solutions & Manufacturing | Active subscribers to service 7 or all services |

These are formula-driven views. Edit the master `NewsletterSubscribers` records, not the view cells. Unsubscribing removes a contact from every active service view. Export/send future newsletters only from active service views or master rows with Status = Active; an unrelated mailing system must also honor that status.

Setup consolidates historical duplicate email rows only when it finds them, first making a complete backup tab. It retains old unsubscribe tokens as aliases. Do not change or delete the hidden token columns. Pending acknowledgements retry hourly while the subscriber remains active; unsubscribe cancels pending acknowledgements. Mail quota/provider failures cannot guarantee immediate delivery.

### Why the screenshot failed and how to recover old emails

The screenshot shows an account-specific Google `/macros/u/8/s/...` address returning a Google Drive error before the script runs. New email unsubscribe links use:

`https://www.assurintellec.in/unsubscribe.html#token=PERSONAL_TOKEN`

The browser stays on your website. The website Worker calls Google without the visitor's account cookies. A GET or link preview never changes a subscription; the person selects **Unsubscribe** to confirm. Opening the link while signed out or signed into another Google account should therefore work after the website and Google web app are deployed correctly.

Already-sent emails cannot be rewritten. If an old Google link still produces that error, open `https://www.assurintellec.in/unsubscribe.html`, paste the full old unsubscribe link into its recovery field, then confirm Unsubscribe. Do not publish or share a personal token. Unsubscribe remains available even if newsletter signup is switched off.

## 5. Enquiry popup after three minutes

Default: a centered, keyboard-accessible enquiry dialog appears after **180 seconds**. It uses your existing enquiry submission, email settings and seven-service dropdown. The contact page moves the original form into the dialog and restores it when closed, so entered values are retained and duplicate forms are avoided. Other pages create one form for the dialog.

Change the delay at **Decap → Site Settings → Complete Website Settings → Timed Enquiry Popup → Delay In Seconds**. You can also edit its text or disable it. Timing continues across pages in the same tab. It appears once per browser session, defers while a visitor is typing/in another dialog, and is suppressed after a successful enquiry. The unsubscribe page never shows it. Browsers that block session storage may reset this timing on navigation.

## 6. Automatic WhatsApp confirmation and office alert

The existing **Send on WhatsApp** button remains a visitor-operated link. Automatic business-to-customer messaging is a separate server integration and needs a WhatsApp Business Platform account, a registered sender, approved templates and API access. A normal WhatsApp account or a `wa.me` link alone cannot send an automatic thank-you from your business number.

### Add to the existing ENQUIRY Apps Script project

1. Replace its `Code.gs` with `integrations/Code.gs`. Keep your existing `Bridge.html` (also included).
2. Add **WhatsApp.gs** from `integrations/WhatsApp.gs` to the same enquiry project.
3. Under **Project Settings → Script Properties**, configure the values below privately. Never add tokens to Decap, browser JavaScript, Google Sheet cells or public source.
4. Run **setupWhatsAppIntegration** once. It adds consent/status columns and one job running every minute. Previously collected enquiries are not queued or messaged.
5. Update this project's EXISTING web-app deployment to a **New version**, execute as **Me**, access **Anyone**. Keep the existing contact `/exec` URL and email worker properties.
6. Set `WA_ENABLED` to `true` only after sender and templates are ready. Newly submitted enquiries then queue office alerts and, when the visitor checks the separate optional WhatsApp consent box, customer confirmations. The scheduled job normally processes these within about a minute, subject to Google scheduling and provider availability.

| Private enquiry Script Property | Value / purpose |
| --- | --- |
| WA_ENABLED | `true` to process new WhatsApp jobs; absent/false leaves email/enquiry working |
| WA_API_VERSION | A currently supported Meta Graph version, e.g. the version shown in your Meta API setup; no version is guessed by this code |
| WA_PHONE_NUMBER_ID | Meta ID for registered sender **+91 7600666436** (not the phone number itself) |
| WA_SENDER_NUMBER | `917600666436` |
| WA_ACCESS_TOKEN | Server-side access token authorized for the customer-message sender |
| WA_CUSTOMER_TEMPLATE | Approved template name, suggested `assurintellec_enquiry_received` |
| WA_TEMPLATE_LANGUAGE | Exact approved template language, e.g. `en` or `en_US` |
| WA_ADMIN_TO | `917600666436`, as requested |
| WA_ADMIN_PHONE_NUMBER_ID | A **different registered sending number** for office alerts to 7600666436 |
| WA_ADMIN_ACCESS_TOKEN | Token for that second sender, if different from WA_ACCESS_TOKEN |
| WA_ADMIN_TEMPLATE | Approved office-alert template, suggested `assurintellec_new_enquiry` |

**The office number cannot send an API notification to itself.** To both send customer confirmations from 7600666436 and receive office alerts on 7600666436, use a second registered sender for the office alert, as above. Alternatively, keep the first sender and set WA_ADMIN_TO to another WhatsApp number. Until configured, that office-alert status reports the missing separate sender; it does not claim a message was sent.

Drafts for submitting templates to Meta are in `integrations/WHATSAPP_TEMPLATE_DRAFTS.txt`. Approval and provider charges are external to this ZIP. The customer draft includes your social links as static template text. Update/reapprove that template when social links change; Decap cannot change an already-approved WhatsApp template. Meta may classify a confirmation containing promotional/social material differently or require that material to be removed. Template acceptance is decided by Meta.

The Enquiries sheet records **WhatsApp Consent**, **Customer WhatsApp Status**, and **Admin WhatsApp Status**. “API accepted” means Meta returned a message ID, not delivery/read confirmation. Unknown/failed sends need review before retry; the job does not repeatedly send an uncertain request. Existing enquiry email behavior is preserved. Do not put a personal API token in a message to anyone.

## 7. Visitor data and rolling Google Sheet reports

The visitor backend lives in **VisitorAnalytics.gs in the newsletter project**. The website Worker supplies the request's Cloudflare IP and approximate city, region, country and timezone. Browser-supplied IP/location is ignored. No third-party IP lookup service is called.

### Activate the connection

1. Complete newsletter setup/redeployment above.
2. Generate a strong random secret of at least 32 characters in your password manager.
3. Store the SAME value as **ANALYTICS_BRIDGE_TOKEN** in (a) the newsletter Apps Script project's Script Properties and (b) the **main website Worker** secret settings. Do not put it in the separate Titan mail Worker.
4. Redeploy/restart the existing website Worker as required by your deployment method, preserving its current bindings. Its `/api/visitor-analytics` route forwards only authenticated server-to-server events to the newsletter script.
5. In Decap, **Visitor Analytics & Google Sheets** controls enabled/disabled, IP inclusion, privacy notice, permission prompt and update interval (default 60 seconds). Leave the optional analytics URL blank to reuse the newsletter URL.

By default the visitor first chooses **Allow insights** or **No thanks**. Nothing is recorded before acceptance. **Visitor privacy** in the footer reopens the preference controls; choosing No thanks stops future recording. Existing recorded rows are retained until you manage them in the Sheet. Do Not Track / Global Privacy Control is respected. The configurable notice must accurately describe whatever collection settings you choose.

| Google Sheet tab | Data / calculations |
| --- | --- |
| Website Visits | One row per page view: session, start/last-seen IST, page, active seconds, IP (optional), approximate city/region/country/timezone, referrer origin, viewport device category and sections seen |
| Visitor Dashboard | Last **1, 2, 12, 24 hours**, **15, 30, 365 days**: page views, distinct tab sessions, active minutes and average active seconds/page; formulas recalculate each minute |
| Visits By Area | Country/region/city page-view totals and active seconds across recorded dates |
| Visits By Page | Page views, total active seconds and average active seconds per page across recorded dates |

Filter Started At in Website Visits for any custom date/time range. Rolling-window counts refer to page views **started within** the window. A session is a group of page views in one browser tab with a reset after a 30-minute gap between recorded updates, not an identified person. Section labels are headings of sections that enter view, not proof that the visitor read them. “Device” is a viewport category, not fingerprinting.

Active time estimates only time on a visible page with interaction in the previous 60 seconds. Hidden/idle time is excluded. A cumulative update reuses its page-view row and sequence, so duplicate or out-of-order heartbeats do not inflate totals. Visibility change/page close attempts a final update, but browsers/network failures can prevent it. IP geolocation cannot identify an exact street, person or guaranteed physical location; VPNs/mobile networks can change it. Visitors who decline, block scripts or leave before delivery are absent from these analytics. Historical visits before installation cannot be reconstructed. Your existing visitor counter remains independent and can therefore differ from consent-based analytics.

No name, email, phone, enquiry text, full referrer path or URL query/fragment is collected. Do not make the Sheet public. Google Sheets/Apps Script have quotas and size limits; this implementation suits a modest-traffic website, not an unlimited event warehouse.

## Validation before use

Local automated checks cover repeated signup/deduplication, all seven service formulas, old-token migration and unsubscribe cancellation, website proxy validation, pending email handling, nine embedded email icons and SMTP MIME, analytics ordering/time/location handling, the rolling-period formula configuration and WhatsApp consent/self-send handling. These checks use isolated mocks and do not send real messages or modify your Google data.

Browser review covers popup rendering/close behavior, contact/newsletter controls and unsubscribe recovery. The supplied ZIP omits most media, so missing photographs/videos in a local preview are expected; restore your existing media. End-to-end Google writes, real inbox delivery and WhatsApp sends still need the account-side setup and a controlled live test after deployment.

Suggested live test: subscribe twice with an address you own, choose a different service, verify two thank-you emails but one master row and correct active tabs; unsubscribe while signed out/from another account and verify the active tabs remove it; submit an enquiry with and without WhatsApp consent; allow analytics on one browser, browse multiple pages, wait a minute and check the rows/rolling windows. Keep newsletter status Active as the only source for future mailouts.

## Primary setup references

- Google web apps / execution identity: https://developers.google.com/apps-script/guides/web
- Google web-app manifest access modes: https://developers.google.com/apps-script/manifest/web-app-api-executable
- WhatsApp Business Messaging Policy (opt-in and approved templates): https://whatsappbusiness.com/policy/
- Meta WhatsApp template message API: https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/messages/template/
- Cloudflare request location metadata: https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
