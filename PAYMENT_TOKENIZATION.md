# Payment Tokenization — Migration Path

## Current state (P0 interim)

- `LastFourPaymentTokenizationAdapter` (`app.payment.processor=local`, default) stores **last 4 digits only** via `CardMaskingUtil`.
- Full PAN is never persisted after P0; legacy rows are masked on read.
- This reduces exposure but **does not satisfy PCI DSS** for handling card data on your servers.

## Target architecture

```
Browser (Stripe.js / similar)
    → payment_method id (pm_xxx) or token (tok_xxx)
    → Backend PaymentTokenizationPort
    → Store processor reference + last4 + brand only
```

## Backend boundary

| Class | Role |
|-------|------|
| `PaymentTokenizationPort` | Interface — swap implementations without changing controllers |
| `LastFourPaymentTokenizationAdapter` | **Default** — local last-4 surrogate (`local:1234`) |
| `StripePaymentTokenizationAdapter` | **Stub** — enable with `app.payment.processor=stripe` after implementing |

## Enabling Stripe (when ready)

1. Create Stripe account; obtain **publishable** + **secret** keys (secret in env only: `STRIPE_SECRET_KEY`).
2. Client: collect card with Stripe Elements; send `payment_method` id to backend — **never send raw PAN to your API**.
3. Implement `StripePaymentTokenizationAdapter.tokenize()` to validate the payment method server-side and return `PaymentToken`.
4. Set `app.payment.processor=stripe` and remove local PAN handling from checkout UI.

## Config

```properties
app.payment.processor=local   # default — last-4 interim
# app.payment.processor=stripe  # after StripePaymentTokenizationAdapter is implemented
```

## What not to do

- Do not commit Stripe secret keys
- Do not log payment_method ids with user PII in production logs
- Do not store CVV (never supported in SavedCard flow)
