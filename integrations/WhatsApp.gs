/* Compatibility replacement for the old paid API file.
   Replace the OLD WhatsApp.gs in the enquiry project with THIS file, or delete
   that file entirely. Run setupFreeWhatsAppMode from Code.gs once.
   No Meta API credentials, templates, subscription or API calls are used. */
function setupWhatsAppIntegration() { setupFreeWhatsAppMode(); }
function sendPendingEnquiryWhatsApp() { return; }
