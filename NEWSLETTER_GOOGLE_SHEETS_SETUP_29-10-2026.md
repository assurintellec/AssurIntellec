# AssurIntellec newsletter — step-by-step setup

The website now includes a newsletter section above the footer. A visitor enters an email address, selects an interest, checks the consent box, and presses Subscribe. Google Sheets stores the record in the Google account you use for the setup below.

**Already working?** Follow **THANK_YOU_EMAIL_AND_SEARCH_UPDATE_29-10-2026.md** to update the SAME Google project and deployment, enable welcome emails, and retain your existing subscriber list and website settings. The steps below describe a new setup.

## Dropdown choices

| Choice | Updates the subscriber is selecting |
| --- | --- |
| All service updates | Updates across all seven services |
| GMP Engineering & Compliance | GMP, facilities, cleanrooms, HVAC, utilities and validation |
| Advisory & Transactions | Due diligence, facilities, assets and transaction opportunities |
| Talent & Recruitment | Pharmaceutical jobs, recruitment and talent opportunities |
| Life Sciences Trade | APIs, excipients, chemicals and sourcing opportunities |
| Pharma & Laboratory Technologies | Pharmaceutical machinery, laboratory equipment and technologies |
| Research & Scientific Services | Research, formulation and scientific-service updates |
| Pharma Solutions & Manufacturing | Product development and manufacturing-coordination updates |

The displayed service names follow your enabled service records in Decap. Keep the existing service slugs unchanged; the receiving script validates those seven identifiers.

## 1. Add the website files

1. Make a backup of your current website.
2. Extract the final ZIP and merge the `AssurIntellec-main` files into the same website repository/folder.
3. Retain photos/videos omitted from the original upload. If you have made newer edits through Decap, retain your current `content/site.json` and `content/services.json` rather than replacing those with older content from the ZIP.
4. Deploy using your existing website deployment method. The newsletter's new controls will appear in Decap. Until you configure the newsletter URL, the public Subscribe button stays disabled and shows “Newsletter subscriptions will open soon.” No false subscription success is displayed.

## 2. Create your Google Sheet

