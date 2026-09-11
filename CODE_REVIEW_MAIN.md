# Code Review — `main` Branch

See the full original review on branch `cursor/code-review-main-6066`. This document adds **remediation status** for PR `fix/grok-bot-fixes`.

---

## Remediation Status (P0 — implemented in this PR)

| P0 Item | Status | Summary |
|---------|--------|---------|
| 1. Secrets externalized | **Addressed** | `application.properties` uses `${ENV}` placeholders only; `.env.example` added. No real secrets committed. |
| 2. Authorization / IDOR | **Addressed** | Default-deny `SecurityConfig`; real `AuthService.currentUserHasPermission()`; ownership checks on orders, cards, wishlists, addresses, users. |
| 3. PAN / saved cards | **Addressed** | Store/return last-4 only via `CardMaskingUtil`; legacy full PAN masked on read. Payment processor tokenization still recommended. |
| 4. Server-side pricing | **Addressed** | `OrderService.resolveUnitPrice()` used in `createOrder` and `previewOrder`. |
| 5. OTP / verification | **Addressed** | Reset requires OTP code; registration sets `verified=false`; `/verify-otp` sets `verified=true` after valid OTP. |
| 6. HttpOnly cookies | **Addressed** | `AuthCookieService` sets/clears cookies; Angular uses `withCredentials` + `/api/auth/me` session (no localStorage tokens). |

### Residual risks (follow-up)

- **Rotate all previously exposed secrets** (DB, JWT, Gmail, IPQS, Google Maps) — git history purge is manual.
- **Payment tokenization** — interim stores last-4 only; integrate Stripe/similar for production PCI scope reduction.
- **P1 items** from original review (XSS/`innerHTML`, lazy loading, prod env file, rate limiting) not in this PR.
- **Customer role permissions** — ensure DB seed grants `orders.create` / `orders.view` to CUSTOMER role or checkout will 403.

### Tests added

- `CardMaskingUtilTest`
- `AuthServicePermissionTest`
- `OrderServicePricingTest`

### Required environment variables

Copy `.env.example` to `.env` and set at minimum:

- `DB_URL`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (≥64 chars)
- `MAIL_USERNAME`, `MAIL_PASSWORD` (if email OTP enabled)
- `COOKIE_SECURE=true` in production (HTTPS)
- Optional: `IPQS_API_KEY`, Twilio vars

---

*Original detailed findings remain on branch `cursor/code-review-main-6066`.*
