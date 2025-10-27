const express = require('express');
const { getMenuOverrides, updateMenuItemOverride } = require('../services/menu-overrides');
const { saveBase64Image, deleteImage } = require('../services/image-storage');
const { getStores, updateStoreLocation } = require('../services/store-data');
const { getDatabase } = require('../services/mongo');

function normalizeLimit(value, { defaultValue = 50, max = 200 } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return Math.min(Math.floor(parsed), max);
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

function sanitizeDocumentId(document) {
  if (!document || typeof document !== 'object') {
    return document;
  }
  if (document._id && typeof document._id === 'object' && document._id.toString) {
    return { ...document, _id: document._id.toString() };
  }
  return document;
}

function sanitizeDocuments(documents) {
  return documents.map((doc) => sanitizeDocumentId(doc));
}

function buildMenuUpdatePayload(body) {
  const payload = {};
  if (Object.prototype.hasOwnProperty.call(body, 'price')) {
    payload.price = body.price;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'removeImage')) {
    payload.removeImage = Boolean(body.removeImage);
  }
  return payload;
}

function extractImagePayload(body) {
  const hasImageData = body && typeof body.imageData === 'string' && body.imageData.trim();
  if (!hasImageData) {
    return null;
  }
  const imageType = typeof body.imageType === 'string' ? body.imageType.trim() : undefined;
  return { data: body.imageData.trim(), type: imageType };
}

function createAdminRouter() {
  const router = express.Router();

  router.get('/menu/overrides', async (_req, res) => {
    try {
      const overrides = await getMenuOverrides();
      res.json(overrides);
    } catch (error) {
      res.status(500).json({ error: 'menu_overrides_unavailable' });
    }
  });

  router.put('/menu/items/:id', async (req, res) => {
    const itemId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!itemId) {
      res.status(400).json({ error: 'invalid_item_id' });
      return;
    }
    const basePayload = buildMenuUpdatePayload(req.body || {});
    let newImagePath;
    let previousImagePath;
    try {
      const overrides = await getMenuOverrides();
      const existing = overrides.items?.[itemId] || null;
      previousImagePath = existing?.image || null;
      const imagePayload = extractImagePayload(req.body);
      if (imagePayload) {
        newImagePath = await saveBase64Image(imagePayload.data, imagePayload.type);
        basePayload.image = newImagePath;
      }
      const updated = await updateMenuItemOverride(itemId, basePayload);
      if (basePayload.removeImage && previousImagePath) {
        await deleteImage(previousImagePath).catch(() => {});
      }
      if (newImagePath && previousImagePath && previousImagePath !== newImagePath) {
        await deleteImage(previousImagePath).catch(() => {});
      }
      res.json({ itemId, override: updated });
    } catch (error) {
      if (newImagePath) {
        await deleteImage(newImagePath).catch(() => {});
      }
      res.status(400).json({ error: 'menu_item_update_failed', message: error.message || 'Unable to update menu item.' });
    }
  });

  router.get('/stores', async (_req, res) => {
    try {
      const stores = await getStores();
      res.json(stores);
    } catch (error) {
      res.status(500).json({ error: 'stores_unavailable' });
    }
  });

  router.put('/stores/:id/location', async (req, res) => {
    const storeId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!storeId) {
      res.status(400).json({ error: 'invalid_store_id' });
      return;
    }
    const { latitude, longitude } = req.body || {};
    try {
      const store = await updateStoreLocation(storeId, latitude, longitude);
      res.json({ store });
    } catch (error) {
      res.status(400).json({ error: 'store_update_failed', message: error.message || 'Unable to update store location.' });
    }
  });

  router.get('/analytics/profiles', async (req, res) => {
    const db = await ensureDatabase(res);
    if (!db) {
      return;
    }
    const limit = normalizeLimit(req.query.limit);
    const profilesCollection = db.collection('userProfiles');
    const profiles = await profilesCollection
      .find({}, { sort: { lastSeenAt: -1 }, limit })
      .toArray();
    res.json({ profiles: sanitizeDocuments(profiles) });
  });

  router.get('/analytics/profiles/:trackingId', async (req, res) => {
    const db = await ensureDatabase(res);
    if (!db) {
      return;
    }
    const trackingId = typeof req.params.trackingId === 'string' ? req.params.trackingId.trim() : '';
    if (!trackingId) {
      res.status(400).json({ error: 'invalid_tracking_id' });
      return;
    }
    const profiles = db.collection('userProfiles');
    const events = db.collection('userEvents');
    const profile = await profiles.findOne({ trackingId });
    if (!profile) {
      res.status(404).json({ error: 'profile_not_found' });
      return;
    }
    const limit = normalizeLimit(req.query.limit, { defaultValue: 100, max: 500 });
    const userEvents = await events
      .find({ trackingId }, { sort: { createdAt: -1 }, limit })
      .toArray();
    res.json({ profile: sanitizeDocumentId(profile), events: sanitizeDocuments(userEvents) });
  });

  router.get('/orders', async (req, res) => {
    const db = await ensureDatabase(res);
    if (!db) {
      return;
    }
    const limit = normalizeLimit(req.query.limit, { defaultValue: 50, max: 200 });
    const ordersCollection = db.collection('orders');
    const orders = await ordersCollection
      .find({}, { sort: { createdAt: -1 }, limit })
      .toArray();
    res.json({ orders: sanitizeDocuments(orders) });
  });

  return router;
}

module.exports = createAdminRouter;
