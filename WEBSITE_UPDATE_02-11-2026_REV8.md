# AssurIntellec — Word document 8 update, 2 November 2026

This guide supersedes the WhatsApp, enquiry-email-icon and visitor-report instructions in the earlier 2 November guide. The earlier newsletter/unsubscribe instructions still apply. This package contains source changes only; it has not changed your live accounts or sent messages.

## Changes requested in the Word file

1. Removed the optional paid WhatsApp API confirmation checkbox from the contact form and timed popup. Removed that option from Decap. The enquiry script no longer queues any WhatsApp API messages. The replacement WhatsApp.gs is a harmless compatibility file.
2. Added **Send on WhatsApp** inside the successful-enquiry thank-you dialog, on the contact page and on other pages using the popup. It uses a snapshot of the submitted enquiry plus the returned reference, so editing the form later cannot change that confirmation's WhatsApp message. The customer still presses Send inside WhatsApp. The existing form button and its phone/template settings are preserved.
3. Fixed the enquiry thank-you email's social-icon compatibility. Updated mail Workers advertise inline-image support and receive matching PNG CID attachments. An older mail Worker gets ordinary HTTPS PNG icon URLs instead of CID references it cannot handle. One enquiry never causes a duplicate email just to retry icons. The newsletter's working embedded icons are unchanged.
4. Added **All recorded visits** above the seven rolling report periods. A separate **Website counter snapshot** at J:K shows the configured starting value, new counted visits and combined total. A read-only Google trigger refreshes it every five minutes; it does not increment the counter or collect IPs. Added authenticated analytics setup checks and bounded browser retries, plus an owner-facing connection checker at `/admin/visitor-check.html`.

Existing website content, form recipients, enquiry/newsletter /exec URLs, CMS backend, visitor-counter identity/binding/migration, service content and media paths are preserved. Keep your existing large photographs and videos. The nine small email icon PNGs are included and must be uploaded.

## A. Update the website files

1. Back up your existing source.
2. Merge the contents of `AssurIntellec-main` into the current website source. Keep the existing image/video files that are not included in this ZIP.
3. Deploy the EXISTING main website Worker using the root `wrangler.toml` and `maintenance-router.js`. Keep `VISITOR_COUNTER`, its migration and existing secrets. Do not use the separate mail Worker's configuration for the main site.
4. Check that a small icon, for example `/images/email-icons/instagram.png`, opens as an image on your published website.
5. New thank-you controls are editable in **Decap > Site Settings > Complete Website Settings > Contact & Enquiry**: Show WhatsApp Button In Enquiry Thank You, Thank You WhatsApp Button Text, Thank You WhatsApp Help Text. The existing WhatsApp Phone Number and WhatsApp Prefill Template are still used.

A static-only upload updates the form UI, but does not install the backend API routes needed for the counter and visitor reports.

## B. Update the existing ENQUIRY Google Apps Script project

1. Open the spreadsheet with the **Enquiries** tab, then **Extensions > Apps Script**. This is not the newsletter project.
2. Replace its `Code.gs` with `integrations/Code.gs` from this ZIP.
3. Replace the old `WhatsApp.gs` with `integrations/WhatsApp.gs` from this ZIP, or delete that old script file. Do not leave the old API sender code running.
4. Keep `Bridge.html` and the existing `EMAIL_WORKER_URL` / `EMAIL_WORKER_TOKEN` values.
5. Select **setupFreeWhatsAppMode > Run**, authorize as needed. This sets WA_ENABLED=false and removes the old WhatsApp sending trigger, leaving other triggers intact. Old WhatsApp status columns are retained as history; new enquiries do not queue paid messages.
6. **Deploy > Manage deployments > edit the EXISTING Web app > New version > Deploy**. Execute as **Me**, access **Anyone**. Preserve the same /exec URL.
7. For embedded email icons, update the EXISTING separate mail Worker from `cloudflare-worker/src/index.js`, preserving its URL, WORKER_BRIDGE_TOKEN, TITAN_SMTP_USER, TITAN_SMTP_PASS and other settings. If it is not updated yet, the new enquiry script automatically uses the included public PNGs instead. Some email clients may ask the recipient to allow remote images in this fallback mode.

## C. Enable the FREE WhatsApp Business greeting

1. Open WhatsApp Business for your business number +91 7600666436.
2. **Tools > Greeting message > Send greeting message: ON**.
3. Enter your thank-you wording, choose **Recipients > Everyone**, then **Save**.
4. Keep that phone connected to the internet.
5. Customer flow: submit the website enquiry, choose **Send on WhatsApp** in the thank-you dialog, then press **Send** inside WhatsApp. Customers can also use the original form WhatsApp button.

The free greeting is triggered by an incoming WhatsApp message on first contact or after 14 days of inactivity. It is not triggered by the website's Send Enquiry button alone and is not a per-enquiry personalised API reply. No Meta API token, paid template, subscription or API purchase is needed for this flow.

