const path = require('path');
const { readJsonFile, writeJsonFile } = require('./json-store');

const overridesPath = path.join(__dirname, '..', 'data', 'menu-overrides.json');
const defaultOverrides = { items: {} };

async function getMenuOverrides() {
  const overrides = await readJsonFile(overridesPath, defaultOverrides);
  if (!overrides || typeof overrides !== 'object') {
    return { items: {} };
  }
  if (!overrides.items || typeof overrides.items !== 'object') {
    overrides.items = {};
  }
  return overrides;
}

async function setMenuOverrides(nextOverrides) {
  const normalized = {
    items: nextOverrides?.items && typeof nextOverrides.items === 'object' ? nextOverrides.items : {},
  };
  await writeJsonFile(overridesPath, normalized);
  return normalized;
}

function normalizePrice(price) {
  if (price === null || price === undefined || price === '') {
    return null;
  }
  const number = Number(price);
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }
  return Math.round(number * 100) / 100;
}

async function updateMenuItemOverride(itemId, { price, image, removeImage = false } = {}) {
  const normalizedId = typeof itemId === 'string' ? itemId.trim() : '';
  if (!normalizedId) {
    throw new Error('Item id is required');
  }

  const overrides = await getMenuOverrides();
  const existing = overrides.items[normalizedId] || {};
  const next = { ...existing };

  if (price !== undefined) {
    const normalizedPrice = normalizePrice(price);
    if (normalizedPrice === null) {
      delete next.price;
    } else {
      next.price = normalizedPrice;
    }
  }

  if (removeImage) {
    delete next.image;
  } else if (image !== undefined) {
    if (image) {
      next.image = image;
    } else {
      delete next.image;
    }
  }

  if (Object.keys(next).length === 0) {
    delete overrides.items[normalizedId];
  } else {
    next.updatedAt = new Date().toISOString();
    overrides.items[normalizedId] = next;
  }

  await setMenuOverrides(overrides);

  return overrides.items[normalizedId] || null;
}

module.exports = {
  getMenuOverrides,
  setMenuOverrides,
  updateMenuItemOverride,
};
