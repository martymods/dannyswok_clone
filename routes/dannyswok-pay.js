const express = require('express');

function normalizeOrigins(origins) {
  if (!origins) return [];
  if (Array.isArray(origins)) {
    return Array.from(
      new Set(
        origins
          .map((origin) => (typeof origin === 'string' ? origin.trim() : ''))
          .filter(Boolean),
      ),
    );
  }
  if (typeof origins === 'string') {
    return normalizeOrigins(origins.split(','));
  }
  return [];
}

function createCorsMiddleware(allowedOrigins) {
  const origins = normalizeOrigins(allowedOrigins);
  const allowAll = origins.includes('*');
  if (origins.length === 0) {
    return null;
  }

  return function corsMiddleware(req, res, next) {
    const requestOrigin = req.headers.origin;
    if (allowAll) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (!requestOrigin || origins.includes(requestOrigin)) {
      if (requestOrigin) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        res.setHeader('Vary', 'Origin');
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
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
  };
}

function sanitizeCurrency(value, fallback = 'usd') {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized || fallback;
}

function sanitizeDescription(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function sanitizeMetadata(raw) {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const metadata = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!key) continue;
    const normalizedKey = String(key).trim();
    if (!normalizedKey) continue;
    if (value === null || value === undefined) continue;
    metadata[normalizedKey] = typeof value === 'string' ? value : String(value);
  }
  return Object.keys(metadata).length ? metadata : undefined;
}

function sanitizeEmail(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function toPositiveInteger(value) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  const integer = Math.round(number);
  return integer > 0 ? integer : null;
}

function toCurrencyCents(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  const cents = Math.round(number * 100);
  return cents > 0 ? cents : null;
}

function sanitizeItemName(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, 80);
}

function buildCheckoutLineItems(order) {
  const rawItems = Array.isArray(order?.items) ? order.items : [];
  const lineItems = [];
  let totalCents = 0;

  rawItems.slice(0, 30).forEach((rawItem) => {
    const name = sanitizeItemName(rawItem?.name);
    const quantity = toPositiveInteger(rawItem?.quantity);
    const unitAmount = toCurrencyCents(rawItem?.unitPrice ?? rawItem?.price);
    if (!name || !quantity || !unitAmount) {
      return;
    }
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name },
        unit_amount: unitAmount,
      },
      quantity,
    });
    totalCents += unitAmount * quantity;
  });

  const tipCents = toCurrencyCents(order?.tipAmount);
  if (tipCents) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Tip' },
        unit_amount: tipCents,
      },
      quantity: 1,
    });
    totalCents += tipCents;
  }

  const expressCents = toCurrencyCents(order?.expressFee);
  if (expressCents) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Express delivery fee' },
        unit_amount: expressCents,
      },
      quantity: 1,
    });
    totalCents += expressCents;
  }

  return { lineItems, totalCents };
}

function resolveBaseUrl(req, fallbackOrigins = []) {
  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  if (originHeader) {
    return originHeader.replace(/\/$/, '');
  }

  const refererHeader = typeof req.headers.referer === 'string' ? req.headers.referer.trim() : '';
  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      return refererUrl.origin.replace(/\/$/, '');
    } catch (error) {
      // ignore invalid referer
    }
  }

  if (Array.isArray(fallbackOrigins)) {
    for (const candidate of fallbackOrigins) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim().replace(/\/$/, '');
      }
    }
  }

  const host = req.get('host');
  if (host) {
    return `${req.protocol}://${host}`.replace(/\/$/, '');
  }

  return '';
}

