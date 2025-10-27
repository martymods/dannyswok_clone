const express = require('express');
const {
  isTelegramConfigured,
  sendTelegramMessage,
  sendOrderNotification,
  buildOrderNotificationMessage,
} = require('../services/telegram');

function createNotificationsRouter() {
  const router = express.Router();

  router.get('/telegram/test', async (req, res) => {
    if (!isTelegramConfigured()) {
      return res.status(503).json({
        ok: false,
        error: 'telegram_not_configured',
        message: 'Telegram bot credentials are not configured.',
      });
    }

    const messageParam = typeof req.query.message === 'string' ? req.query.message : '';
    const message = messageParam.trim() || 'Danny\'s Wok test notification sent via web browser.';

    try {
      const data = await sendTelegramMessage(message);
      return res.json({ ok: true, result: data });
    } catch (error) {
      const status = error?.status && Number.isInteger(error.status) ? error.status : 502;
      return res.status(status).json({
        ok: false,
        error: error?.code || 'telegram_request_failed',
        message: error?.message || 'Unable to send Telegram message.',
      });
    }
  });

  router.post('/telegram/order', async (req, res) => {
    if (!isTelegramConfigured()) {
      return res.status(503).json({
        ok: false,
        error: 'telegram_not_configured',
        message: 'Telegram bot credentials are not configured.',
      });
    }

    const order = req.body?.order || req.body;
    if (!order || typeof order !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'order_required',
        message: 'Provide an order payload to send a Telegram notification.',
      });
    }

    const metadata = req.body?.metadata;
    const message = buildOrderNotificationMessage(order, { metadata });
    if (!message) {
      return res.status(422).json({
        ok: false,
        error: 'invalid_order',
        message: 'Unable to format order details for Telegram notification.',
      });
    }

    try {
      const data = await sendOrderNotification(order, { metadata, context: { source: 'api/notifications' } });
      return res.json({ ok: true, result: data });
    } catch (error) {
      const status = error?.status && Number.isInteger(error.status) ? error.status : 502;
      return res.status(status).json({
        ok: false,
        error: error?.code || 'telegram_request_failed',
        message: error?.message || 'Unable to send Telegram message.',
      });
    }
  });

  return router;
}

module.exports = createNotificationsRouter;
