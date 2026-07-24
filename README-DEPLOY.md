# Getting Testable running standalone on Netlify — with paid credits

## Files

- `press-run.html` — the app (rename to `index.html` for a root URL)
- `admin.html` — your private page for granting credits (not linked from the app, just visit it directly)
- `netlify.toml` — function config
- `package.json` — declares the Netlify Blobs dependency
- `netlify/functions/claude-proxy.js` — holds your API key, checks/deducts credits per call
- `netlify/functions/admin-credits.js` — backend for `admin.html`

## Setup

1. Drop everything into your Netlify site's repo, keeping the folder structure exactly as-is.
2. In Netlify: **Site settings → Environment variables**, add two:
   - `ANTHROPIC_API_KEY` — your real key
   - `ADMIN_SECRET` — make up a long random password only you know (this guards `admin.html`)
3. Deploy.
4. Netlify Blobs needs no separate setup — it's automatically available to functions on any Netlify site.

## How the money side works

1. Sell "credits" as a Gumroad product on Ascend Guides Co (or wherever) — e.g. "20 Testable credits."
2. When someone buys, you generate a code for them (anything memorable, e.g. `ASCEND-K7X2`) and deliver it however you already deliver digital products.
3. You open `yoursite.netlify.app/admin.html`, enter your `ADMIN_SECRET`, the code, and the credit amount, hit **Grant credits**.
4. The buyer opens the main app, taps the gear icon, pastes in their code. It's remembered on their device from then on.
5. Every successful generation deducts exactly 1 credit, checked and enforced server-side in `claude-proxy.js` — not in the browser, so it can't be bypassed by editing the page.
6. When a code hits 0, the app tells them plainly they're out of credits instead of erroring cryptically.

## Worth knowing

- Credits are tracked per code, not per visitor — anyone who has the code can spend its credits. Treat codes like a redeemable gift card: unique per buyer, don't reuse one across customers.
- There's no automatic Gumroad → credit-granting pipeline here — you're the one topping up codes via `admin.html` after each sale. If volume grows enough that this gets tedious, a Gumroad webhook that calls `admin-credits.js` automatically is the natural next step (not built yet — one thing at a time).
- Keep `admin.html` and `ADMIN_SECRET` private. Anyone with that secret can mint themselves unlimited free credits.
