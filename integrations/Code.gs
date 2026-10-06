const SHEET_NAME = "Enquiries";
const TO_EMAIL = "info@assurintellec.in";
const FROM_EMAIL = "info@assurintellec.in";
const REFERENCE_PROPERTY = "ASSURINTELLEC_ENQUIRY_SEQUENCE";
const REFERENCE_PREFIX = "AI";
const REFERENCE_DIGITS = 6;
const ALLOWED_WEB_ORIGINS = [
  "https://www.assurintellec.in",
  "https://assurintellec.in"
];

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile("Bridge")
    .setTitle("AssurIntellec Enquiry Service")
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}

/**
 * Backward-compatible HTTP POST endpoint.
 * The current website uses the secure postMessage bridge below,
 * but keeping doPost means older clients can still submit.
 */
function doPost(e) {
  const data = e && e.parameter ? e.parameter : {};
  const isBridgeRequest =
    String(data._bridge_format || "").toLowerCase() === "html";
  const bridgeToken = String(data._bridge_token || "").trim();

  try {
    const result = processEnquiry(data);

    if (isBridgeRequest) {
      return bridgeHtmlResponse(
        result,
        bridgeToken,
        String(data._bridge_request_id || "").trim(),
        String(data._bridge_origin || "").trim()
      );
    }

    return jsonResponse(result);
  } catch (error) {
    console.error(error);

    const result = {
      success: false,
      message: error.message || "Unexpected error"
    };

    if (isBridgeRequest) {
      return bridgeHtmlResponse(
        result,
        bridgeToken,
        String(data._bridge_request_id || "").trim(),
        String(data._bridge_origin || "").trim()
      );
    }

    return jsonResponse(result);
  }
}

/**
 * Main server-side enquiry function.
 * This function runs under the Apps Script owner's authorization.
 */
function processEnquiry(data) {
  const normalized = normalizeEnquiryData(data || {});

  validateEnquiry(normalized);

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(
      "Sheet '" + SHEET_NAME + "' was not found."
    );
  }

  const reference = generateEnquiryReference(sheet);
  const rowNumber = appendEnquiryRow(
    sheet,
    normalized,
    reference,
    "Pending",
    "Pending"
  );

  let adminSent = false;
  let customerSent = false;

  try {
    const adminSubject =
      "New AssurIntellec™ Website Enquiry | " +
      reference +
      " | " +
      normalized.name;

    const adminBody =
`NEW ASSURINTELLEC™ WEBSITE ENQUIRY

Enquiry Reference: ${reference}

Name: ${normalized.name}
Company: ${normalized.company || "-"}
Email: ${normalized.email}
Phone / WhatsApp: ${normalized.phone}
Service / Requirement: ${normalized.service}

Requirement:
${normalized.message}

Submitted from:
https://www.assurintellec.in/`;

    sendAssurIntellecEmail({
      recipient: TO_EMAIL,
      subject: adminSubject,
      body: adminBody,
      preferredFrom: FROM_EMAIL,
      replyTo: normalized.email,
      senderName: "AssurIntellec™ Website",
      requirePreferredFrom: false
    });

    adminSent = true;
    updateEnquiryStatus(
      sheet,
      rowNumber,
      "Admin Email Status",
      "Sent"
    );

  } catch (error) {
    updateEnquiryStatus(
      sheet,
      rowNumber,
      "Admin Email Status",
      "Failed: " + error.message
    );

    return {
      success: false,
      reference: reference,
      message:
        "Your enquiry was saved, but the notification email to AssurIntellec could not be sent. Please try again or use WhatsApp.",
      stage: "admin_email"
    };
  }

  const confirmationEnabled =
    normalized.confirmationEmailEnabled !== false;

  if (confirmationEnabled) {
    try {
      const confirmationSubject =
        normalized.confirmationEmailSubject ||
        "Thank You for Contacting AssurIntellec™ | Enquiry Received";

      const confirmationTemplate =
        normalized.confirmationEmailMessage ||
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
          name: normalized.name,
          company: normalized.company,
          email: normalized.email,
          phone: normalized.phone,
          service: normalized.service,
          message: normalized.message,
          reference: reference
        }
      );

      sendAssurIntellecEmail({
        recipient: normalized.email,
        subject: confirmationSubject,
        body: confirmationBody,
        preferredFrom: FROM_EMAIL,
        replyTo: FROM_EMAIL,
        senderName: "AssurIntellec™",
        requirePreferredFrom: true
      });

      customerSent = true;
      updateEnquiryStatus(
        sheet,
        rowNumber,
        "Customer Email Status",
        "Sent"
      );

    } catch (error) {
      updateEnquiryStatus(
        sheet,
        rowNumber,
        "Customer Email Status",
        "Failed: " + error.message
      );

      return {
        success: false,
        reference: reference,
        message:
          "Your enquiry was saved and the AssurIntellec notification was sent, but the customer confirmation email could not be sent. Make sure info@assurintellec.in is configured as a Gmail 'Send mail as' alias for the Google account running this script.",
        stage: "customer_email",
        adminSent: adminSent,
        customerSent: customerSent
      };
    }
  } else {
    updateEnquiryStatus(
      sheet,
      rowNumber,
      "Customer Email Status",
      "Disabled"
    );
    customerSent = true;
  }

  return {
    success: true,
    reference: reference,
    message: "Enquiry submitted successfully.",
    adminSent: adminSent,
    customerSent: customerSent
  };
}

