const path = require('path');
const express = require('express');
const Stripe = require('stripe');
require('dotenv').config();

const createDannysWokPayRouter = require('./routes/dannyswok-pay');

const app = express();
const port = process.env.PORT || 3000;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

const DEFAULT_DANNYSWOK_ALLOWED_ORIGINS = [
  'https://dannyswok.com',
  'https://www.dannyswok.com',
  'https://delcotechdivision.com',
  'https://www.delcotechdivision.com',
];

function parseOrigins(value) {
  if (!value) {
    return [];
  }

  const origins = Array.isArray(value) ? value : String(value).split(',');
  return Array.from(
    new Set(
      origins
        .map((origin) => (typeof origin === 'string' ? origin.trim() : ''))
        .filter(Boolean),
    ),
  );
}

const parsedDannysWokAllowedOrigins = parseOrigins(process.env.DANNYSWOK_ALLOWED_ORIGINS);
const DANNYSWOK_ALLOWED_ORIGINS = parsedDannysWokAllowedOrigins.length
  ? parsedDannysWokAllowedOrigins
  : DEFAULT_DANNYSWOK_ALLOWED_ORIGINS;
const DANNYSWOK_MENU_ORIGIN = process.env.DANNYSWOK_MENU_ORIGIN || null;
const parsedDannysWokMenuOrigins = parseOrigins(DANNYSWOK_MENU_ORIGIN);
const COMBINED_ALLOWED_ORIGINS = Array.from(
  new Set([...DANNYSWOK_ALLOWED_ORIGINS, ...parsedDannysWokMenuOrigins]),
);

const combinedAllowedOriginsSet = new Set(COMBINED_ALLOWED_ORIGINS);

app.use((req, res, next) => {
  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  const requestOrigin = originHeader || '';
  const hasAllowedOrigin = requestOrigin && combinedAllowedOriginsSet.has(requestOrigin);

  if (hasAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (requestOrigin) {
    const requestedHeaders = req.headers['access-control-request-headers'];
    res.setHeader('Access-Control-Allow-Headers', requestedHeaders || 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') {
      res.status(403).end();
      return;
    }

    res.status(403).json({ error: 'cors_not_allowed' });
    return;
  }

  const requestedHeaders = req.headers['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(
  '/api/dannyswok',
  createDannysWokPayRouter({
    stripe,
    allowedOrigins: COMBINED_ALLOWED_ORIGINS,
    menuOrigin: DANNYSWOK_MENU_ORIGIN,
  }),
);

app.get('/api/config', (req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return res.status(500).json({ message: 'Stripe publishable key not configured.' });
  }
  return res.json({ publishableKey });
});

app.post('/api/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: 'Stripe secret key not configured.' });
  }
  try {
    const { amount, currency = 'usd', description, metadata = {} } = req.body || {};
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: 'A valid payment amount is required.' });
    }

    const sanitizedMetadata = {};
    Object.entries(metadata)
      .slice(0, 20)
      .forEach(([key, value]) => {
        if (value == null) {
          return;
        }
        sanitizedMetadata[key] = String(value).slice(0, 500);
      });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: description || "Danny's Wok order",
      metadata: sanitizedMetadata,
      automatic_payment_methods: { enabled: true },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create payment intent', error);
    return res.status(500).json({ message: 'Unable to create payment intent.' });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});
