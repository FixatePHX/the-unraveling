const FROM = process.env.RESEND_FROM || 'The Unraveling <admin@fixatephx.com>';
const REPLY_TO = 'admin@fixatephx.com';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(name) {
  const firstName = escapeHtml(name.split(' ')[0]);
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F5F0E8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#FAF8F4;border:1px solid #C8B89A;">
        <tr><td style="padding:48px 40px 36px;text-align:center;">
          <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#5C6E52;">Fixate Church presents</p>
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:normal;font-size:38px;color:#4A3728;">The Unraveling</h1>
          <p style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:#9B9082;">the undoing of what has become tangled</p>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="border-top:1px solid #C8B89A;font-size:0;">&nbsp;</div></td></tr>
        <tr><td style="padding:32px 40px 8px;">
          <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:24px;color:#4A3728;">You have a place at the table, ${firstName}.</h2>
          <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:#7A6651;">Your reservation for The Unraveling is confirmed. We are so glad you are coming.</p>
          <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:#7A6651;">This weekend is not a conference about women. It is a gathering around the Lord &mdash; Father, Son, and Spirit &mdash; from which everything else flows.</p>
        </td></tr>
        <tr><td style="padding:16px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;border:1px solid #C8B89A;">
            <tr><td style="padding:24px 28px;">
              <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#5C6E52;">Your reservation</p>
              <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#4A3728;">General Admission &mdash; $100</p>
              <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#4A3728;">Three days &middot; February 2027 &middot; exact dates to be announced</p>
              <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#4A3728;">Downtown Phoenix, Arizona</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#4A3728;">Breakfast &amp; snacks provided</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 40px 8px;">
          <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:#7A6651;">The full schedule, venue details, and everything you need to know will land in this inbox as the weekend draws closer. For now, there is nothing you need to do &mdash; your place is held.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 36px;text-align:center;">
          <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:1.7;color:#4A3728;">&ldquo;Those who look to him are radiant,<br>and their faces shall never be ashamed.&rdquo;</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9B9082;">Psalm 34 : 5</p>
        </td></tr>
        <tr><td style="padding:24px 40px;background-color:#4A3728;text-align:center;">
          <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;color:#C8B89A;">The Unraveling</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.8;color:#C8B89A;">questions? <a href="mailto:admin@fixatephx.com" style="color:#EDE5D4;">admin@fixatephx.com</a> &middot; instagram <a href="https://www.instagram.com/fixate.women" style="color:#EDE5D4;">@fixate.women</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(name) {
  const firstName = name.split(' ')[0];
  return [
    'THE UNRAVELING — Fixate Church',
    '',
    `You have a place at the table, ${firstName}.`,
    '',
    'Your reservation for The Unraveling is confirmed. We are so glad you are coming.',
    '',
    'YOUR RESERVATION',
    'General Admission — $100',
    'Three days · February 2027 · exact dates to be announced',
    'Downtown Phoenix, Arizona',
    'Breakfast & snacks provided',
    '',
    'The full schedule, venue details, and everything you need to know will land in this inbox as the weekend draws closer. For now, there is nothing you need to do — your place is held.',
    '',
    '"Those who look to him are radiant, and their faces shall never be ashamed." — Psalm 34:5',
    '',
    'questions? admin@fixatephx.com · instagram @fixate.women',
  ].join('\n');
}

async function sendConfirmationEmail(name, email) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      reply_to: REPLY_TO,
      subject: 'You have a place at the table — The Unraveling, February 2027',
      html: buildHtml(name),
      text: buildText(name),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend responded ${response.status}: ${detail}`);
  }

  return response.json();
}

module.exports = { sendConfirmationEmail };
