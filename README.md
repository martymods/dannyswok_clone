# Danny's Wok Clone

This project now includes a Stripe-powered checkout experience that supports standard card payments, an Apple Pay button that redirects to Stripe Checkout, and the Payment Request API wallet button for compatible browsers.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example` and supply your `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` values.
   - If you are deploying the static files without the Node.js server, place your publishable key inside `stripe-config.json` to
     avoid missing configuration errors in the browser.
3. Start the local server:
   ```bash
   npm start
   ```
4. Visit `http://localhost:3000` to explore the menu and place an order. When you press **Place order**, a secure payment dialog will appear with options to use the new Apple Pay button (hosted on checkout.stripe.com) or enter card details directly.

> **Note:** Apple Pay availability depends on browser and device support. When unavailable, the standard card payment option will still be shown.

## Telegram order notifications

Configure the following environment variables to enable real-time Telegram alerts when a new order is created:

| Key | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Bot token provided by [@BotFather](https://core.telegram.org/bots/tutorial#obtain-your-bot-token). |
| `TELEGRAM_CHAT_ID` | The chat ID that should receive order notifications. |

When these values are present the server automatically formats and sends a message that includes the fulfilment type, customer details, delivery address (when applicable), line items, totals, and notes every time a payment intent or Checkout session is created.

For manual testing you can open a browser and visit:

```
https://<your-domain>/api/notifications/telegram/test?message=Hello%20Danny
```

This endpoint sends the provided `message` (or a default message) to the configured chat so you can verify the integration end-to-end without placing an actual order.
