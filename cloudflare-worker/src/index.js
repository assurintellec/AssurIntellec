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

    const headers = [
      `From: ${fromName} <${username}>`,
      `To: <${to}>`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@assurintellec.in>`,
      `Reply-To: <${replyTo}>`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodeBody(message.body || ''),
      '.',
    ].join('\r\n');

    await writer.write(new TextEncoder().encode(headers + '\r\n'));
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