1. Sign into the Google account that should own the mailing list.
2. Open [Google Sheets](https://sheets.google.com) and create a blank spreadsheet.
3. Name it **AssurIntellec Newsletter Subscribers**.
4. Keep the spreadsheet's Share setting **Restricted**. Website visitors do not need access to the Sheet.

## 3. Add the receiving script

1. In that spreadsheet, select **Extensions → Apps Script**.
2. Name the project **AssurIntellec Newsletter Subscription**.
3. Open the default `Code.gs` file.
4. Remove the starter code and paste the entire contents of **`integrations/newsletter/Code.gs`** from this ZIP.
5. Save the project.

Use this NEW newsletter project. Keep the existing enquiry Apps Script project and its website URL unchanged.

## 4. Prepare the subscriber tab

1. In the function dropdown at the top of the Apps Script editor, choose **setupNewsletterEmail**. This also prepares the Sheet and installs the hourly welcome-email retry job.
2. Click **Run**.
3. Review and approve Google's permission request for the script you just created. Use the same Google account that owns the spreadsheet.
4. Return to the spreadsheet. A tab named **NewsletterSubscribers** will be present with these columns:

| Column | Purpose |
| --- | --- |
| Subscribed At | Date/time of the first subscription |
| Email | Subscriber's email address |
| Service Interest | Selected service or All service updates |
| Status | Active or Unsubscribed |
| Last Updated | Date/time of the latest preference change |
| Consent | Yes, recorded from the required checkbox |
| Consent Version | Identifier for the consent wording |
| Source Page | Website page where the visitor subscribed |
| Unsubscribe URL | Individual unsubscribe link for personalized emails |
| Unsubscribe Token | Hidden technical column; keep it unchanged |
| Welcome Email Status | Sent, Pending, Cancelled, or Skipped for pre-existing subscribers |
| Welcome Email Sent At | Date/time Google accepted the welcome email |
| Welcome Email Error | Last sending error, if a message is Pending |

Keep the generated headers unchanged. The setup uses the spreadsheet's ID internally and sets the spreadsheet time zone to Asia/Kolkata. You do not need to paste a Sheet ID or Gmail password into the website.

## 5. Deploy the Google web app

1. In Apps Script, choose **Deploy → New deployment**.
2. Select **Web app** as the deployment type.
3. Enter a description such as **AssurIntellec newsletter signup**.
4. Set **Execute as → Me**.
5. Set **Who has access → Anyone** so visitors can subscribe without signing into Google.
6. Click **Deploy** and complete any authorization prompt.
7. Copy the **Web app URL** ending in `/exec`.

Use the deployed `/exec` URL, not the script editor's `/edit` URL or a `/dev` test-deployment URL. Google documents the deployment and execution options in its [web-app guide](https://developers.google.com/apps-script/guides/web).

## 6. Connect it in Decap

1. Open **https://www.assurintellec.in/admin/**.
2. Open **Site Settings → Complete Website Settings → Newsletter & Subscriptions**.
3. Turn **Enable Newsletter Section** ON.
4. Paste the copied `/exec` URL into **Newsletter Google Apps Script Web App URL**.
5. Adjust the section heading, description, labels and messages if desired.
6. Save and Publish. Allow your normal website deployment to finish.

This newsletter URL is separate from **Contact & Enquiry → Google Apps Script URL**. Do not replace the enquiry URL.

## 7. Test before promoting the newsletter

1. Open the published website in a private/incognito window.
2. Scroll to the newsletter section above the footer.
3. Use an email address you own, select a service, check consent and click Subscribe.
4. Wait for the confirmed success message.
5. Open **NewsletterSubscribers** and confirm the new row and its **Active** status.
6. Subscribe with the same email and a different service. The existing row should update its interest rather than create a duplicate. Select **All service updates** to receive updates about all seven categories.
7. Open that row's individual Unsubscribe URL in your browser and press **Unsubscribe**. The row's status should become **Unsubscribed**. Opening the link alone does not change the status.
8. Check the new subscriber's mailbox for the automatic thank-you email, selected service and personal unsubscribe link. Column K should show Sent. Check the Spam/Promotions folders too.

The website shows success only after receiving the script's saved-result response. An iframe loading by itself is never treated as successful storage. If the response cannot be confirmed, the visitor sees an error and can retry; duplicate emails still update a single row.

## 8. Send an update to the appropriate subscribers

1. Open **NewsletterSubscribers** and use the filter in **Status** to show only **Active**.
2. In **Service Interest**, select the service you are mailing about AND **All service updates**. For a general newsletter, include all interests.
3. Copy the visible addresses in the **Email** column, excluding the header.
4. In Gmail, compose your newsletter. Use **Bcc** for the subscriber addresses so subscribers cannot see each other's addresses. Put your own address in To.
5. Include a clear opt-out instruction, for example **“To stop receiving these updates, reply UNSUBSCRIBE.”** Mark those addresses **Unsubscribed** in the Sheet before your next mailing.
6. If you send personalized messages, include each recipient's own **Unsubscribe URL** from their row. Do not put one person's individual unsubscribe link into a shared Bcc campaign.

Google Sheets supports filtering by selected values; see [Google's filter instructions](https://support.google.com/docs/answer/3540681?hl=en). Follow your account's [current Gmail sending limits](https://support.google.com/mail/answer/22839?hl=en). This integration sends automatic welcome emails with personal unsubscribe links. Future marketing campaigns are sent separately. Welcome emails use the script owner's Google account and are subject to [Apps Script email quotas](https://developers.google.com/apps-script/guides/services/quotas).

## Updating the script later

Save changes in Apps Script, then select **Deploy → Manage deployments → Edit → New version → Deploy**. Updating the same deployment preserves its existing URL. If you create a different deployment URL, update the newsletter URL in Decap and publish again.

## If a subscription does not appear

- Confirm the `/exec` URL is correct, the setup function ran successfully, and the deployment allows Anyone.
- In Apps Script, open **Executions** to inspect the receiving script's error.
- Confirm the tab is still named NewsletterSubscribers and the headers have not been renamed.
- Confirm you saved AND published the newsletter settings in Decap and the website deployment finished.
- The Google Sheet/web app must be configured in your account before real email collection can start. This ZIP alone cannot authorize access to your Google account.

Existing website text, media, enquiry integration, search, chatbot and prior fixes are retained.
