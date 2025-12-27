const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const Stripe = require('stripe');
require('dotenv').config();

const createDannysWokPayRouter = require('./routes/dannyswok-pay');
const createAnalyticsRouter = require('./routes/analytics');
const createMenuRouter = require('./routes/menu');
const createAdminRouter = require('./routes/admin');
const createRewardsRouter = require('./routes/rewards');

const app = express();
const port = process.env.PORT || 3000;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;
const FORTUNES_FILE_PATH = path.join(__dirname, 'data', 'fortunes.json');
const MAX_FORTUNE_ENTRIES = 500;

async function readStoredFortunes() {
  try {
    const data = await fs.readFile(FORTUNES_FILE_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function appendFortune(record) {
  const sanitizedRecord = {
    fortune: typeof record?.fortune === 'string' ? record.fortune.trim() : '',
    createdAt: record?.createdAt || new Date().toISOString(),
    source:
      typeof record?.source === 'string'
        ? record.source.trim().slice(0, 120) || 'thankyou'
        : 'thankyou',
  };
  if (!sanitizedRecord.fortune) {
    return;
  }
  await fs.mkdir(path.dirname(FORTUNES_FILE_PATH), { recursive: true });
  const fortunes = await readStoredFortunes();
  fortunes.push(sanitizedRecord);
  const trimmed = fortunes.length > MAX_FORTUNE_ENTRIES ? fortunes.slice(-MAX_FORTUNE_ENTRIES) : fortunes;
  await fs.writeFile(FORTUNES_FILE_PATH, JSON.stringify(trimmed, null, 2));
}

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

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

app.use('/api/menu', createMenuRouter());
app.use('/api/admin', createAdminRouter());
app.use('/api/rewards', createRewardsRouter());
app.use(
  '/api/dannyswok',
  createDannysWokPayRouter({
    stripe,
    allowedOrigins: COMBINED_ALLOWED_ORIGINS,
    menuOrigin: DANNYSWOK_MENU_ORIGIN,
  }),
);

app.use('/api/analytics', createAnalyticsRouter());

app.post('/api/fortunes', async (req, res) => {
  try {
    const fortuneText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!fortuneText) {
      return res.status(400).json({ message: 'Fortune text is required.' });
    }

    const sanitizedFortune = fortuneText.slice(0, 500);
    const timestampInput = req.body?.timestamp;
    let createdAt = new Date();
    if (typeof timestampInput === 'string') {
      const parsed = Date.parse(timestampInput);
      if (!Number.isNaN(parsed)) {
        createdAt = new Date(parsed);
      }
    }

    const source = typeof req.body?.source === 'string' ? req.body.source.trim() : 'thankyou';

    await appendFortune({
      fortune: sanitizedFortune,
      createdAt: createdAt.toISOString(),
      source: source || 'thankyou',
    });

    return res.status(201).json({ status: 'saved' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to store fortune', error);
    return res.status(500).json({ message: 'Unable to save fortune.' });
  }
});

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
