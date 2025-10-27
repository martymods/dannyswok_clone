const express = require('express');
const { getMenuOverrides } = require('../services/menu-overrides');
const { getStores } = require('../services/store-data');

function createMenuRouter() {
  const router = express.Router();

  router.get('/overrides', async (_req, res) => {
    try {
      const overrides = await getMenuOverrides();
      res.json(overrides);
    } catch (error) {
      res.status(500).json({ error: 'menu_overrides_unavailable' });
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

  return router;
}

module.exports = createMenuRouter;
