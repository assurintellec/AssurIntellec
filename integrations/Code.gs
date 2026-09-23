const SHEET_NAME = "Enquiries";
const TO_EMAIL = "info@assurintellec.in";
const DEFAULT_FROM_EMAIL = "info@assurintellec.in";
const REFERENCE_PROPERTY = "ASSURINTELLEC_ENQUIRY_SEQUENCE";
const REFERENCE_PREFIX = "AI";
const REFERENCE_DIGITS = 6;

function doGet() {
  return ContentService
    .createTextOutput("AssurIntellec Enquiry Service is active.");
}

function doPost(e) {
  try {
    const data = e && e.parameter ? e.parameter : {};

    const name = String(data.name || "").trim();
    const company = String(data.company || "").trim();
    const email = String(data.email || "").trim();
    const phone = String(data.phone || "").trim();
    const service = String(data.service || "").trim();
    const message = String(data.message || "").trim();

    if (!name || !email || !phone || !service || !message) {
      return jsonResponse({
        success: false,
        message: "Required fields are missing."
      });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error("Sheet '" + SHEET_NAME + "' was not found.");
    }

    const reference = generateEnquiryReference(sheet);

    ensureReferenceHeader(sheet);

    sheet.appendRow([
      new Date(),
      name,
      company,
      email,
      phone,
      service,
      message,
      reference
    ]);

    const adminSubject =
      "New AssurIntellec™ Website Enquiry | " + reference + " | " + name;

    const adminBody =
`NEW ASSURINTELLEC™ WEBSITE ENQUIRY

Enquiry Reference: ${reference}

Name: ${name}
Company: ${company}
Email: ${email}
Phone / WhatsApp: ${phone}
Service / Requirement: ${service}

Requirement:
${message}

Submitted from:
https://www.assurintellec.in/

Customer confirmation email:
${String(data.confirmation_email_enabled || "true") === "true" ? "Enabled" : "Disabled"}`;

    sendAssurIntellecEmail(
      TO_EMAIL,
      adminSubject,
      adminBody,
      TO_EMAIL,
      "AssurIntellec™ Website"
    );

    const confirmationEnabled =
      String(data.confirmation_email_enabled || "true") === "true";

    if (confirmationEnabled) {
      const confirmationSubject =
        String(
          data.confirmation_email_subject ||
          "Thank You for Contacting AssurIntellec™ | Enquiry Received"
        ).trim();

      const confirmationTemplate =
        String(data.confirmation_email_message || "").trim() ||
`Dear {name},

Thank you for connecting with AssurIntellec™.

We have successfully received your enquiry and appreciate your interest in our pharmaceutical, life sciences and compliance solutions.

Enquiry Reference: {reference}

Our team will carefully review your requirements and contact you shortly to discuss the most suitable solution.

Please feel free to reply to this email if you would like to provide any additional information.

We look forward to connecting with you.

Warm regards,
AssurIntellec™
Intelligent Solutions. Assured Compliance.
www.assurintellec.in
info@assurintellec.in`;

      const confirmationBody = renderTemplate(
        confirmationTemplate,
        {
          name: name,
          company: company,
          email: email,
          phone: phone,
          service: service,
          message: message,
          reference: reference
        }
      );

      const fromEmail =
        String(
          data.confirmation_email_from ||
          DEFAULT_FROM_EMAIL
        ).trim();

      sendAssurIntellecEmail(
        email,
        confirmationSubject,
        confirmationBody,
        fromEmail,
        "AssurIntellec™"
      );
    }

    return jsonResponse({
      success: true,
      reference: reference
    });

  } catch (error) {
    console.error(error);

    return jsonResponse({
      success: false,
      message: error.message || "Unexpected error"
    });
  }
}

function sendAssurIntellecEmail(
  recipient,
  subject,
  body,
  preferredFrom,
  senderName
) {
  const options = {
    name: senderName || "AssurIntellec™",
    replyTo: preferredFrom || TO_EMAIL
  };

  try {
    const aliases = GmailApp.getAliases() || [];
    const effectiveEmail =
      String(Session.getEffectiveUser().getEmail() || "")
        .trim()
        .toLowerCase();

    const requestedFrom =
      String(preferredFrom || TO_EMAIL)
        .trim()
        .toLowerCase();

    const usableFrom =
      aliases
        .map(a => String(a).trim().toLowerCase())
        .indexOf(requestedFrom) !== -1 ||
      effectiveEmail === requestedFrom;

    if (usableFrom) {
      options.from = requestedFrom;
    }

    GmailApp.sendEmail(
      recipient,
      subject,
      body,
      options
    );

  } catch (gmailError) {
    // Fall back to MailApp so the enquiry is not lost if Gmail alias handling
    // is unavailable in the account running this Apps Script.
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: body,
      replyTo: preferredFrom || TO_EMAIL,
      name: senderName || "AssurIntellec™"
    });
  }
}

function renderTemplate(template, data) {
  return String(template || "")
    .replace(/\{name\}/g, data.name || "")
    .replace(/\{company\}/g, data.company || "")
    .replace(/\{email\}/g, data.email || "")
    .replace(/\{phone\}/g, data.phone || "")
    .replace(/\{service\}/g, data.service || "")
    .replace(/\{message\}/g, data.message || "")
    .replace(/\{reference\}/g, data.reference || "");
}

function ensureReferenceHeader(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(value => String(value || "").trim());

  let referenceColumn = headers.indexOf("Enquiry Reference") + 1;

  if (!referenceColumn) {
    referenceColumn = Math.max(lastColumn + 1, 8);
    sheet.getRange(1, referenceColumn).setValue("Enquiry Reference");
  }

  return referenceColumn;
}

function generateEnquiryReference(sheet) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const properties = PropertiesService.getScriptProperties();
    let current = Number(
      properties.getProperty(REFERENCE_PROPERTY) || 0
    );

    if (!current) {
      current = findHighestExistingReferenceNumber(sheet);
    }

    const next = current + 1;

    properties.setProperty(
      REFERENCE_PROPERTY,
      String(next)
    );

    return REFERENCE_PREFIX + "-" +
      String(next).padStart(REFERENCE_DIGITS, "0");

  } finally {
    lock.releaseLock();
  }
}

function findHighestExistingReferenceNumber(sheet) {
  const referenceColumn = ensureReferenceHeader(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return 0;

  const values = sheet
    .getRange(
      2,
      referenceColumn,
      lastRow - 1,
      1
    )
    .getValues()
    .flat();

  let highest = 0;

  values.forEach(value => {
    const match = String(value || "")
      .trim()
      .match(new RegExp("^" + REFERENCE_PREFIX + "-(\\d+)$", "i"));

    if (match) {
      highest = Math.max(
        highest,
        Number(match[1])
      );
    }
  });

  if (!highest) {
    highest = Math.max(0, lastRow - 1);
  }

  return highest;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}

function authorize() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  MailApp.getRemainingDailyQuota();
  GmailApp.getAliases();
}
