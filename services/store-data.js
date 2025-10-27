const path = require('path');
const { readJsonFile, writeJsonFile } = require('./json-store');

const storesPath = path.join(__dirname, '..', 'data', 'stores.json');

const defaultStores = [
  {
    id: 'southwest',
    label: 'Southwest',
    address: "5750 BALTIMORE AVE, PHILADELPHIA PA 19143",
    shortAddress: '5750 BALTIMORE AVE',
    phone: '215-471-9020',
    latitude: 39.94346,
    longitude: -75.23863,
  },
  {
    id: 'olney',
    label: 'One & Olney Plaza',
    address: '5675 N Front St Unit 280, PHILADELPHIA, PA, 19120',
    shortAddress: '5675 N FRONT',
    phone: '215-276-8885',
    latitude: 40.039947,
    longitude: -75.122995,
  },
  {
    id: 'hunting-park',
    label: 'Hunting Park',
    address: '4322 North Broad Street, Philadelphia, PA 19140',
    shortAddress: '4322 NORTH BROAD STREET',
    phone: '267-331-6699',
    latitude: 40.016985,
    longitude: -75.145408,
  },
];

function normalizeStoresPayload(payload) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.stores)) {
    return { stores: defaultStores };
  }
  const stores = payload.stores
    .map((store) => ({
      ...store,
      id: typeof store.id === 'string' ? store.id.trim().toLowerCase() : null,
    }))
    .filter((store) => store.id);
  if (!stores.length) {
    return { stores: defaultStores };
  }
  return { stores };
}

async function getStores() {
  const data = await readJsonFile(storesPath, { stores: defaultStores });
  return normalizeStoresPayload(data);
}

async function setStores(stores) {
  const payload = normalizeStoresPayload({ stores });
  await writeJsonFile(storesPath, payload);
  return payload;
}

async function updateStoreLocation(storeId, latitude, longitude) {
  const normalizedId = typeof storeId === 'string' ? storeId.trim().toLowerCase() : '';
  if (!normalizedId) {
    throw new Error('Store id is required');
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Valid coordinates are required');
  }
  const storesPayload = await getStores();
  const stores = storesPayload.stores.map((store) => {
    if (store.id !== normalizedId) {
      return store;
    }
    return {
      ...store,
      latitude: lat,
      longitude: lng,
      updatedAt: new Date().toISOString(),
    };
  });
  await setStores(stores);
  return stores.find((store) => store.id === normalizedId) || null;
}

module.exports = {
  getStores,
  setStores,
  updateStoreLocation,
};
