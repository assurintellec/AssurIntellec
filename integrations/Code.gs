const SHEET_NAME = "Enquiries";
const TO_EMAIL = "info@assurintellec.in";

function doGet() {
  return ContentService
    .createTextOutput("AssurIntellec Enquiry Service is active.");
}

function doPost(e) {
  try {
    const data = e.parameter || {};

    const name = (data.name || "").trim();
    const company = (data.company || "").trim();
    const email = (data.email || "").trim();
    const phone = (data.phone || "").trim();
    const service = (data.service || "").trim();
    const message = (data.message || "").trim();

    if (!name || !email || !phone || !service || !message) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: "Required fields are missing."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error("Sheet '" + SHEET_NAME + "' was not found.");
    }

    sheet.appendRow([
      new Date(),
      name,
      company,
      email,
      phone,
      service,
      message
    ]);

    const subject =
      "New AssurIntellec Website Enquiry - " + name;

    const body =
`NEW ASSURINTELLEC WEBSITE ENQUIRY

Name: ${name}
Company: ${company}
Email: ${email}
Phone / WhatsApp: ${phone}
Service: ${service}

Requirement:
${message}

Submitted from:
https://www.assurintellec.in/`;

    MailApp.sendEmail({
      to: TO_EMAIL,
      subject: subject,
      body: body,
      replyTo: email,
      name: "AssurIntellec Website"
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error(error);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function authorize() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  MailApp.getRemainingDailyQuota();
}
