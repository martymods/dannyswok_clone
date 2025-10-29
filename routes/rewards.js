const express = require('express');
const {
  getRewardsOverview,
  updateRewardsSettings,
  updateRewardsAutomation,
} = require('../services/rewards-data');

function createRewardsRouter() {
  const router = express.Router();

  router.get('/settings', async (_req, res) => {
    try {
      const { settings, automation, summary } = await getRewardsOverview();
      res.json({ settings, automation, summary });
    } catch (error) {
      res.status(500).json({ error: 'rewards_unavailable' });
    }
  });

  router.patch('/settings', async (req, res) => {
    try {
      const updated = await updateRewardsSettings(req.body || {});
      res.json({ settings: updated });
    } catch (error) {
      res.status(400).json({
        error: 'rewards_settings_update_failed',
        message: error.message || 'Unable to update reward settings.',
      });
    }
  });

  router.get('/winners', async (_req, res) => {
    try {
      const { winners } = await getRewardsOverview();
      res.json({ winners });
    } catch (error) {
      res.status(500).json({ error: 'rewards_unavailable' });
    }
  });

  router.get('/events', async (_req, res) => {
    try {
      const { events } = await getRewardsOverview();
      res.json({ events });
    } catch (error) {
      res.status(500).json({ error: 'rewards_unavailable' });
    }
  });

  router.patch('/automation', async (req, res) => {
    try {
      const automation = await updateRewardsAutomation(req.body || {});
      res.json({ automation });
    } catch (error) {
      res.status(400).json({
        error: 'rewards_automation_update_failed',
        message: error.message || 'Unable to update reward automations.',
      });
    }
  });

  return router;
}

module.exports = createRewardsRouter;
