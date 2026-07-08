const { createSign } = require('crypto');

const NOTIFY_TO = process.env.REGISTRATION_NOTIFY_EMAIL || 'admin@fixatephx.com';
const NOTIFY_FROM = process.env.RESEND_FROM || 'The Unraveling <admin@fixatephx.com>';

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function row(label, value) {
  return `<tr>
    <td style="padding:6px 14px 6px 0;font-family:Georgia,serif;font-size:13px;color:#9B9082;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-family:Georgia,serif;font-size:14px;color:#2C2820;">${escapeHtml(value) || '&mdash;'}</td>
  </tr>`;
}

async function sendRegistrationNotification(reg) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true };
  }

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#F5F0E8;">
    <div style="max-width:520px;margin:0 auto;background:#FAF8F4;border:1px solid #C8B89A;padding:28px 32px;">
      <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#5C6E52;">New registration</p>
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-style:italic;font-weight:normal;font-size:24px;color:#4A3728;">The Unraveling</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #EDE5D4;padding-top:8px;">
        ${row('Name', reg.name)}
        ${row('Email', reg.email)}
        ${row('Payment', `$100 — ${reg.paymentId}`)}
        ${row('Dietary', reg.dietary)}
        ${row('Emergency contact', reg.emergencyName)}
        ${row('Emergency phone', reg.emergencyPhone)}
        ${row('Heard about us', reg.heardAbout)}
        ${row('Workshop interests', (reg.workshops || []).join(', '))}
        ${row('Received', new Date().toISOString())}
      </table>
    </div>
  </body></html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      subject: `New registration: ${reg.name}`,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend responded ${response.status}: ${detail}`);
  }
  return response.json();
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getGoogleAccessToken() {
  const saEmail = process.env.GOOGLE_SA_EMAIL;
  const saKey = (process.env.GOOGLE_SA_KEY || '').replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: saEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(saKey, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const jwt = `${header}.${claims}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Google token exchange failed ${response.status}: ${detail}`);
  }
  const data = await response.json();
  return data.access_token;
}

async function appendToSheet(reg) {
  if (!process.env.GOOGLE_SA_EMAIL || !process.env.GOOGLE_SA_KEY || !process.env.SHEET_ID) {
    return { skipped: true };
  }

  const token = await getGoogleAccessToken();
  const values = [[
    reg.name,
    reg.email,
    reg.dietary || '',
    reg.emergencyName || '',
    reg.emergencyPhone || '',
    reg.heardAbout || '',
    (reg.workshops || []).join(', '),
    reg.paymentId,
    '$100',
    new Date().toISOString(),
  ]];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Sheets append failed ${response.status}: ${detail}`);
  }
  return response.json();
}

module.exports = { sendRegistrationNotification, appendToSheet };
