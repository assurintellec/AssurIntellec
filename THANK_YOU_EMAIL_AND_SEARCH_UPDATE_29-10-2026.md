# Thank-you email and search placement update

This update adds an automatic, branded thank-you email for new newsletter subscriptions. It includes the selected service, a website link, and that subscriber's own unsubscribe link in both the HTML and plain-text message. The search bar now sits in the white header below the navigation and social icons, beside the logo, as marked in your screenshot. On mobile, it sits below the logo/menu row.

## Update your working Google newsletter project

You already have a working Google Sheet. Keep that Sheet, its subscriber rows, and its existing web-app deployment.

1. Open your existing **newsletter Google Sheet → Extensions → Apps Script** using the Google account that owns the working newsletter. Do not open or replace the separate enquiry script.
2. Back up the existing `Code.gs`, then replace its contents with the complete **`integrations/newsletter/Code.gs`** from this ZIP. Save.
3. In the function dropdown, select **setupNewsletterEmail** and click **Run**. Review Google's permissions and allow the script to send mail from the account you are using. This function prepares the Sheet and creates one hourly retry trigger; it does not send a message to your old list.
4. Confirm columns **K:M** appear: **Welcome Email Status**, **Welcome Email Sent At**, and **Welcome Email Error**. Columns A:J and existing records are retained. Existing subscribers are marked **Skipped (existing subscriber)** so the update does not send a bulk welcome message to your historical list. Do not rename the headers.
5. Choose **Deploy → Manage deployments**. Select your existing newsletter web app and click the **Edit pencil → Version → New version → Deploy**. Keep **Execute as: Me** and **Who has access: Anyone**. Complete any authorization request. Update the existing deployment; do not delete it or create a replacement project.
6. Your existing `/exec` URL stays the same, so leave the working newsletter URL in Decap unchanged. Old unsubscribe links remain valid when you update this same deployment.

Google's deployment steps: https://developers.google.com/apps-script/concepts/deployments

## Upload the website change

1. Back up your current website and merge this ZIP's `AssurIntellec-main` files into the existing website source.
2. **Keep your current live `content/site.json` and `content/services.json`.** They contain your working newsletter URL and any newer CMS edits. Do not replace them with the older copies in this ZIP. Retain all images/videos omitted from the original upload.
3. Deploy through your existing website workflow. If deploying just the search change, replace `assets/site-assistant.js`, `assets/site-assistant.css`, and the 13 top-level website HTML pages (their search asset versions were refreshed).
4. Refresh the website with Ctrl+Shift+R. The top navy search strip is removed, and the search field is inside the white header under the menu/social icons. The purple rectangle in the screenshot was a position marker; the field uses your website's navy/gold colours.

The Apps Script change must be pasted and deployed in Google separately; uploading the ZIP alone cannot update the Google project.

## Test with an email address you own

1. Subscribe on the website with a **new test email address**, choose a service and give consent.
2. Confirm the row is **Active**, **Welcome Email Status = Sent**, and **Welcome Email Sent At** has a timestamp.
3. Check that mailbox, including Spam/Promotions. The subject is **Thank you for subscribing to AssurIntellec™**. The email shows the chosen service and **Unsubscribe from updates**.
4. Open the email's unsubscribe link. Press **Unsubscribe** on the confirmation page. Confirm the Sheet status changes to **Unsubscribed**. Opening the link alone does not change status, protecting against email link scanners.
5. Submit the same active email again: its interest updates without a duplicate row or another welcome email. A previously unsubscribed person who explicitly subscribes again receives a new welcome email.

## Sending account and email settings

- Mail is sent from the Google account that runs/deploys the script, with display name **AssurIntellec™**. Setting the display name does not change the actual sender address.
- Replies go to **info@assurintellec.in**. You can edit `senderName`, `replyTo`, and `subject` in the `NL_EMAIL` settings at the top of `Code.gs`, then save and deploy a new version.
- If you want the actual From address to be a particular company mailbox, use that Google Workspace account as the script owner/deployer. `replyTo` alone does not make it the sender.
- **Sent** means Google accepted the send request; inbox delivery and spam placement depend on the recipient's mail service.

Google MailApp reference: https://developers.google.com/apps-script/reference/mail/mail-app

## Pending or missing emails

- A saved subscription stays saved if email sending fails. Column K shows **Pending** and column M records the error. The hourly trigger retries pending messages, up to 20 per run, while the subscriber is Active.
- Google applies account-based email recipient quotas. If quota is exhausted, the message remains Pending until quota is available. Current limits: https://developers.google.com/apps-script/guides/services/quotas
- In Apps Script, check **Triggers** for `retryPendingNewsletterEmails` and **Executions** for errors. Running `setupNewsletterEmail` again does not add duplicate triggers for the same account. Run setup only with your chosen newsletter owner account.
- To retry immediately after fixing a permission error, run **retryPendingNewsletterEmails** in the editor. This actually sends any Pending welcome messages to Active subscribers; run it only when ready.
- If you manually change an existing row's welcome status to **Pending**, the retry job will send that row a welcome email. Do not change the entire historical list to Pending unless you intend to email it.
- Unsubscribed rows are excluded from retries. Continue to filter **Status = Active** when sending your later newsletters. This update sends welcome messages; it does not automatically send future service campaigns.

The existing enquiry integration, newsletter endpoint configuration, service dropdown, chatbot, visitor counter, reel fixes, website text and media are retained. No real emails were sent during local testing. Test and activate sending in your Google account using the steps above.
