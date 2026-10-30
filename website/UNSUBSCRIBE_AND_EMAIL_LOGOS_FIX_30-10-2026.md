# Unsubscribe and clickable email logos — 30 October 2026

Use this guide instead of the earlier email/unsubscribe deployment instructions. Website uploads alone cannot update an already deployed Google script or the separate Titan email Worker.

## What was corrected

- The website checks the request against its own origin, then uses the existing public integration identity when forwarding to Google. This fixes private review hosts being rejected by the Google script's public-origin allowlist, without allowing arbitrary browser origins in Google.
- Unsubscribe also initializes independently of the header, service content and animations. It accepts personal links with a fragment or query token.
- A static host returning an HTML page with HTTP 200, an older Worker, or a network failure no longer stops the fallback. The Google bridge still requires a matching request token and trusted Google origin. An iframe loading is never counted as success.
- Older Google unsubscribe links now display a real confirmation form in Google instead of looping back to the website. GET opens a confirmation page; only the subscriber's confirmed POST changes the Sheet.
- Repeated unsubscribe requests are safe. Only the matching token's row changes to Unsubscribed. Pending welcome mail is cancelled, and other rows stay unchanged.
- All nine social PNGs are bundled inside both Google scripts. Newsletter MailApp sends them as inline CID images. The existing Titan Worker now supports the same CID images for enquiry confirmations. Each logo and its visible platform name form one direct link to the current enabled social profile. These icons do not depend on public `/images/email-icons/` being uploaded or on an external icon/font service.
- A read-only deployment check identifies a missing or outdated Google deployment. It never returns subscriber information or sends email.

## Required deployment — complete each part

### 1. Existing newsletter Google project

1. Open the Google Sheet that already stores your newsletter subscribers → **Extensions → Apps Script**.
2. Replace only that project's `Code.gs` with the complete `integrations/newsletter/Code.gs` in this update. Keep the same project, Sheet and Script Properties.
3. Save. Select **setupNewsletterEmail → Run** and approve the permissions for your own script if prompted. This refreshes links in column I and keeps subscriber tokens, status, consent and data. It does not send to the historical list.
4. **Deploy → Manage deployments → select the existing newsletter web app → pencil Edit → Version: New version → Deploy**. Keep **Execute as: Me** and **Who has access: Anyone**. Keep the subscriber Sheet itself Restricted.
5. Retain the same canonical `/macros/s/…/exec` URL already configured in Decap. Do not use a `/dev` URL or create a different project. Merely pressing Save does not update the deployed web app.

### 2. Existing Titan email Worker

This is the separate `assurintellec-titan-mail` Worker used by enquiry thank-you emails, not the website Worker.

1. Deploy the updated `cloudflare-worker/src/index.js` to this SAME existing Worker. Its `cloudflare-worker/wrangler.toml` retains the existing name and entry point. For the existing CLI workflow, run `npx wrangler deploy` from `cloudflare-worker/`.
2. Retain the existing `TITAN_SMTP_USER`, `TITAN_SMTP_PASS` and `WORKER_BRIDGE_TOKEN` secrets. Do not delete or recreate the Worker, rotate its secrets, change its URL, or paste secrets into source code.
3. This adds inline PNG MIME parts to the existing SMTP mail. The sender, recipients, SMTP host, authentication and plain-text administrator notification remain as configured.

### 3. Existing enquiry Google project

1. Open the separate Apps Script project already used by Send Enquiry.
2. Replace its `Code.gs` with `integrations/Code.gs` from this update. Keep `Bridge.html`, all Script Properties, `EMAIL_WORKER_URL` and `EMAIL_WORKER_TOKEN` unchanged.
3. Save, then update the SAME existing web-app deployment to **New version**, retaining its existing URL and execution/access settings. Deploy the Titan Worker before this step so it can handle the attached icons.
4. This adds the embedded logo payload and linked footer. It retains the existing enquiry validation, Sheet columns, reference sequence, recipient, administrator notification, customer message and delivery service.

### 4. Website source

For your existing public Cloudflare project, merge the updated files under `website/` into the existing project root and deploy the website Worker and assets together. Keep `newsletter-proxy.js` beside `maintenance-router.js`. The surrounding private review framework must not be copied into the public project.

The small update ZIP contains only changed files and the same relative directory structure. It can be merged into the preceding `AssurIntellec_Private_Source` package. If applying directly to the original public repository, use only the contents of its `website/` folder. For a private review host, also update `app/api/newsletter/route.ts`, then rebuild using the existing private-host workflow. No public or private deployment was changed by preparing this download.

Do not replace newer CMS content with an old snapshot. `content/site.json`, `content/services.json`, `admin/config.yml`, image/video content and media placements are unchanged in this update.

## Check deployment before testing a subscriber

1. Open your existing newsletter `/exec` URL with `?action=health` appended. The response should contain `service: assurintellec-newsletter`, `protocol: 2026-10-30-v2`, and `ready: true`.
2. Open `https://www.assurintellec.in/api/newsletter?action=health` after deploying the website. It should return `ready: true`. Use the equivalent path on a private review host for private testing.
3. A Google HTML welcome/error page or an older protocol means the new version is not deployed, the URL is wrong, or access is not Anyone. Go back to **Manage deployments**, select the existing deployment and deploy **New version**. An HTML page at the website API path means the website Worker route has not been installed.

These health checks are read-only; they do not create records, send messages or unsubscribe anyone.

## Verify with an address you own

1. Subscribe with a new address you own. Confirm Active in column D and Sent in column K. Existing active subscribers intentionally do not receive a duplicate welcome email.
2. Open the NEW thank-you message. Check the nine enabled social logos and platform names; click each to open its profile. Email clients can still hide images according to the recipient's settings, so visible linked names and plain-text links are retained.
3. Open **Unsubscribe from updates**. Opening it must leave the row Active. Press **Unsubscribe** once. Success must coincide with column D changing to Unsubscribed. Pressing it again is harmless.
4. If the website cannot confirm, use its alternative unsubscribe form. Older Google links also offer an independent confirmation form after the updated Google deployment is active.
5. Send a test enquiry using your own address and check its normal reference number and embedded social footer. For the combined enquiry/newsletter option, both parts must retain their separate confirmed results.

Already delivered emails cannot be edited. Use the refreshed personal link in column I for an older broken email. Keep personal token links private. Filter the Sheet to **Status = Active** before using it for future newsletters; an exported mailing list must also respect opt-outs.

## Validation completed

Mocked Google/Sheet/Mail tests cover subscription, per-token unsubscribe, repeat requests, safe existing-sheet migration, no mail after opt-out, welcome retry and all nine exact attached PNGs. Client tests cover static HTML API responses, network failures, trusted Google bridge confirmation and initialization independent of site.js. Proxy tests cover public/private host origins, missing/old deployments and cookie-free forwarding. SMTP output is decoded using an independent MIME parser to verify linked inline PNG parts and preserved plain text. No real subscription, enquiry, email or unsubscribe was submitted during testing.

The live public site and Google-account deployment could not be verified from this editing session. Complete the deployment and owner-address checks above before treating the fix as live.

Google references:
- https://developers.google.com/apps-script/concepts/deployments
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/reference/mail/mail-app