function createDannysWokPayRouter({ stripe, allowedOrigins = [], menuOrigin = null } = {}) {
  const router = express.Router();
  const normalizedOrigins = normalizeOrigins(allowedOrigins);
  const normalizedMenuOrigins = normalizeOrigins(menuOrigin);
  const combinedOrigins = Array.from(new Set([...normalizedOrigins, ...normalizedMenuOrigins]));

  const corsMiddleware = createCorsMiddleware(combinedOrigins);
  if (corsMiddleware) {
    router.use(corsMiddleware);
  }

  router.get('/config', (_req, res) => {
    const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    res.json({
      stripePublishableKey,
      stripePk: stripePublishableKey,
      menuOrigin: menuOrigin || null,
      allowedOrigins: corsMiddleware ? combinedOrigins : [],
    });
  });

  router.post('/create-payment-intent', async (req, res) => {
    if (!stripe || typeof stripe.paymentIntents?.create !== 'function') {
      return res.status(503).json({ error: 'stripe_unavailable' });
    }

    const order = req.body?.order;
    let amount = null;

    if (order) {
      const { lineItems, totalCents } = buildCheckoutLineItems(order);
      if (!lineItems.length || !Number.isFinite(totalCents) || totalCents <= 0) {
        return res.status(400).json({
          error: 'invalid_order',
          message: 'A valid order is required to start payment.',
        });
      }
      amount = totalCents;
    }

    if (amount === null) {
      const amountRaw = req.body?.amount;
      const parsedAmount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'invalid_amount' });
      }

      if (!Number.isInteger(parsedAmount)) {
        return res.status(400).json({ error: 'amount_must_be_integer' });
      }

      amount = parsedAmount;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'invalid_amount' });
    }

    const currency = sanitizeCurrency(req.body?.currency);
    let description = sanitizeDescription(req.body?.description);
    if (!description && typeof order?.fulfilment === 'string' && order.fulfilment.trim()) {
      description = `${order.fulfilment.trim()} order at Danny's Wok`;
    }
    const receiptEmail = sanitizeEmail(req.body?.receiptEmail || req.body?.email);
    const metadata = sanitizeMetadata(req.body?.metadata);

    try {
      const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
        description,
        receipt_email: receiptEmail,
        metadata,
      });

      res.json({
        id: intent.id,
        clientSecret: intent.client_secret,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to create Danny's Wok payment intent", error);
      const statusCode = error?.statusCode || error?.status || 500;
      res.status(statusCode).json({
        error: 'stripe_error',
        message: error?.message || 'Unable to create payment intent',
      });
    }
  });

  router.post('/create-checkout-session', async (req, res) => {
    if (!stripe || typeof stripe.checkout?.sessions?.create !== 'function') {
      return res.status(503).json({ error: 'stripe_unavailable' });
    }

    const order = req.body?.order;
    const { lineItems, totalCents } = buildCheckoutLineItems(order);
    if (!lineItems.length || !Number.isFinite(totalCents) || totalCents <= 0) {
      return res.status(400).json({
        error: 'invalid_order',
        message: 'A valid order is required to start checkout.',
      });
    }

    const metadata = sanitizeMetadata(req.body?.metadata);
    const baseUrl = resolveBaseUrl(req, combinedOrigins) || `${req.protocol}://${req.get('host')}`;
    const normalizedBaseUrl = typeof baseUrl === 'string' ? baseUrl.replace(/\/$/, '') : '';
    const successUrl = `${normalizedBaseUrl}/thankyou.html`;
    const cancelUrl = `${normalizedBaseUrl}/menu.html`;

    const sessionParams = {
      mode: 'payment',
      submit_type: 'pay',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      phone_number_collection: { enabled: true },
    };

    if (metadata) {
      sessionParams.metadata = metadata;
      sessionParams.payment_intent_data = { metadata };
    }

    if (order?.isDelivery) {
      sessionParams.shipping_address_collection = { allowed_countries: ['US'] };
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ id: session.id, url: session.url });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to create Danny's Wok checkout session", error);
      const statusCode = error?.statusCode || error?.status || 500;
      res.status(statusCode).json({
        error: 'stripe_error',
        message: error?.message || 'Unable to create checkout session',
      });
    }
  });

  return router;
}

module.exports = createDannysWokPayRouter;
