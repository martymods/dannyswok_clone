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
