const { SquareClient, SquareEnvironment } = require('square');
const { randomUUID } = require('crypto');

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

  const { sourceId } = req.body || {};

  if (!sourceId) {
    res.status(400).json({ success: false, error: 'Missing payment source.' });
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
      note: 'The Unraveling — General Admission',
    });

    const payment = response.payment;

    res.status(200).json({
      success: true,
      paymentId: payment && payment.id,
      status: payment && payment.status,
    });
  } catch (error) {
    const message =
      error.errors && error.errors.length
        ? error.errors.map((e) => e.detail).join(' ')
        : 'Payment could not be completed.';

    res.status(400).json({ success: false, error: message });
  }
};