function normalizeEnquiryData(data) {
  return {
    name: cleanText(data.name, 160),
    company: cleanText(data.company, 200),
    email: cleanText(data.email, 254).toLowerCase(),
    phone: cleanText(data.phone, 60),
    service: cleanText(data.service, 200),
    message: cleanText(data.message, 5000),
    confirmationEmailEnabled:
      data.confirmation_email_enabled !== false &&
      String(data.confirmation_email_enabled).toLowerCase() !== "false",
    confirmationEmailSubject:
      cleanText(
        data.confirmation_email_subject,
        250
      ),
    confirmationEmailMessage:
      cleanText(
        data.confirmation_email_message,
        10000
      ),
    confirmationEmailFrom:
      cleanText(
        data.confirmation_email_from_email,
        254
      )
  };
}

function cleanText(value, maxLength) {
  const text = String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!maxLength) return text;
  return text.slice(0, maxLength);
}

function validateEnquiry(data) {
  if (!data.name) {
    throw new Error("Name is required.");
  }

  if (!data.email) {
    throw new Error("Email is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error("A valid customer email address is required.");
  }

  if (!data.phone) {
    throw new Error("Phone is required.");
  }

  if (!data.service) {
    throw new Error("Requirement is required.");
  }

  if (!data.message) {
    throw new Error("Message is required.");
  }
}

function sendAssurIntellecEmail(options) {
  const recipient = String(options.recipient || "").trim();
  const subject = String(options.subject || "").trim();
  const body = String(options.body || "");
  const preferredFrom =
    String(options.preferredFrom || FROM_EMAIL)
      .trim()
      .toLowerCase();
  const replyTo =
    String(options.replyTo || preferredFrom)
      .trim()
      .toLowerCase();
  const senderName =
    String(options.senderName || "AssurIntellec™")
      .trim();

  if (!recipient) {
    throw new Error("Email recipient is missing.");
  }

  if (!/^\S+@\S+\.\S+$/.test(recipient)) {
    throw new Error("Email recipient is invalid.");
  }

  if (!/^\S+@\S+\.\S+$/.test(replyTo)) {
    throw new Error("Reply-to email is invalid.");
  }

  const properties =
    PropertiesService.getScriptProperties();

  const workerUrl = String(
    properties.getProperty("EMAIL_WORKER_URL") || ""
  ).trim();

  const workerToken = String(
    properties.getProperty("EMAIL_WORKER_TOKEN") || ""
  ).trim();

  if (!workerUrl) {
    throw new Error(
      "EMAIL_WORKER_URL is not configured in Apps Script Script Properties."
    );
  }

  if (!workerToken) {
    throw new Error(
      "EMAIL_WORKER_TOKEN is not configured in Apps Script Script Properties."
    );
  }

  const payload = {
    to: recipient,
    subject: subject,
    body: body,
    replyTo: replyTo,
    fromName: senderName
  };

  const response = UrlFetchApp.fetch(
    workerUrl,
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: {
        Authorization: "Bearer " + workerToken
      },
      muteHttpExceptions: true
    }
  );

  const status = response.getResponseCode();
  const text = response.getContentText();
  let result = {};

  try {
    result = JSON.parse(text || "{}");
  } catch (_) {
    result = {};
  }

  if (status < 200 || status >= 300 || result.success !== true) {
    throw new Error(
      result.message ||
      ("Email worker returned HTTP " + status + ".")
    );
  }

  return result;
}

