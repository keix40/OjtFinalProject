# Code Review — `main` Branch

See the full original review on branch `cursor/code-review-main-6066`. This document tracks **remediation status** for PR `fix/grok-bot-fixes` (P0 + P1).

---

## Remediation Status (P0 — implemented)

| P0 Item | Status | Summary |
|---------|--------|---------|
| 1. Secrets externalized | **Addressed** | `application.properties` uses `${ENV}` placeholders only; `.env.example` added. No real secrets committed. |
| 2. Authorization / IDOR | **Addressed** | Default-deny `SecurityConfig`; real `AuthService.currentUserHasPermission()`; ownership checks on orders, cards, wishlists, addresses, users. |
| 3. PAN / saved cards | **Addressed** | Store/return last-4 only via `CardMaskingUtil`; legacy full PAN masked on read. Payment processor tokenization still recommended. |
| 4. Server-side pricing | **Addressed** | `OrderService.resolveUnitPrice()` used in `createOrder` and `previewOrder`. |
| 5. OTP / verification | **Addressed** | Reset requires OTP code; registration sets `verified=false`; `/verify-otp` sets `verified=true` after valid OTP. |
| 6. HttpOnly cookies | **Addressed** | `AuthCookieService` sets/clears cookies; Angular uses `withCredentials` + `/api/auth/me` session (no localStorage tokens). |

---

## Remediation Status (P1 — implemented)

| P1 Item | Status | Summary |
|---------|--------|---------|
| 1. XSS / innerHTML | **Addressed** | DOMPurify via `HtmlSanitizerService` + `safeHtml` pipe on policies, activity logs, login-attempt flags, order-tracking policy modal. Activity log text escaped before HTML wrapping. |
| 2. Prod environment | **Addressed** | `environment.prod.ts` + `angular.json` `fileReplacements`; API calls use `/api`; media URLs via `mediaUrl()` / `mediaUrl` pipe. Vercel rewrites `/api` — set `YOUR_BACKEND_HOST` in `vercel.json` before deploy. |
| 3. Admin permission guards | **Addressed** | `PermissionGuard` fails closed when `permission` route data is missing; `/users/roles`, dashboard, policies, VIP tiers, revenue target guarded. |
| 4. Token/OTP logging | **Addressed** | Removed OTP/token `System.out` from `AuthController`, `TwilioVerificationService`; removed OTP/token `console.log` from auth UI flows. |
| 5. Rate-limit auth endpoints | **Addressed** | `AuthRateLimitFilter` on login/register/OTP/reset/refresh paths; configurable via `AUTH_RATE_LIMIT_*`. |
| 6. Sanitize file uploads | **Addressed** | `FileUploadSanitizer` used in product, category, brand, event, review, profile, return upload paths; UUID filenames, extension/MIME allowlist, path traversal checks, configurable dirs. |

### Tests added

- P0: `CardMaskingUtilTest`, `AuthServicePermissionTest`, `OrderServicePricingTest`
- P1: `AuthRateLimitFilterTest`, `FileUploadSanitizerTest`, `permission.guard.spec.ts`

### Configuration reference

Copy `.env.example` to `.env`. Key variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET` | JWT signing (≥64 chars) | required in prod |
| `COOKIE_SECURE` | HttpOnly cookie Secure flag | `false` (set `true` with HTTPS) |
| `AUTH_RATE_LIMIT_ENABLED` | Enable auth rate limiting | `true` |
| `AUTH_RATE_LIMIT_RPM` | Max POST auth requests per IP per minute | `30` |
| `APP_UPLOAD_DIR` | Profile uploads | `uploads` |
| `APP_PRODUCT_UPLOAD_DIR` | Product images | `product_image` |
| `APP_CATEGORY_UPLOAD_DIR` | Brand/category images | `brand_and_category_image` |
| `APP_EVENT_UPLOAD_DIR` | Event banners | `event` |
| `APP_RETURN_IMAGES_DIR` | Return evidence | `return_images` |
| `APP_REVIEW_UPLOAD_DIR` | Review media | `review` |

**Frontend prod API URL:** Production builds use `environment.prod.ts` (`apiUrl: '/api'`). Deploy behind a reverse proxy that forwards `/api` to the backend, or set `serverUrl` in `environment.prod.ts` if the API host differs from static assets.

**Vercel:** Replace `YOUR_BACKEND_HOST` in `frontend/Ecommerce/vercel.json` with your backend hostname (no scheme).

### Residual risks (follow-up)

- **Rotate all previously exposed secrets** (DB, JWT, Gmail, IPQS, Google Maps) — git history purge is manual.
- **Payment tokenization** — interim stores last-4 only; integrate Stripe/similar for production PCI scope reduction.
- **Rate limiter** — in-memory only; multi-instance production needs Redis-backed limiter.
- **Google Maps API key** in `index.html` — move to env/build injection.
- **Customer role permissions** — ensure DB seed grants `orders.create` / `orders.view` to CUSTOMER role or checkout will 403.
- **`/admin/profile/:id`** — uses `AuthGuard` only (self-profile); backend must enforce ownership.

---

*Original detailed findings remain on branch `cursor/code-review-main-6066`.*
