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

const PUBLIC_SITE_BASE_URL = "https://www.assurintellec.in";
const DEFAULT_LOGO_PATH = "/images/uploads/logo_transparent_png_tm.png";
const DEFAULT_SERVICES = [
  "GMP Engineering & Compliance",
  "Advisory & Transactions",
  "Talent & Recruitment",
  "Life Sciences Trade",
  "Pharma & Laboratory Technologies",
  "Research & Scientific Services",
  "Pharma Solutions & Manufacturing"
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
      const branding = getPublicBranding();
      const services = branding.services.length
        ? branding.services
        : DEFAULT_SERVICES.slice();

      const confirmationSubject = renderTemplate(
        normalized.confirmationEmailSubject ||
          "Thank You, {name} — Your Enquiry Has Been Received | AssurIntellec™",
        {
          name: normalized.name,
          company: normalized.company,
          email: normalized.email,
          phone: normalized.phone,
          service: normalized.service,
          message: normalized.message,
          reference: reference,
          services: services.join("\n")
        }
      );

      const confirmationTemplate =
        normalized.confirmationEmailMessage ||
`Dear {name},

Thank you for contacting AssurIntellec™. We are pleased to confirm that your enquiry has been received successfully.

Enquiry Reference: {reference}
Requirement: {service}
Company: {company}

Your Requirement Details:
{message}

Our Services
{services}

Our team will review your requirement carefully and contact you shortly to discuss the most suitable solution, scope and next steps.

Please feel free to reply to this email if you would like to provide any additional information.

We look forward to connecting with you.`;

      const renderedMainMessage = renderTemplate(
        confirmationTemplate,
        {
          name: normalized.name,
          company: normalized.company || "-",
          email: normalized.email,
          phone: normalized.phone,
          service: normalized.service,
          message: normalized.message,
          reference: reference,
          services: services.map(service => "• " + service).join("\n")
        }
      );

      const signatureText = buildCustomerSignatureText(branding);
      const confirmationBody =
        renderedMainMessage.trim() + "\n\n" + signatureText;

      const confirmationHtml = buildCustomerConfirmationHtml(
        normalized,
        reference,
        renderedMainMessage,
        branding,
        services
      );

      sendAssurIntellecEmail({
        recipient: normalized.email,
        subject: confirmationSubject,
        body: confirmationBody,
        htmlBody: confirmationHtml,
        logoUrl: branding.logoUrl,
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
          "Your enquiry was saved and the AssurIntellec notification was sent, but the customer confirmation email could not be sent. " +
          "Please verify the Titan email configuration and try again.",
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
    html: String(options.htmlBody || ""),
    logoUrl: String(options.logoUrl || ""),
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
    .replace(/\{reference\}/g, data.reference || "")
    .replace(/\{services\}/g, data.services || "");
}

function getPublicBranding() {
  const fallback = {
    ...aiEmailFallbackBranding_(),
    companyName: "AssurIntellec™",
    tagline: "Intelligent Solutions, Assured Compliance.",
    website: PUBLIC_SITE_BASE_URL,
    websiteDisplay: "www.assurintellec.in",
    phone: "+91 7600 666 436",
    email: "info@assurintellec.in",
    logoUrl: PUBLIC_SITE_BASE_URL + DEFAULT_LOGO_PATH,
    services: DEFAULT_SERVICES.slice()
  };

  try {
    const configUrl =
      PUBLIC_SITE_BASE_URL +
      "/content/site.json?email_branding=" +
      new Date().getTime();

    const response = UrlFetchApp.fetch(configUrl, {
      method: "get",
      muteHttpExceptions: true,
      followRedirects: true
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      const site = JSON.parse(response.getContentText() || "{}");
      const contact = site.contact || {};
      const media = site.media_assets || {};
      const website =
        String(contact.website || site.seo?.canonical_base || PUBLIC_SITE_BASE_URL).trim() ||
        PUBLIC_SITE_BASE_URL;
      const websiteDisplay =
        String(contact.website_display || "www.assurintellec.in").trim();
      const phone =
        String(contact.phone || "+91 7600 666 436").trim();
      const email =
        String(contact.email || "info@assurintellec.in").trim();
      const logoPath =
        String(media.logo || DEFAULT_LOGO_PATH).trim() ||
        DEFAULT_LOGO_PATH;
      const logoUrl = logoPath.match(/^https?:\/\//i)
        ? logoPath
        : PUBLIC_SITE_BASE_URL + (logoPath.startsWith("/") ? logoPath : "/" + logoPath);

      const services = getPublicServices();

      return {
        ...aiEmailBrandingFromSite_(site),
        companyName: String(site.company_name || fallback.companyName).trim(),
        tagline: String(site.tagline || fallback.tagline).trim(),
        website,
        websiteDisplay,
        phone,
        email,
        logoUrl,
        services: services.length ? services : fallback.services
      };
    }
  } catch (error) {
    console.warn("Public branding fetch failed: " + error.message);
  }

  return fallback;
}

function getPublicServices() {
  try {
    const servicesUrl =
      PUBLIC_SITE_BASE_URL +
      "/content/services.json?email_branding=" +
      new Date().getTime();

    const response = UrlFetchApp.fetch(servicesUrl, {
      method: "get",
      muteHttpExceptions: true,
      followRedirects: true
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      const payload = JSON.parse(response.getContentText() || "{}");
      const services = Array.isArray(payload.services)
        ? payload.services
        : [];

      return services
        .map(service => String(service && service.title || "").trim())
        .filter(Boolean)
        .slice(0, 20);
    }
  } catch (error) {
    console.warn("Public services fetch failed: " + error.message);
  }

  return DEFAULT_SERVICES.slice();
}

function buildCustomerSignatureText(branding) {
  return aiEmailFooterText_(branding);
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCustomerConfirmationHtml(normalized, reference, renderedMainMessage, branding, services) {
  const logoUrl = String(branding.logoUrl || "").trim();
  const logoSrc = logoUrl ? "cid:assurintellec-logo@assurintellec.in" : "";
  const servicesHtml = services
    .map(service =>
      `<li style="margin:0 0 7px;color:#334155;font-size:14px;line-height:1.5;">${escapeHtml(service)}</li>`
    )
    .join("");

  const safeWebsite = escapeHtml(branding.website);
  const safeWebsiteDisplay = escapeHtml(branding.websiteDisplay);
  const safePhone = escapeHtml(branding.phone);
  const safeEmail = escapeHtml(branding.email);
  const safeTagline = escapeHtml(branding.tagline);
  const safeCompany = escapeHtml(branding.companyName);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Enquiry Received | ${safeCompany}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f7fb;">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#ffffff;border:1px solid #e6ebf2;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:#0f2747;">
              <div style="font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#d8e7f4;margin-bottom:8px;">AssurIntellec™</div>
              <div style="font-size:25px;line-height:1.25;font-weight:700;color:#ffffff;">Enquiry Received Successfully</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 18px;color:#0f2747;font-size:17px;line-height:1.6;">Dear ${escapeHtml(normalized.name)},</p>
              <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">Thank you for contacting ${safeCompany}. We are pleased to confirm that your enquiry has been received successfully.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0;background:#f7f9fc;border:1px solid #e5eaf1;border-radius:10px;margin:0 0 24px;">
                <tr><td style="padding:12px 16px;width:150px;color:#64748b;font-size:13px;">Enquiry Reference</td><td style="padding:12px 16px;color:#0f2747;font-size:14px;font-weight:700;">${escapeHtml(reference)}</td></tr>
                <tr><td style="padding:12px 16px;border-top:1px solid #e5eaf1;color:#64748b;font-size:13px;">Requirement</td><td style="padding:12px 16px;border-top:1px solid #e5eaf1;color:#0f2747;font-size:14px;font-weight:700;">${escapeHtml(normalized.service)}</td></tr>
                <tr><td style="padding:12px 16px;border-top:1px solid #e5eaf1;color:#64748b;font-size:13px;">Company</td><td style="padding:12px 16px;border-top:1px solid #e5eaf1;color:#0f2747;font-size:14px;">${escapeHtml(normalized.company || "-")}</td></tr>
              </table>

              <div style="margin:0 0 24px;">
                <div style="font-size:14px;font-weight:700;color:#0f2747;margin-bottom:8px;">Your Requirement Details</div>
                <div style="padding:16px 18px;background:#fbfcfe;border-left:3px solid #c9a227;border-radius:6px;color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(normalized.message)}</div>
              </div>

              <div style="margin:0 0 24px;">
                <div style="font-size:14px;font-weight:700;color:#0f2747;margin-bottom:8px;">Our Services</div>
                <ul style="margin:0 0 0 20px;padding:0;">${servicesHtml}</ul>
              </div>

              <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Our team will review your requirement carefully and contact you shortly to discuss the most suitable solution, scope and next steps.</p>
              <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">Please feel free to reply to this email if you would like to provide any additional information. We look forward to connecting with you.</p>
            </td>
          </tr>
          <tr>
            <td>${aiEmailFooterHtml_(branding, logoSrc)}</td>
          </tr>
        </table>
        <div style="max-width:680px;padding:12px 10px 0;color:#94a3b8;font-size:11px;line-height:1.5;text-align:center;">This is an automated confirmation of your website enquiry. Please keep the reference number for future communication.</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
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


function aiEmailFallbackBranding_() {
  const branding = {"companyName": "AssurIntellec™", "tagline": "Intelligent Solutions, Assured Compliance.", "website": "https://www.assurintellec.in", "websiteDisplay": "www.assurintellec.in", "phone": "+91 7600 666 436", "mobilePhone": "7405660185", "email": "info@assurintellec.in", "address": "478, Surbhi The Royal Town, Navagam, Kamrej, Surat-394185", "logoUrl": "https://www.assurintellec.in/images/uploads/logo_transparent_png_tm.png"};
  branding.social = aiEmailSocialItems_([{"key": "instagram", "label": "Instagram", "url": "https://www.instagram.com/assurintellec?utm_source=qr&igsi=MW43Z3M2anZpbHo1", "icon": "fa-brands fa-instagram", "class_name": "social-instagram", "enabled": true, "header_color": "#E4405F", "footer_color": "#E4405F"}, {"key": "facebook", "label": "Facebook", "url": "https://www.facebook.com/Intellegentsolution", "icon": "fa-brands fa-facebook-f", "class_name": "social-facebook", "enabled": true, "header_color": "#1877F2", "footer_color": "#1877F2"}, {"key": "linkedin", "label": "LinkedIn", "url": "https://www.linkedin.com/in/assurintellec", "icon": "fa-brands fa-linkedin-in", "class_name": "social-linkedin", "enabled": true, "header_color": "#0A66C2", "footer_color": "#0A66C2"}, {"key": "youtube", "label": "YouTube", "url": "https://www.youtube.com/@AssurIntellec", "icon": "fa-brands fa-youtube", "class_name": "social-youtube", "enabled": true, "header_color": "#FF0000", "footer_color": "#FF0000"}, {"key": "whatsapp-channel", "label": "WhatsApp Channel", "url": "https://whatsapp.com/channel/0029VbDxVgXFCCoU5fxRbo25", "icon": "fa-brands fa-whatsapp", "class_name": "social-whatsapp-channel", "enabled": true, "header_color": "#25D366", "footer_color": "#25D366"}, {"key": "telegram", "label": "Telegram Channel", "url": "https://t.me/assurintellec", "icon": "fa-brands fa-telegram", "class_name": "social-telegram", "enabled": true, "header_color": "#0088cc", "footer_color": "#0088cc"}, {"key": "threads", "label": "Threads", "url": "https://www.threads.com/@assurintellec", "icon": "fa-brands fa-threads", "class_name": "social-threads", "enabled": true, "header_color": "#111111", "footer_color": "#FFFFFF"}, {"key": "x", "label": "X", "url": "https://x.com/AssurIntellec", "icon": "fa-brands fa-x-twitter", "class_name": "social-x", "enabled": true, "header_color": "#111111", "footer_color": "#FFFFFF"}, {"key": "google", "label": "Google", "url": "https://share.google/BDZ7i6bRNwF4qLD3S", "icon": "fa-brands fa-google", "class_name": "social-google", "enabled": true, "header_color": "#4285F4", "footer_color": "#4285F4"}]);
  return branding;
}
// Shared footer code is included in each independent Apps Script project.
function aiEmailEscape_(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function aiEmailSafeUrl_(value) { return /^https:\/\/[^\s<>"']+$/i.test(String(value || '')) ? String(value) : ''; }
function aiEmailSocialItems_(items) {
  const known = ['instagram', 'facebook', 'linkedin', 'youtube', 'whatsapp-channel', 'telegram', 'threads', 'x', 'google'];
  return (Array.isArray(items) ? items : []).filter(item => item && item.enabled !== false && known.indexOf(item.key) >= 0 && aiEmailSafeUrl_(item.url))
    .map(item => ({ key: item.key, label: String(item.label || item.key), url: aiEmailSafeUrl_(item.url), iconUrl: 'https://www.assurintellec.in/images/email-icons/' + item.key + '.png' }));
}
function aiEmailBrandingFromSite_(site) {
  const fallback = aiEmailFallbackBranding_();
  const contact = site.contact || {};
  const logo = String(site.media_assets?.logo || '').trim();
  return {
    companyName: String(site.company_name || fallback.companyName), tagline: String(site.tagline || fallback.tagline),
    website: aiEmailSafeUrl_(contact.website) || fallback.website,
    websiteDisplay: String(contact.website_display || fallback.websiteDisplay),
    phone: String(contact.phone || fallback.phone), mobilePhone: String(contact.mobile_phone || fallback.mobilePhone),
    email: String(contact.email || fallback.email),
    address: String(contact.address_display || [contact.address_line_1, contact.address_line_2, contact.address_city, contact.address_region, contact.address_postal_code, contact.address_country].filter(Boolean).join(', ') || fallback.address),
    logoUrl: aiEmailSafeUrl_(logo) || (logo.startsWith('/') ? 'https://www.assurintellec.in' + logo : fallback.logoUrl),
    social: Array.isArray(site.social?.items) ? aiEmailSocialItems_(site.social.items) : fallback.social
  };
}
function aiEmailFetchBranding_() {
  try {
    const response = UrlFetchApp.fetch('https://www.assurintellec.in/content/site.json', { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) return aiEmailBrandingFromSite_(JSON.parse(response.getContentText()));
  } catch (_) {}
  return aiEmailFallbackBranding_();
}
function aiEmailFooterText_(branding) {
  return ['Warm regards,', branding.companyName, branding.tagline, branding.websiteDisplay,
    'Office: ' + branding.phone, branding.mobilePhone ? 'Mobile: ' + branding.mobilePhone : '', branding.email, branding.address,
    '', 'Connect with AssurIntellec', ...(branding.social || []).map(item => item.label + ': ' + item.url)].filter(Boolean).join('\n');
}
function aiEmailFooterHtml_(branding, logoSource) {
  const e = aiEmailEscape_;
  const logo = logoSource || aiEmailSafeUrl_(branding.logoUrl);
  const social = (branding.social || []).map(item => '<a href="' + e(item.url) + '" target="_blank" title="' + e(item.label) + '" style="display:inline-block;margin:0 8px 8px 0;text-decoration:none"><img src="' + e(item.iconUrl) + '" alt="' + e(item.label) + '" width="36" height="36" style="display:block;border:0;border-radius:8px;width:36px;height:36px"></a>').join('');
  const phone = String(branding.phone || '').replace(/[^+0-9]/g, '');
  const mobile = String(branding.mobilePhone || '').replace(/[^+0-9]/g, '');
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f9fc;border-top:3px solid #c9a227"><tr><td style="padding:26px 28px;line-height:1.7;font-family:Arial,Helvetica,sans-serif">' +
    '<p style="margin:0 0 14px;font-size:13px;color:#52657a">Warm regards,</p>' +
    (logo ? '<a href="' + e(branding.website) + '" style="display:inline-block;text-decoration:none"><img src="' + e(logo) + '" alt="' + e(branding.companyName) + '" width="130" style="width:130px;max-width:100%;height:auto;border:0;display:block;margin:0 0 12px"></a>' : '') +
    '<p style="margin:0;font-size:18px;font-weight:bold;color:#0b1f3a">' + e(branding.companyName) + '</p>' +
    '<p style="margin:2px 0 14px;font-size:12px;color:#796219">' + e(branding.tagline) + '</p>' +
    '<p style="margin:0 0 4px;font-size:12px;color:#52657a">' + e(branding.address) + '</p>' +
    '<p style="margin:0;font-size:13px;color:#34495f"><strong>Office</strong> <a href="tel:' + e(phone) + '" style="color:#123f73;text-decoration:none">' + e(branding.phone) + '</a>' +
    (mobile ? ' &nbsp; | &nbsp; <strong>Mobile</strong> <a href="tel:' + e(mobile) + '" style="color:#123f73;text-decoration:none">' + e(branding.mobilePhone) + '</a>' : '') + '</p>' +
    '<p style="margin:2px 0 16px;font-size:13px"><a href="mailto:' + e(branding.email) + '" style="color:#123f73;text-decoration:none">' + e(branding.email) + '</a><br><a href="' + e(branding.website) + '" style="color:#123f73;text-decoration:none;font-weight:bold">' + e(branding.websiteDisplay) + '</a></p>' +
    (social ? '<p style="margin:0 0 9px;font-size:10px;font-weight:bold;letter-spacing:1.4px;color:#52657a;text-transform:uppercase">Connect with AssurIntellec</p><div style="font-size:0;line-height:1">' + social + '</div>' : '') +
    '</td></tr></table>';
}
