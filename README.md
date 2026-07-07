# The Unraveling — Setup

## Swapping in real photos

The design has three photo slots, currently showing placeholder color blocks with captions:
1. Hero — wildflowers (`.hero-photo-1`)
2. Hero — the long table (`.hero-photo-2`)
3. About — doves in flight (`.about-photo`)

To use a real photo: put the image file in an `images/` folder next to `index.html`, then replace the
slot's inner markup. For example, change:

```html
<div class="photo-slot-inner">
  <figcaption class="photo-caption">photograph · wildflowers</figcaption>
</div>
```

to:

```html
<div class="photo-slot-inner" style="padding:0;">
  <img src="images/wildflowers.jpg" alt="Wildflowers in golden light">
</div>
```

Images are cropped to fill the frame automatically (`object-fit: cover`). Use photos at least
1200px wide. Warm, natural light matches the palette best.

Static site with an embedded Square card form (`index.html`) backed by a serverless
function (`api/process-payment.js`) that charges the card via Square's Payments API.
Built for deployment on Vercel.

## 1. Get Square Sandbox credentials

In the [Square Developer Dashboard](https://developer.squareup.com/apps):
1. Open your application (or create one).
2. Go to the **Sandbox** tab.
3. Copy the **Sandbox Application ID**, **Sandbox Access Token**, and a **Sandbox Location ID**
   (Locations tab — Square gives you a default test location).

## 2. Fill in credentials

**Client-side (safe to expose — these are public IDs, not secrets):**
In `index.html`, near the bottom, replace:
```js
const SQUARE_APPLICATION_ID = 'REPLACE_WITH_YOUR_SANDBOX_APPLICATION_ID';
const SQUARE_LOCATION_ID = 'REPLACE_WITH_YOUR_SANDBOX_LOCATION_ID';
```

**Server-side (secret — never put this in index.html):**
Copy `.env.example` to `.env` and fill in:
```
SQUARE_ACCESS_TOKEN=your-sandbox-access-token
SQUARE_LOCATION_ID=your-sandbox-location-id
SQUARE_ENVIRONMENT=sandbox
```

## 3. Install dependencies

```bash
npm install
```

## 4. Run locally with Vercel

```bash
npm install -g vercel   # one-time
vercel dev
```

This serves `index.html` and runs `api/process-payment.js` as a local serverless function,
matching how it'll behave once deployed.

## 5. Test with Square's sandbox test cards

Use card number `4111 1111 1111 1111`, any future expiration date, any CVV, and any postal code.
Square's docs list more sandbox test cards (including decline scenarios) at
https://developer.squareup.com/docs/testing/test-values

## 6. Deploy

```bash
vercel
```

Then in the Vercel project dashboard, add `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, and
`SQUARE_ENVIRONMENT` as Environment Variables (same values as your `.env`). Redeploy after adding them.

## 7. Go live

When ready for real charges:
1. Switch `index.html`'s `<script src="https://sandbox.web.squarecdn.com/v1/square.js">` to
   `https://web.squarecdn.com/v1/square.js`.
2. Swap in your **Production** Application ID / Location ID in `index.html`.
3. Update the Vercel env vars to your **Production** access token and location ID, and set
   `SQUARE_ENVIRONMENT=production`.
