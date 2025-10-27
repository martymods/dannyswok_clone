const express = require('express');
const { getDatabase } = require('../services/mongo');

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

function sanitizeOrderItem(rawItem) {
  if (!rawItem || typeof rawItem !== 'object') {
    return null;
  }
  const quantity = Number(rawItem.quantity);
  const unitPrice = Number(rawItem.unitPrice ?? rawItem.price);
  const total = Number(rawItem.total);
  return {
    name: typeof rawItem.name === 'string' ? rawItem.name.slice(0, 120) : 'Item',
    quantity: Number.isFinite(quantity) ? quantity : null,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : null,
    total: Number.isFinite(total) ? total : null,
  };
}

async function logCheckoutSession(order, session, totalCents, metadata) {
  try {
    const db = await getDatabase();
    if (!db) {
      return;
    }
    const orders = db.collection('orders');
    const document = {
      sessionId: session?.id || null,
      sessionUrl: session?.url || null,
      createdAt: new Date(),
      totalCents: Number.isFinite(totalCents) ? totalCents : null,
      fulfilment: order?.fulfilment || null,
      isDelivery: Boolean(order?.isDelivery),
      subtotal: Number.isFinite(order?.subtotal) ? Number(order.subtotal) : null,
      grandTotal: Number.isFinite(order?.grandTotal) ? Number(order.grandTotal) : null,
      metadata: metadata || null,
    };
    if (order?.customer) {
      document.customer = {
        name: typeof order.customer.name === 'string' ? order.customer.name.slice(0, 120) : null,
        phone: typeof order.customer.phone === 'string' ? order.customer.phone.slice(0, 60) : null,
        address:
          typeof order.customer.address === 'string' ? order.customer.address.slice(0, 200) : null,
      };
    }
    if (metadata?.tracking_id) {
      document.trackingId = metadata.tracking_id;
    }
    if (Array.isArray(order?.items) && order.items.length) {
      document.items = order.items
        .slice(0, 50)
        .map((item) => sanitizeOrderItem(item))
        .filter(Boolean);
    } else {
      document.items = [];
    }
    await orders.insertOne(document);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to log checkout session', error);
  }
}

const SESSION_METADATA_EXCLUDE_KEYS = new Set([
  'subtotal',
  'tip',
  'express_fee',
  'delivery_fee',
  'processing_fee',
  'fees_estimated_tax',
  'tax',
  'total',
]);

function filterCheckoutSessionMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const filtered = {};
  Object.entries(metadata).forEach(([key, value]) => {
    if (!key) {
      return;
    }
    const normalizedKey = String(key).trim().toLowerCase();
    if (!normalizedKey || SESSION_METADATA_EXCLUDE_KEYS.has(normalizedKey)) {
      return;
    }
    filtered[key] = value;
  });

  return Object.keys(filtered).length ? filtered : undefined;
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

function toNonNegativeInteger(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  const integer = Math.round(number);
  return integer >= 0 ? integer : null;
}

