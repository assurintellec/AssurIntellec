# Optional newsletter signup with an enquiry

The Send Enquiry form now offers a clear, unticked checkbox:

**Yes, email me service updates and the AssurIntellec™ newsletter.**

The note explains that this is optional, the enquiry can be sent without subscribing, and the subscriber can unsubscribe at any time.

## Client experience

1. The client fills in the existing enquiry form.
2. If they want updates, they tick the optional checkbox. A dropdown appears with the seven services and All service updates, following the existing newsletter choices.
3. The service selected under Requirement is chosen automatically for updates. The client can choose a different service or All service updates; that explicit choice is retained if the enquiry requirement changes later.
4. The submit button changes to **Send enquiry & subscribe**. One click sends the enquiry and, after the enquiry server confirms receipt, saves the newsletter subscription using the same email address.
5. The normal enquiry confirmation remains. A separate newsletter status shows whether newsletter preferences were saved. If subscription cannot be confirmed, **Retry subscription** retries only the signup, without sending another enquiry.
6. If the client closes the confirmation window, the newsletter status and retry control remain below the enquiry buttons.

Leaving the checkbox unticked sends only the enquiry. It does not remove any subscription the client already has. The separate Send on WhatsApp button keeps its existing behaviour and does not subscribe anyone.

## Google Sheet and emails

- Subscribers are saved in the existing NewsletterSubscribers tab, using the same newsletter Google Apps Script URL.
- The existing newsletter script normalizes and updates a single row per email, records consent, and provides the welcome email and personal unsubscribe link.
- Source Page is recorded as `/contact.html#enquiry-newsletter`, identifying this signup route.
- Only the email address, selected interest and consent/source information are sent to the newsletter system. The enquiry message, name and phone stay in the enquiry system.
- First-time subscribers receive the normal enquiry confirmation and the separate newsletter welcome email. Repeated active subscriptions do not trigger another welcome email under the existing script rules.
- A newsletter error does not change a successfully sent enquiry into a failed enquiry. The form keeps the visitor's entered values, as before.

## Deploy this update

1. Back up the current website and merge this ZIP into the existing source folder. Retain uploaded photos/videos omitted from the original ZIP.
2. Deploy the website files and the existing Cloudflare Worker together. The updated **newsletter-proxy.js** now supports optional enquiry signup as well as unsubscribe. Deploying just the HTML while retaining the old Worker will leave combined signup unavailable.
3. Refresh the website with Ctrl+Shift+R after deployment.
4. Keep your existing enquiry and newsletter URLs. **This feature does not change either Google script. If the previous email/unsubscribe update is already installed, no additional Google script deployment, authorization or new Sheet is needed.** If that earlier update has not been installed, follow WEBSITE_UPDATE_30-10-2026.md first.
5. This change leaves content/site.json and content/services.json unchanged from the preceding ZIP. Retain any newer live CMS edits and working URLs if you have updated them since that version.

The new website files are assets/enquiry-newsletter.js and assets/enquiry-newsletter.css. The core site script, public HTML asset references, newsletter-proxy.js and CMS schema are updated. The existing enquiry bridge, email sender settings, both Google scripts, newsletter footer form, subscriber list, media, counter, reel fixes and prior visual changes are retained.

## Decap controls

Open **Site Settings → Complete Website Settings → Newsletter & Subscriptions**.

Use **Enable Newsletter Checkbox In Enquiry Form** to turn the option on/off. The checkbox wording, consent note, dropdown label, email note, combined button text, and subscription status/retry messages are editable in the same group.

The option appears when both working Google web-app URLs are configured. The newsletter option is independent of the footer newsletter section's display switch. Disabling the new enquiry checkbox also disables enquiry-based signup at the website API.

## Verify after deployment

1. Submit an enquiry with the checkbox unticked, using an email address you own. Check that the enquiry works and no new newsletter subscription is created.
2. Use another email address you own, choose a service, tick the checkbox and press Send enquiry & subscribe. Verify the enquiry record, an Active newsletter row with the selected interest/source, and the expected emails.
3. Test All service updates and the personal unsubscribe link from the welcome email.
4. If a subscription shows a retry message, use Retry subscription and confirm that no extra enquiry row is created by that retry.

Local tests cover consent, service matching, confirmed enquiry responses, duplicate-response protection, newsletter-only retries, outdated result handling, proxy validation and existing unsubscribe behaviour. Desktop/mobile previews were checked. No real enquiries, subscriber records or emails were created during testing; complete the live verification with your own addresses after deployment.
