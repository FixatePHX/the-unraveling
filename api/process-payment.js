const { SquareClient, SquareEnvironment } = require('square');
const { randomUUID } = require('crypto');
const { sendConfirmationEmail } = require('./confirmation-email');
const { sendRegistrationNotification, appendToSheet } = require('./registration');

const WORKSHOP_OPTIONS = [
  'Healing & Motherhood',
  'Calling, Purpose & Creativity',
  'Who Are the Father, Son & Holy Spirit?',
  'Ministry in the Workplace',
];

function cleanStr(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

const TICKET_PRICE_CENTS = 10000; // $100.00

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const { sourceId, buyerName, buyerEmail, dietary, emergencyName, emergencyPhone, heardAbout, workshops } = req.body || {};

  if (!sourceId) {
    res.status(400).json({ success: false, error: 'Missing payment source.' });
    return;
  }

  const name = cleanStr(buyerName, 100);
  const email = cleanStr(buyerEmail, 254);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, error: 'Please provide your name and a valid email address.' });
    return;
  }

  const registration = {
    name,
    email,
    dietary: cleanStr(dietary, 300),
    emergencyName: cleanStr(emergencyName, 100),
    emergencyPhone: cleanStr(emergencyPhone, 40),
    heardAbout: cleanStr(heardAbout, 100),
    workshops: Array.isArray(workshops)
      ? workshops.filter((w) => WORKSHOP_OPTIONS.includes(w)).slice(0, WORKSHOP_OPTIONS.length)
      : [],
  };

  if (!registration.emergencyName || !registration.emergencyPhone) {
    res.status(400).json({ success: false, error: 'Please provide an emergency contact name and phone number.' });
    return;
  }

  if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
    res.status(500).json({ success: false, error: 'Payment processing is not configured.' });
    return;
  }

  try {
    const response = await client.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(TICKET_PRICE_CENTS),
        currency: 'USD',
      },
      locationId: process.env.SQUARE_LOCATION_ID,
      buyerEmailAddress: email,
      note: `The Unraveling — General Admission — ${name}`.slice(0, 500),
    });

    const payment = response.payment;

    registration.paymentId = (payment && payment.id) || '';

    let emailSent = false;
    let emailStatus = 'skipped: RESEND_API_KEY not set';
    try {
      const emailResult = await sendConfirmationEmail(name, email);
      emailSent = !emailResult.skipped;
      if (emailSent) emailStatus = 'sent';
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError.message);
      emailStatus = `failed: ${String(emailError.message).slice(0, 200)}`;
    }

    let notifyStatus = 'skipped';
    try {
      const notifyResult = await sendRegistrationNotification(registration);
      notifyStatus = notifyResult.skipped ? 'skipped' : 'sent';
    } catch (notifyError) {
      console.error('Registration notification failed:', notifyError.message);
      notifyStatus = `failed: ${String(notifyError.message).slice(0, 200)}`;
    }

    let sheetStatus = 'skipped';
    try {
      const sheetResult = await appendToSheet(registration);
      sheetStatus = sheetResult.skipped ? 'skipped' : 'appended';
    } catch (sheetError) {
      console.error('Sheet append failed:', sheetError.message);
      sheetStatus = `failed: ${String(sheetError.message).slice(0, 200)}`;
    }

    res.status(200).json({
      success: true,
      paymentId: payment && payment.id,
      status: payment && payment.status,
      emailSent,
      emailStatus,
      notifyStatus,
      sheetStatus,
    });
  } catch (error) {
    const message =
      error.errors && error.errors.length
        ? error.errors.map((e) => e.detail).join(' ')
        : 'Payment could not be completed.';

    res.status(400).json({ success: false, error: message });
  }
};
