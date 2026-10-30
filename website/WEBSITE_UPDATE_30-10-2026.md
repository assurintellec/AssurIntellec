# Website update 30 October 2026

This ZIP applies the five requests in `6.Website_Update_30-10-2026.docx`. Merge the website files into your existing project and update the two existing Google Apps Script projects as described below. The Google scripts do not update merely by uploading website files.

## Changes included

1. **Unsubscribe:** new personal links open `unsubscribe.html` on the website. The subscriber confirms before the status changes. The website Worker contacts Google without the visitor's signed-in Google account cookies. This avoids opening the account-specific Google `/u/2/` page shown in the screenshot. Only a confirmed successful response displays an unsubscribe success message.
2. **Thank-you email footers:** both newsletter and enquiry confirmations include the company logo/name, tagline, address, office/mobile details, email, website, and clickable PNG social icons. Enabled links are read from your published website settings. The enquiry's existing submission, reference numbering, administrator notification and email worker settings are preserved.
3. **Hero:** the existing video uses a complete 16:9 frame with `object-fit: contain`, preserving all edges. The four existing icons and their text now appear over the video with a transparent background. On phones, the main hero text appears below the video so the entire video and readable copy both fit. The video file, text, icon order and media settings are retained.
4. **Header:** navigation text increases from 18px to 21px and social icons from 36px to 42px. The header wraps as needed, keeping all links visible. Search stays below the menu/social icons. Both sizes remain editable through the existing Decap theme fields.
5. **Animated logo preloader:** the existing compact company logo appears with a gold orbit, gentle pulse and loading line during page loading and internal page transitions. It dismisses when ready, with a seven-second fail-open limit. It respects reduced-motion preferences and does not delay a ready page just to play an animation.

## 1 Update the website files

1. Back up the current website source and Google script code.
2. Extract the ZIP. Merge the contents of `AssurIntellec-main` into the same source folder/repository used by the existing website.
3. Keep all existing photos, videos and uploaded media that were omitted from the original ZIP. They are not deleted or replaced by this update. The new `images/email-icons` folder must be uploaded, since the emails use those public PNG files.
4. This ZIP's `content/site.json` includes the current published newsletter settings retrieved on 30 October 2026, plus the requested size increases. The enquiry endpoint, newsletter endpoint, contact details, social links, counter settings, hero media paths and service content are retained. If you made newer CMS edits after this snapshot, keep those newer settings and set **Theme → Nav Font Size = 21** and **Social Icon Size = 42** rather than reverting them.
5. Deploy your existing Cloudflare project using the included root `wrangler.toml` and `maintenance-router.js`, with the new `newsletter-proxy.js` alongside them. Deploy the Worker and static files together through your current workflow; copying only HTML to an older Worker will not install the new `/api/newsletter` route.
6. Keep **MAINTENANCE_MODE = OFF** for normal operation. Existing counter bindings and migrations are retained.

## 2 Update the existing newsletter Google script

1. Sign into the Google account that owns the working subscriber Sheet. Open that Sheet → **Extensions → Apps Script**.
2. Replace the existing newsletter project's `Code.gs` with the complete contents of **`integrations/newsletter/Code.gs`** from this ZIP. Keep the SAME project and Sheet.
3. Save. Select **setupNewsletterEmail → Run**. Review and approve the permissions required by your own script. The new footer reads public website settings, so Google may request permission to connect to an external service in addition to the previously authorized Sheet/email access.
4. Setup refreshes column **I — Unsubscribe URL** to each subscriber's personal website link. It retains the token, email, selected interest, consent, dates and subscription status. It does not send welcome messages to the historical list or change existing Active/Unsubscribed statuses.
5. Choose **Deploy → Manage deployments → select the existing newsletter web app → Edit pencil → Version: New version → Deploy**. Keep **Execute as: Me** and **Who has access: Anyone**.
6. Keep the same working `/exec` URL in Decap. Updating the existing deployment retains that URL. Do not create a replacement deployment or change the enquiry URL.