function normalizeFeeMap(rawFees) {
  if (!rawFees || typeof rawFees !== 'object') {
    return { fees: {}, total: 0 };
  }
  const fees = {};
  let total = 0;
  for (const [key, value] of Object.entries(rawFees)) {
    if (!key) {
      continue;
    }
    const cents = toNonNegativeInteger(value);
    if (cents === null) {
      return { error: key };
    }
    fees[key] = cents;
    total += cents;
  }
  return { fees, total };
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
    const lineTotalCents = toCurrencyCents(rawItem?.total);

    let unitAmount = null;
    if (lineTotalCents && quantity) {
      const dividesEvenly = lineTotalCents % quantity === 0;
      if (dividesEvenly) {
        const derivedUnit = Math.round(lineTotalCents / quantity);
        if (derivedUnit > 0) {
          unitAmount = derivedUnit;
        }
      }
    }

    if (!unitAmount) {
      unitAmount = toCurrencyCents(rawItem?.unitPrice ?? rawItem?.price);
    }

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
    const lineTotal = lineTotalCents && lineTotalCents > 0 ? lineTotalCents : unitAmount * quantity;
    totalCents += lineTotal;
  });

  const processingCents = toCurrencyCents(order?.processingFee);
  const taxCents = toCurrencyCents(order?.taxAmount);
  let feesLineItemAdded = false;

  if (processingCents) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Processing fee' },
        unit_amount: processingCents,
      },
      quantity: 1,
    });
    totalCents += processingCents;
    feesLineItemAdded = true;
  }

  if (taxCents) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Estimated tax' },
        unit_amount: taxCents,
      },
      quantity: 1,
    });
    totalCents += taxCents;
    feesLineItemAdded = true;
  }

  if (!processingCents && !taxCents) {
    const feesAndTaxCents = toCurrencyCents(order?.feesAndEstimatedTax);
    if (feesAndTaxCents) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Fees & Estimated Tax' },
          unit_amount: feesAndTaxCents,
        },
        quantity: 1,
      });
      totalCents += feesAndTaxCents;
      feesLineItemAdded = true;
    }
  }

  const deliveryCents = toCurrencyCents(order?.deliveryFee);
  if (deliveryCents) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Delivery fee' },
        unit_amount: deliveryCents,
      },
      quantity: 1,
    });
    totalCents += deliveryCents;
  }

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

  const grandTotalCents = toCurrencyCents(order?.grandTotal);
  if (grandTotalCents && grandTotalCents > totalCents) {
    const missingCents = grandTotalCents - totalCents;
    if (missingCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: feesLineItemAdded ? 'Additional charges' : 'Fees & Estimated Tax',
          },
          unit_amount: missingCents,
        },
        quantity: 1,
      });
      totalCents += missingCents;
    }
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

    const hasBreakdown =
      Object.prototype.hasOwnProperty.call(req.body || {}, 'total') ||
      Object.prototype.hasOwnProperty.call(req.body || {}, 'subtotal') ||
      Object.prototype.hasOwnProperty.call(req.body || {}, 'fees') ||
      Object.prototype.hasOwnProperty.call(req.body || {}, 'items');

    let amount = null;
    if (hasBreakdown) {
      const subtotalCents = toNonNegativeInteger(req.body?.subtotal);
      if (subtotalCents === null) {
        return res.status(400).json({ error: 'invalid_subtotal' });
      }

      const { total: feesTotal, error: feeErrorKey } = normalizeFeeMap(req.body?.fees);
      if (feeErrorKey) {
        return res.status(400).json({
          error: 'invalid_fee',
          message: `Invalid fee amount for "${feeErrorKey}"`,
        });
      }

      const computedTotal = subtotalCents + feesTotal;
      if (!Number.isFinite(computedTotal) || computedTotal <= 0) {
        return res.status(400).json({ error: 'invalid_total' });
      }

      const requestedTotal = toNonNegativeInteger(req.body?.total);
      if (requestedTotal === null) {
        return res.status(400).json({ error: 'invalid_total' });
      }

      if (requestedTotal > 0 && Math.abs(requestedTotal - computedTotal) <= 1) {
        amount = computedTotal;
      } else if (requestedTotal > 0) {
        amount = requestedTotal;
      } else {
        amount = computedTotal;
      }
    }

    if (amount === null) {
      const amountRaw = req.body?.amount;
      const legacyAmount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw);
      if (!Number.isFinite(legacyAmount) || legacyAmount <= 0) {
        return res.status(400).json({ error: 'invalid_amount' });
      }
      if (!Number.isInteger(legacyAmount)) {
        return res.status(400).json({ error: 'amount_must_be_integer' });
      }
      amount = legacyAmount;
    }

    const currency = sanitizeCurrency(req.body?.currency);
    const description = sanitizeDescription(req.body?.description);
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

    const checkoutMetadata = filterCheckoutSessionMetadata(metadata);
    if (checkoutMetadata) {
      sessionParams.metadata = checkoutMetadata;
    }
    if (metadata) {
      sessionParams.payment_intent_data = { metadata };
    }

    if (order?.isDelivery) {
      sessionParams.shipping_address_collection = { allowed_countries: ['US'] };
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      await logCheckoutSession(order, session, totalCents, metadata).catch(() => {});
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