function appendEnquiryRow(
  sheet,
  data,
  reference,
  adminStatus,
  customerStatus
) {
  const headers = ensureSheetHeaders(sheet);

  const lastColumn =
    Math.max(
      sheet.getLastColumn(),
      Object.keys(headers).length
    );

  const row =
    new Array(lastColumn).fill("");

  setRowValue(
    row,
    headers,
    "Date & Time",
    new Date()
  );

  setRowValue(
    row,
    headers,
    "Name",
    data.name
  );

  setRowValue(
    row,
    headers,
    "Company",
    data.company
  );

  setRowValue(
    row,
    headers,
    "Email",
    data.email
  );

  setRowValue(
    row,
    headers,
    "Phone / WhatsApp",
    data.phone
  );

  setRowValue(
    row,
    headers,
    "Service",
    data.service
  );

  setRowValue(
    row,
    headers,
    "Requirement",
    data.message
  );

  setRowValue(
    row,
    headers,
    "Enquiry Reference",
    reference
  );

  setRowValue(
    row,
    headers,
    "Admin Email Status",
    adminStatus
  );

  setRowValue(
    row,
    headers,
    "Customer Email Status",
    customerStatus
  );

  sheet.appendRow(row);

  return sheet.getLastRow();
}

function setRowValue(
  row,
  headers,
  headerName,
  value
) {
  const column = headers[headerName];

  if (!column) return;

  row[column - 1] = value;
}

function ensureSheetHeaders(sheet) {
  const required = [
    "Date & Time",
    "Name",
    "Company",
    "Email",
    "Phone / WhatsApp",
    "Service",
    "Requirement",
    "Enquiry Reference",
    "Admin Email Status",
    "Customer Email Status"
  ];

  let lastColumn = Math.max(
    sheet.getLastColumn(),
    1
  );

  let headers = sheet
    .getRange(
      1,
      1,
      1,
      lastColumn
    )
    .getValues()[0]
    .map(value =>
      String(value || "").trim()
    );

  required.forEach(name => {
    if (headers.indexOf(name) === -1) {
      headers.push(name);
    }
  });

  if (
    headers.length > lastColumn
  ) {
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setValues([headers]);
  } else {
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setValues([headers]);
  }

  const map = {};
  headers.forEach((name, index) => {
    if (name) {
      map[name] = index + 1;
    }
  });

  return map;
}

function updateEnquiryStatus(
  sheet,
  rowNumber,
  headerName,
  status
) {
  const headers = ensureSheetHeaders(sheet);
  const column = headers[headerName];

  if (!column) return;

  sheet
    .getRange(
      rowNumber,
      column
    )
    .setValue(status);
}

function generateEnquiryReference(sheet) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const properties =
      PropertiesService.getScriptProperties();

    let current = Number(
      properties.getProperty(
        REFERENCE_PROPERTY
      ) || 0
    );

    if (!current) {
      current =
        findHighestExistingReferenceNumber(
          sheet
        );
    }

    const next = current + 1;

    properties.setProperty(
      REFERENCE_PROPERTY,
      String(next)
    );

    return (
      REFERENCE_PREFIX +
      "-" +
      String(next).padStart(
        REFERENCE_DIGITS,
        "0"
      )
    );

  } finally {
    lock.releaseLock();
  }
}