## 3 Update the separate enquiry Google script

1. Open your **existing enquiry Apps Script project**. This is the project currently used by the Send Enquiry form, separate from the newsletter project.
2. Replace its `Code.gs` with the complete contents of **`integrations/Code.gs`** from this ZIP. Keep `Bridge.html` and all existing Script Properties, including `EMAIL_WORKER_URL` and `EMAIL_WORKER_TOKEN`, unchanged.
3. Save, then choose **Deploy → Manage deployments → select the current enquiry web app → Edit pencil → Version: New version → Deploy**.
4. Keep its current execution/access settings and the same enquiry `/exec` URL in Decap. The change adds the new customer-email footer; it does not replace the existing email delivery system.

Google's deployment instructions: https://developers.google.com/apps-script/concepts/deployments

## 4 Verify with your own email address

1. Open the deployed website and refresh with **Ctrl+Shift+R**. Check the larger header, search position, preloader and transparent four-icon row over the full video.
2. Subscribe using a new email address you own. Confirm the Sheet row is Active, the welcome email status is Sent, the selected service is correct, and the footer's social icons open the correct profiles.
3. Open the email's **Unsubscribe from updates** link. It should open the website's unsubscribe page. Press **Unsubscribe** and confirm the Sheet status changes to Unsubscribed. Opening the link alone must not change status.
4. Check the row's **Unsubscribe URL** in column I. It should begin with `https://www.assurintellec.in/unsubscribe.html#token=`. A new welcome email uses this same kind of link.
5. Submit a test enquiry using an email address you own. Check the normal reference number, administrator notification, Sheet record and branded customer email footer.

## Old emails and troubleshooting

- Links already embedded in previously delivered emails cannot be rewritten. Setup replaces the links stored in the Sheet, and all new welcome messages use website links. If an older message opens Google's error page, use that subscriber's updated link from column I or manually mark their row Unsubscribed at their request. Do not share one subscriber's personal link with the entire list.
- The screenshot's `/macros/u/2/` URL is consistent with Google's documented multiple-account limitation. New website links and server-side forwarding avoid that browser navigation. Google reference: https://developers.google.com/apps-script/guides/support/troubleshooting#issues_with_multiple_google_accounts
- If the website cannot confirm unsubscribe, check that BOTH the new Worker route and the updated newsletter Apps Script version are deployed. A saved edit in the Google editor alone does not update the public `/exec` deployment. Existing active subscriptions are never silently deleted.
- Keep public Google web-app access set to Anyone. The Sheet itself stays Restricted. Do not publish the subscriber list.
- PNG social icons may be hidden until a recipient allows email images; links, alt labels and the plain-text contact/social links are included as well.
- The currently published hero file is HEVC video in an MP4 container, 1280×720. This update preserves that file. Playback support depends on the browser/device; an H.264/AAC MP4 at the same dimensions is more broadly compatible if you later choose to replace it through Decap. The 16:9 display does not crop either codec.

## Decap controls

- Existing **Theme → Nav Font Size** and **Theme → Social Icon Size** control the increased sizes.
- New **Animated Logo Preloader** controls enable/disable, optional logo and loading label. The existing compact company mark is used by default. A small logo image loads faster than the large original uploaded logo.
- Social links and enabled flags continue to come from the existing social settings. Changes published there are used by future thank-you emails.

## Verification completed

JavaScript and both Google script files passed syntax checks. Local tests cover subscription validation, duplicate suppression, welcome retries, status-preserving link migration, confirmed unsubscribe, unsafe recipient/link rejection, the Google-cookie-free proxy, and both email footers. Desktop/mobile browser checks cover the 16:9 geometry, transparent strip, enlarged navigation/menu, preloader and unsubscribe confirmation page. No real emails were sent and no live subscriber statuses were changed during testing. Complete the live checks after deploying the scripts in your account.

Earlier setup guides remain in the ZIP for reference; use this 30 October guide for the current update.
