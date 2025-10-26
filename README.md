# Danny's Wok Clone

This project now includes a Stripe-powered checkout experience that supports standard card payments as well as Apple Pay (via the Payment Request API).

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
4. Visit `http://localhost:3000` to explore the menu and place an order. When you press **Place order**, a secure Stripe checkout modal will appear.

> **Note:** Apple Pay availability depends on browser and device support. When unavailable, the standard card payment option will still be shown.