Official instructions: https://faq.whatsapp.com/501866148528310/

## D. Activate visitor totals, rolling reports and IP recording

1. Open the existing NEWSLETTER spreadsheet, then **Extensions > Apps Script**.
2. Replace `Code.gs` with `integrations/newsletter/Code.gs` and replace/add `VisitorAnalytics.gs` from the same folder. Do not put these files in the enquiry project.
3. Run **setupWebsiteUpdate** once and authorize. This preserves existing subscribers and visit rows, adds/updates the report formulas, and installs **syncWebsiteCounterSnapshot** every five minutes. Existing newsletter triggers remain.
4. Open **Project Settings > Script Properties**. Setup creates **ANALYTICS_BRIDGE_TOKEN** if missing; an existing value is preserved. Copy that private value.
5. In Cloudflare, select the MAIN website Worker **assurintellec**, open **Settings > Variables and Secrets**, and add/update a Secret named **ANALYTICS_BRIDGE_TOKEN** with exactly the same value. Do not put it in site.json, Decap, the spreadsheet or the separate mail Worker. Deploy the updated main Worker.
6. In Google, **Deploy > Manage deployments > edit the EXISTING newsletter Web app > New version > Deploy**, execute as **Me**, access **Anyone**. Keep the current newsletter /exec URL. Saving the editor alone does not update the public deployment.
7. Open `https://www.assurintellec.in/admin/visitor-check.html`. The counter and Google Sheets visitor-report checks should both say **Connected**. The checker shows configuration only, not visit records or IPs.
8. In Decap, keep **Visitor Analytics & Google Sheets > Enabled**, **Require consent**, and **Collect IP** as configured. An empty analytics URL reuses the existing newsletter URL.
9. Open your website in a fresh browser session and choose **Allow insights**. Browse two pages. In the newsletter spreadsheet, **Website Visits** should receive rows containing the server-provided IP, approximate location, page/sections and active time. The default heartbeat updates about every minute. Cloudflare may not supply every location field; no precise street location is inferred.
10. Check **Visitor Dashboard**. Row 2 is all recorded detailed page views; row 6 is the last 24 hours. Other rows cover 1, 2, 12 hours and 15, 30, 365 days. The separate J:K area shows your footer-style total = configured start + new counted visits. Run **syncWebsiteCounterSnapshot** manually if you want to refresh that total immediately instead of waiting five minutes.

### What each total means

- **Website counter total:** the preserved starting value (currently 148160) plus new counter visits. It is independent of detailed analytics consent. The refresh trigger only reads it and never adds a visit.
- **All recorded visits / rolling periods:** consented detailed page-view records retained in Website Visits, with separate browser-tab sessions. They do not add the historic starting value to a 24-hour period.
- **IP / location:** recorded for new permitted visits when enabled and supplied by the host. Visitors who decline, use Do Not Track/GPC, block scripts or cannot reach the endpoint are not included in detailed reports.
- Old IPs, dates, durations and 24-hour counts cannot be reconstructed from an arbitrary starting number. No fictitious historical visit rows are created.
- If counter refresh fails, the spreadsheet retains its last confirmed total and shows a connection message instead of replacing it with zero.

### Connection checker messages

| Message | Action |
|---|---|
| Not serving the website API | Deploy the root main Worker and its routes, not only HTML/assets. |
| MISSING_BRIDGE_SECRET | Put the newsletter script's ANALYTICS_BRIDGE_TOKEN in the main Worker secret settings. |
| MISSING_GOOGLE_URL | Check the published newsletter /exec URL in Decap. |
| BRIDGE_AUTH_FAILED | Make the private token identical in both places. |
| UPDATE_GOOGLE_DEPLOYMENT | Replace both newsletter script files, run setupWebsiteUpdate and deploy a new version. |
| RUN_ANALYTICS_SETUP | Run setupWebsiteUpdate in the correct newsletter project. |
| GOOGLE_CONNECTION_FAILED | Check /exec and Web app access Me / Anyone, then redeploy. |
| Connected but no detailed rows | Allow insights on a public page; check privacy controls/blockers and new visits. |

## Validation performed on this source package

18 isolated automated checks pass: newsletter/unsubscribe regression, free-mode shutdown, old/new SMTP icon paths and MIME attachments, exact WhatsApp field/reference URLs, counter snapshot reading without increments, edge-sourced IP/counter validation, idempotent visit updates, all-time and rolling formulas, and analytics diagnostics without data leakage. JavaScript/Apps Script syntax and CMS YAML parse checks pass. Existing CMS content, service/media references and supplied image bytes are preserved.

Desktop, 390px mobile and generated-popup browser checks verify the removed checkbox, thank-you button/link, retained form data and dialog wrapping. Browser submissions used a local mock and did not send email or WhatsApp. The uploaded ZIP intentionally excludes most large media. Real inbox rendering and Google/Cloudflare data flow must be tested after the above redeployments; no external systems were changed in this update.
