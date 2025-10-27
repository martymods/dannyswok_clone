const express = require('express');
const crypto = require('crypto');
const { getDatabase } = require('../services/mongo');

const router = express.Router();

const WING_ADJECTIVES = [
  'Crispy',
  'Golden',
  'Seoul-Style',
  'Night Market',
  'Dragon',
  'Lotus',
  'Silk Road',
  'Bamboo',
  'Umami',
  'Lunar',
];

const WING_FLAVORS = [
  'Gochujang',
  'Soy Garlic',
  'Five Spice',
  'Yuzu Glaze',
  'Miso Honey',
  'Chili Crunch',
  'Sesame Fire',
  'Ginger Scallion',
];

const WING_FORMS = ['Wings', 'Flats', 'Drums', 'Bites', 'Fire Wings'];

function getRandomItem(list) {
  if (!Array.isArray(list) || !list.length) {
    return '';
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function generateThemeName() {
  const adjective = getRandomItem(WING_ADJECTIVES);
  const flavor = getRandomItem(WING_FLAVORS);
  const form = getRandomItem(WING_FORMS);
  return `${adjective} ${flavor} ${form}`;
}

function normalizeStoreSelection(selection) {
  if (!selection || typeof selection !== 'object') {
    return null;
  }
  const normalized = {
    storeId: typeof selection.storeId === 'string' ? selection.storeId.trim().toLowerCase() : null,
    storeLabel: typeof selection.storeLabel === 'string' ? selection.storeLabel.trim() : null,
    latitude: Number(selection.storeLat),
    longitude: Number(selection.storeLng),
  };
  const hasCoords = Number.isFinite(normalized.latitude) && Number.isFinite(normalized.longitude);
  if (!normalized.storeId && !hasCoords) {
    return null;
  }
  return {
    storeId: normalized.storeId,
    storeLabel: normalized.storeLabel,
    latitude: hasCoords ? normalized.latitude : null,
    longitude: hasCoords ? normalized.longitude : null,
    selectedAt: new Date(),
  };
}

function sanitizeEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }
  return events
    .slice(0, 50)
    .map((event) => {
      const type = typeof event?.type === 'string' ? event.type.trim().toLowerCase() : null;
      if (!type) {
        return null;
      }
      const timestamp = event?.timestamp && !Number.isNaN(Date.parse(event.timestamp))
        ? new Date(event.timestamp)
        : new Date();
      const payload = event?.payload && typeof event.payload === 'object' ? event.payload : null;
      return {
        type,
        timestamp,
        payload,
      };
    })
    .filter(Boolean);
}

async function ensureDatabase(res) {
  try {
    const db = await getDatabase();
    if (!db) {
      res.status(503).json({ error: 'database_unavailable' });
      return null;
    }
    return db;
  } catch (error) {
    res.status(503).json({ error: 'database_unavailable' });
    return null;
  }
}

router.post('/profile', async (req, res) => {
  const db = await ensureDatabase(res);
  if (!db) {
    return;
  }
  const profiles = db.collection('userProfiles');
  const now = new Date();
  const existingId = typeof req.body?.trackingId === 'string' ? req.body.trackingId.trim() : '';
  let profile = existingId ? await profiles.findOne({ trackingId: existingId }) : null;
  if (!profile) {
    const trackingId = crypto.randomUUID();
    const themeName = generateThemeName();
    const storeSelection = normalizeStoreSelection(req.body);
    const document = {
      trackingId,
      themeName,
      createdAt: now,
      lastSeenAt: now,
      metrics: {
        totalEvents: 0,
        cartAdds: 0,
        cartRemovals: 0,
        purchases: 0,
        lifetimeValue: 0,
      },
      storeSelections: storeSelection ? [storeSelection] : [],
    };
    await profiles.insertOne(document);
    profile = document;
  } else {
    const updates = {
      $set: { lastSeenAt: now },
    };
    const storeSelection = normalizeStoreSelection(req.body);
    if (storeSelection) {
      updates.$push = {
        storeSelections: {
          $each: [storeSelection],
          $slice: -15,
        },
      };
    }
    await profiles.updateOne({ trackingId: profile.trackingId }, updates);
    profile = { ...profile, lastSeenAt: now };
  }
  res.json({ trackingId: profile.trackingId, themeName: profile.themeName });
});

router.post('/events', async (req, res) => {
  const db = await ensureDatabase(res);
  if (!db) {
    return;
  }
  const trackingId = typeof req.body?.trackingId === 'string' ? req.body.trackingId.trim() : '';
  if (!trackingId) {
    res.status(400).json({ error: 'missing_tracking_id' });
    return;
  }
  const events = sanitizeEvents(req.body?.events);
  if (!events.length) {
    res.status(400).json({ error: 'no_events' });
    return;
  }
  const profiles = db.collection('userProfiles');
  const eventsCollection = db.collection('userEvents');
  const profile = await profiles.findOne({ trackingId });
  if (!profile) {
    res.status(404).json({ error: 'profile_not_found' });
    return;
  }
  const now = new Date();
  const documents = events.map((event) => ({
    trackingId,
    type: event.type,
    payload: event.payload || null,
    createdAt: event.timestamp || now,
  }));
  if (documents.length) {
    await eventsCollection.insertMany(documents, { ordered: false }).catch(() => {});
  }
  const metricsUpdates = {
    $set: { lastSeenAt: now },
    $inc: { 'metrics.totalEvents': documents.length },
  };
  let purchaseTotalIncrement = 0;
  events.forEach((event) => {
    if (event.type === 'cart_item_added') {
      metricsUpdates.$inc['metrics.cartAdds'] = (metricsUpdates.$inc['metrics.cartAdds'] || 0) + 1;
    }
    if (event.type === 'cart_item_removed') {
      metricsUpdates.$inc['metrics.cartRemovals'] = (metricsUpdates.$inc['metrics.cartRemovals'] || 0) + 1;
    }
    if (event.type === 'purchase_complete') {
      metricsUpdates.$inc['metrics.purchases'] = (metricsUpdates.$inc['metrics.purchases'] || 0) + 1;
      const amount = Number(event.payload?.amount);
      if (Number.isFinite(amount) && amount > 0) {
        purchaseTotalIncrement += amount;
      }
    }
  });
  if (purchaseTotalIncrement > 0) {
    metricsUpdates.$inc['metrics.lifetimeValue'] = purchaseTotalIncrement;
  }
  await profiles.updateOne({ trackingId }, metricsUpdates);
  res.json({ accepted: documents.length });
});

module.exports = () => router;