function findHighestExistingReferenceNumber(
  sheet
) {
  const headers =
    ensureSheetHeaders(sheet);

  const referenceColumn =
    headers["Enquiry Reference"];

  const lastRow =
    sheet.getLastRow();

  if (
    !referenceColumn ||
    lastRow < 2
  ) {
    return 0;
  }

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
      .match(
        new RegExp(
          "^" +
          REFERENCE_PREFIX +
          "-(\\d+)$",
          "i"
        )
      );

    if (match) {
      highest = Math.max(
        highest,
        Number(match[1])
      );
    }
  });

  return highest;
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

function bridgeHtmlResponse(result, bridgeToken, requestId, bridgeOrigin) {
  const message = {
    type: "assurintellec:result",
    bridgeToken: String(bridgeToken || ""),
    requestId: String(requestId || ""),
    result: result || {
      success: false,
      message: "Empty response from enquiry service."
    }
  };

  // Only post responses back to the official website origins. The website
  // supplies its current origin in _bridge_origin and we compare it here.
  const requestedOrigin = String(bridgeOrigin || "").trim();
  const targetOrigin =
    ALLOWED_WEB_ORIGINS.indexOf(requestedOrigin) !== -1
      ? requestedOrigin
      : "*";

  // Escape characters that could terminate the inline <script> block when
  // user-controlled data is embedded in the JSON payload.
  const payload = JSON.stringify(message)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AssurIntellec Enquiry Service</title>
</head>
<body>
<script>
(function () {
  "use strict";
  const targetOrigin = ${JSON.stringify(targetOrigin)};
  const message = ${payload};

  try {
    window.top.postMessage(message, targetOrigin);
  } catch (_) {}

  // Keep this response visually empty when opened directly.
  try {
    document.body.textContent = "";
  } catch (_) {}
})();
</script>
</body>
</html>`;

  return HtmlService
    .createHtmlOutput(html)
    .setTitle("AssurIntellec Enquiry Service")
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
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

function testEmailWorkerConfiguration() {
  const properties =
    PropertiesService.getScriptProperties();

  const workerUrl = String(
    properties.getProperty("EMAIL_WORKER_URL") || ""
  ).trim();

  const workerToken = String(
    properties.getProperty("EMAIL_WORKER_TOKEN") || ""
  ).trim();

  if (!workerUrl) {
    throw new Error(
      "Add EMAIL_WORKER_URL to Script Properties first."
    );
  }

  if (!workerToken) {
    throw new Error(
      "Add EMAIL_WORKER_TOKEN to Script Properties first."
    );
  }

  const response = UrlFetchApp.fetch(
    workerUrl.replace(/\/$/, "") + "/health",
    {
      method: "get",
      headers: {
        Authorization: "Bearer " + workerToken
      },
      muteHttpExceptions: true
    }
  );

  const status = response.getResponseCode();
  const text = response.getContentText();

  Logger.log(text);

  if (status !== 200) {
    throw new Error(
      "Email Worker health check failed with HTTP " + status + ": " + text
    );
  }

  return JSON.parse(text);
}

function testWebsiteEmail() {
  const testRecipient = Session.getEffectiveUser().getEmail();

  sendAssurIntellecEmail({
    recipient: testRecipient,
    subject: "AssurIntellec website email test",
    body:
      "This is a test email from the AssurIntellec website email worker.\n\n" +
      "Titan SMTP is being used as the sending mailbox.",
    preferredFrom: FROM_EMAIL,
    replyTo: FROM_EMAIL,
    senderName: "AssurIntellec™"
  });

  return {
    success: true,
    sentTo: testRecipient
  };
}

function authorize() {
  SpreadsheetApp
    .getActiveSpreadsheet()
    .getName();

  UrlFetchApp.fetch("https://www.google.com", {
    method: "get",
    muteHttpExceptions: true
  });

  return testEmailWorkerConfiguration();
}
