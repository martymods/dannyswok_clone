const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const TELEGRAM_MESSAGE_LIMIT = 4096;
const DEFAULT_TIMEZONE = 'America/New_York';

function isTelegramConfigured() {
  return Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);
}

function ensureFetchAvailable() {
  if (typeof fetch !== 'function') {
    const error = new Error('The Fetch API is not available in this environment.');
    error.code = 'fetch_unavailable';
    throw error;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clipMessage(text, limit = TELEGRAM_MESSAGE_LIMIT) {
  if (typeof text !== 'string') {
    return '';
  }
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 1)}…`;
}

function formatCurrency(amount) {
  const number = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(number)) {
    return null;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(number);
  } catch (error) {
    return `$${number.toFixed(2)}`;
  }
}

function formatTimestamp(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: DEFAULT_TIMEZONE,
    }).format(date);
  } catch (error) {
    return date.toLocaleString();
  }
}

function buildOrderNotificationMessage(order = {}, { metadata = null, context = null } = {}) {
  if (!order || typeof order !== 'object') {
    return '';
  }

  const fulfilmentRaw = order.fulfilment || (order.isDelivery ? 'Delivery' : 'Pickup');
  const fulfilment = typeof fulfilmentRaw === 'string' && fulfilmentRaw.trim()
    ? fulfilmentRaw.trim()
    : order.isDelivery
      ? 'Delivery'
      : 'Pickup';

  const customer = typeof order.customer === 'object' && order.customer ? order.customer : {};
  const items = Array.isArray(order.items) ? order.items : [];
  const notes = Array.isArray(order.notes) ? order.notes : [];

  const lines = [];
  lines.push('🍜 <b>New Order at Danny&#39;s Wok</b>');
  lines.push('');
  lines.push(`📦 Type: ${escapeHtml(fulfilment)}`);

  if (customer.name && typeof customer.name === 'string') {
    lines.push(`👤 Customer: ${escapeHtml(customer.name.trim())}`);
  }
  if (customer.phone && typeof customer.phone === 'string') {
    lines.push(`📞 Phone: ${escapeHtml(customer.phone.trim())}`);
  }
  if (order.isDelivery && customer.address && typeof customer.address === 'string') {
    lines.push(`📍 Address: ${escapeHtml(customer.address.trim())}`);
  }

  const formattedTotal = formatCurrency(order.grandTotal ?? order.total);
  if (formattedTotal) {
    lines.push(`💵 Total: ${escapeHtml(formattedTotal)}`);
  }

  const formattedSubtotal = formatCurrency(order.subtotal);
  if (formattedSubtotal) {
    const breakdownParts = [formattedSubtotal];
    const fees = [
      { label: 'Delivery', value: order.deliveryFee },
      { label: 'Express', value: order.expressFee },
      { label: 'Tip', value: order.tipAmount },
      { label: 'Fees & Tax', value: (order.processingFee || 0) + (order.taxAmount || 0) },
    ]
      .map(({ label, value }) => {
        const formatted = formatCurrency(value);
        return formatted ? `${label}: ${formatted}` : null;
      })
      .filter(Boolean);
    if (fees.length) {
      breakdownParts.push(...fees);
    }
    lines.push(`📊 Breakdown: ${escapeHtml(breakdownParts.join(' • '))}`);
  }

  if (items.length) {
    const itemLines = items.slice(0, 20).map((item) => {
      const quantity = Number.isFinite(item.quantity) ? item.quantity : Number(item.quantity) || 0;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const total = formatCurrency(item.total);
      const pieces = [`${quantity || 1}× ${name ? escapeHtml(name) : 'Item'}`];
      if (total) {
        pieces.push(`(${escapeHtml(total)})`);
      }
      return `• ${pieces.join(' ')}`;
    });
    lines.push('');
    lines.push('🧾 Items:');
    lines.push(...itemLines);
    if (items.length > 20) {
      lines.push(`• …and ${items.length - 20} more item(s)`);
    }
  }

  if (order.scheduleDescription && typeof order.scheduleDescription === 'string') {
    lines.push('');
    lines.push(`🗓️ Schedule: ${escapeHtml(order.scheduleDescription.trim())}`);
  }

  if (notes.length) {
    const noteLines = notes
      .map((note) => (typeof note === 'string' ? note.trim() : ''))
      .filter(Boolean)
      .map((note) => `• ${escapeHtml(note)}`);
    if (noteLines.length) {
      lines.push('');
      lines.push('📝 Notes:');
      lines.push(...noteLines);
    }
  }

  if (metadata?.notes && typeof metadata.notes === 'string' && !notes.length) {
    lines.push('');
    lines.push('📝 Notes:');
    lines.push(`• ${escapeHtml(metadata.notes.trim())}`);
  }

  const timestamp = formatTimestamp();
  lines.push('');
  lines.push(`🕐 Time: ${escapeHtml(timestamp)}`);

  if (context) {
    const contextLines = [];
    if (context.paymentIntentId) {
      contextLines.push(`Payment Intent: ${escapeHtml(context.paymentIntentId)}`);
    }
    if (context.checkoutSessionId) {
      contextLines.push(`Checkout Session: ${escapeHtml(context.checkoutSessionId)}`);
    }
    if (context.source) {
      contextLines.push(`Source: ${escapeHtml(context.source)}`);
    }
    if (contextLines.length) {
      lines.push('');
      lines.push(`🔎 ${contextLines.join(' • ')}`);
    }
  }

  const message = lines.join('\n').trim();
  return clipMessage(message);
}

async function sendTelegramMessage(text, { parseMode = 'HTML', chatId = TELEGRAM_CHAT_ID } = {}) {
  if (!isTelegramConfigured()) {
    const error = new Error('Telegram bot token or chat ID is not configured.');
    error.code = 'telegram_not_configured';
    throw error;
  }

  const safeText = clipMessage(text);
  if (!safeText) {
    const error = new Error('A message is required to send a Telegram notification.');
    error.code = 'telegram_message_required';
    throw error;
  }

  ensureFetchAvailable();

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: safeText,
    parse_mode: parseMode,
    disable_web_page_preview: true,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok || data?.ok === false) {
    const error = new Error(data?.description || `Telegram request failed with status ${response.status}`);
    error.code = 'telegram_request_failed';
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

async function sendOrderNotification(order, { metadata = null, context = null } = {}) {
  if (!isTelegramConfigured()) {
    return null;
  }

  const message = buildOrderNotificationMessage(order, { metadata, context });
  if (!message) {
    return null;
  }

  return sendTelegramMessage(message);
}

module.exports = {
  isTelegramConfigured,
  sendTelegramMessage,
  sendOrderNotification,
  buildOrderNotificationMessage,
};
