import { connect } from 'cloudflare:sockets';

const SMTP_HOST = 'smtpout.secureserver.net';
const SMTP_PORT = 465;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function cleanHeader(value) {
  return String(value ?? '').replace(/[\r\n]/g, ' ').trim();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function b64(value) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function encodeHeader(value) {
  const text = cleanHeader(value);
  if (/^[\x20-\x7E]*$/.test(text)) return text;
  return `=?UTF-8?B?${b64(text)}?=`;
}

function encodeBody(value) {
  const encoded = b64(String(value ?? ''));
  const lines = encoded.match(/.{1,76}/g) || [''];
  return lines.join('\r\n');
}

function encodeBytes(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const encoded = btoa(binary);
  const lines = encoded.match(/.{1,76}/g) || [''];
  return lines.join('\r\n');
}

function sanitizeMimeType(value) {
  const type = cleanHeader(value || 'image/png').toLowerCase();
  return /^image\/(png|jpeg|jpg|gif|webp|svg\+xml)$/.test(type)
    ? type
    : 'image/png';
}

async function fetchInlineLogo(url) {
  const logoUrl = cleanHeader(url || '');
  if (!/^https?:\/\//i.test(logoUrl)) return null;

  try {
    const separator = logoUrl.includes('?') ? '&' : '?';
    const response = await fetch(logoUrl + separator + 'email_cid=' + Date.now(), {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) return null;

    const contentType = sanitizeMimeType(response.headers.get('content-type'));
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength || buffer.byteLength > 5 * 1024 * 1024) return null;

    let extension = contentType.split('/')[1] || 'png';
    if (extension === 'jpeg') extension = 'jpg';
    if (extension === 'svg+xml') extension = 'svg';

    return {
      contentType,
      filename: `assurintellec-logo.${extension}`,
      bodyBase64: encodeBytes(buffer),
    };
  } catch (error) {
    console.error('Inline logo fetch failed:', error);
    return null;
  }
}

function buildMimeBody(message, inlineLogo) {
  const htmlBody = String(message.html || '').trim();

  if (!htmlBody) {
    // Plain-text messages are base64 encoded below, so the top-level
    // Content-Transfer-Encoding header MUST explicitly declare base64.
    // Without this header, Titan/Gmail can display the MIME/base64 payload
    // literally instead of decoding it.
    return {
      contentType: 'text/plain; charset=UTF-8',
      contentTransferEncoding: 'base64',
      body: encodeBody(message.body || ''),
    };
  }

  const altBoundary = `alt_${crypto.randomUUID().replace(/-/g, '')}`;
  const relatedBoundary = `rel_${crypto.randomUUID().replace(/-/g, '')}`;
  const html = inlineLogo
    ? htmlBody
    : htmlBody.replace(
        /cid:assurintellec-logo@assurintellec\.in/gi,
        cleanHeader(message.logoUrl || ''),
      );

  const lines = [];

  if (inlineLogo) {
    lines.push(
      `--${relatedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      '',
    );
  }

  lines.push(
    `--${altBoundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBody(message.body || ''),
    `--${altBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBody(html),
    `--${altBoundary}--`,
  );

  if (inlineLogo) {
    lines.push(
      `--${relatedBoundary}`,
      `Content-Type: ${inlineLogo.contentType}; name="${inlineLogo.filename}"`,
      'Content-Transfer-Encoding: base64',
      'Content-ID: <assurintellec-logo@assurintellec.in>',
      `Content-Disposition: inline; filename="${inlineLogo.filename}"`,
      '',
      inlineLogo.bodyBase64,
      `--${relatedBoundary}--`,
    );
  }

  return {
    contentType: inlineLogo
      ? `multipart/related; boundary="${relatedBoundary}"`
      : `multipart/alternative; boundary="${altBoundary}"`,
    body: lines.join('\r\n'),
  };
}

async function readSmtpResponse(reader) {
  const decoder = new TextDecoder();
  let buffer = '';
  const deadline = Date.now() + 15000;

  while (Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) throw new Error('Titan SMTP connection closed unexpectedly.');
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (/^\d{3} /.test(line)) {
        const code = Number(line.slice(0, 3));
        return { code, text: line };
      }
    }
  }

  throw new Error('Timed out waiting for Titan SMTP response.');
}

async function sendSmtpCommand(writer, reader, command, expectedCodes) {
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(command + '\r\n'));
  const response = await readSmtpResponse(reader);
  if (!expectedCodes.includes(response.code)) {
    throw new Error(`Titan SMTP rejected command (${response.code}): ${response.text}`);
  }
  return response;
}

async function sendTitanMail(env, message) {
  const username = String(env.TITAN_SMTP_USER || '').trim();
  const password = String(env.TITAN_SMTP_PASS || '');

  if (!username || !password) {
    throw new Error('Titan SMTP credentials are not configured in the Worker.');
  }
  if (!isEmail(username)) {
    throw new Error('TITAN_SMTP_USER is not a valid email address.');
  }

  const socket = connect(
    { hostname: SMTP_HOST, port: SMTP_PORT },
    { secureTransport: 'on', allowHalfOpen: false },
  );

  await socket.opened;
  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();

  try {
    const greeting = await readSmtpResponse(reader);
    if (greeting.code !== 220) {
      throw new Error(`Titan SMTP greeting failed: ${greeting.text}`);
    }

    await sendSmtpCommand(writer, reader, 'EHLO assurintellec.in', [250]);
    await sendSmtpCommand(writer, reader, 'AUTH LOGIN', [334]);
    await sendSmtpCommand(writer, reader, b64(username), [334]);
    await sendSmtpCommand(writer, reader, b64(password), [235]);

    await sendSmtpCommand(writer, reader, `MAIL FROM:<${username}>`, [250]);
    await sendSmtpCommand(writer, reader, `RCPT TO:<${message.to}>`, [250, 251]);
    await sendSmtpCommand(writer, reader, 'DATA', [354]);

    const fromName = encodeHeader(message.fromName || 'AssurIntellec™');
    const subject = encodeHeader(message.subject || 'Website enquiry');
    const replyTo = cleanHeader(message.replyTo || username);
    const to = cleanHeader(message.to);

    const inlineLogo = message.logoUrl ? await fetchInlineLogo(message.logoUrl) : null;
    const mimeMessage = buildMimeBody(message, inlineLogo);
    const transportHeaders = [
      `From: ${fromName} <${username}>`,
      `To: <${to}>`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@assurintellec.in>`,
      `Reply-To: <${replyTo}>`,
      'MIME-Version: 1.0',
      `Content-Type: ${mimeMessage.contentType}`,
      ...(mimeMessage.contentTransferEncoding
        ? [`Content-Transfer-Encoding: ${mimeMessage.contentTransferEncoding}`]
        : []),
      '',
      mimeMessage.body,
      '.',
      '',
    ].join('\r\n');

    await writer.write(new TextEncoder().encode(transportHeaders));
    const sent = await readSmtpResponse(reader);
    if (sent.code !== 250) {
      throw new Error(`Titan SMTP rejected the message (${sent.code}): ${sent.text}`);
    }

    await sendSmtpCommand(writer, reader, 'QUIT', [221, 250]);
  } finally {
    try { writer.releaseLock(); } catch (_) {}
    try { reader.releaseLock(); } catch (_) {}
    try { await socket.close(); } catch (_) {}
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': 'https://www.assurintellec.in',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type, authorization',
          'access-control-max-age': '86400',
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health' && request.method === 'GET') {
      const auth = request.headers.get('authorization') || '';
      if (auth !== `Bearer ${env.WORKER_BRIDGE_TOKEN}`) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
      }
      return json({ ok: true, service: 'AssurIntellec Titan SMTP Worker' });
    }

    if (url.pathname !== '/send' || request.method !== 'POST') {
      return json({ success: false, message: 'Not found.' }, 404);
    }

    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${env.WORKER_BRIDGE_TOKEN}`) {
      return json({ success: false, message: 'Unauthorized.' }, 401);
    }

    try {
      const body = await request.json();
      const message = {
        to: cleanHeader(body.to),
        subject: cleanHeader(body.subject),
        body: String(body.body ?? ''),
        html: String(body.html ?? ''),
        logoUrl: cleanHeader(body.logoUrl || ''),
        replyTo: cleanHeader(body.replyTo || env.TITAN_SMTP_USER),
        fromName: cleanHeader(body.fromName || 'AssurIntellec™'),
      };

      if (!isEmail(message.to)) {
        return json({ success: false, message: 'Invalid recipient email.' }, 400);
      }
      if (!isEmail(message.replyTo)) {
        return json({ success: false, message: 'Invalid reply-to email.' }, 400);
      }
      if (!message.subject) {
        return json({ success: false, message: 'Email subject is required.' }, 400);
      }
      if (!message.body) {
        return json({ success: false, message: 'Email body is required.' }, 400);
      }

      await sendTitanMail(env, message);

      return json({ success: true, message: 'Email sent through Titan SMTP.' });
    } catch (error) {
      console.error(error);
      return json({
        success: false,
        message: error?.message || 'Titan SMTP send failed.',
      }, 502);
    }
  },
};
