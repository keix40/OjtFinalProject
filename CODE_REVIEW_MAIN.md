# Code Review — Remediation Status

Tracks **P0 + P1 + P2** on branch `fix/grok-bot-fixes` (PR #16). Full original review: branch `cursor/code-review-main-6066`. Strict adversarial review: `cursor/pr16-strict-review-8b02` / `PR16_STRICT_REVIEW.md`.

---

## PR #16 strict review blockers — addressed

| ID | Item | Status |
|----|------|--------|
| C1 | `SecurityUtils` / JWT principal (`CustomUserDetails`) | **Fixed** — `UserDetailsServiceImpl` returns `CustomUserDetails`; `SecurityUtilsTest` |
| C2 | Passwordless login OTP takeover | **Fixed** — removed public `send-login-otp`; login OTP requires `passwordVerifiedAt` from login flow |
| C3 | CI false green | **Fixed** — `mvn test` only (no `\|\| package` fallback); frontend/gitleaks blocking |
| H1 | Order detail ownership | **Fixed** — `getOrderById` enforces self-or-admin |
| H2 | Address ownership on order create | **Fixed** |
| H3 | Server-side discount eligibility | **Fixed** — `findEligibleDiscount` at create/preview |
| H4–H5 | Event/Attribute/security-policy permissions | **Fixed** — `@RequiresPermission` on mutators |
| H6–H7 | Redis / blacklist fail-closed | **Fixed** when `REDIS_ENABLED=true` (Redis errors block, not bypass) |
| H8 | OTP type enforcement | **Fixed** — `login` / `email_verification` / `password_reset` |
| H9–H10 | Frontend cookie auth + fail-closed guards | **Mostly fixed** — removed `localStorage` token reads; guards deny on blacklist check errors |
| H12 | Public catalog | **Fixed** — removed `@RequiresPermission(PRODUCTS_VIEW)` from public GET product endpoints |
| H13 | `vercel.json` placeholder | **Fixed** — SPA-only rewrites; API via `environment.prod.ts` / same-origin proxy at deploy time |

**Still open (non-blocking / manual):** payment page re-fetch of server preview totals (M8), coupon metadata in localStorage (M9), git history purge, secret rotation.

## PR #16 R2 High — addressed

| Item | Status |
|------|--------|
| Login-attempt enumeration (sub-routes) | **Fixed** — all GET read endpoints require `SECURITY_VIEW_ATTEMPTS` (except public `is-blocked`) |
| Coupon / `findEligibleDiscount` bypass | **Fixed** — order commit uses `DiscountCouponService.requireEligibleDiscountForOrder` (autoApply, VIP, code, products, usage) |
| WebSocket auth | **Fixed** — handshake rejects unauthenticated clients; cookie or query JWT; STOMP SUBSCRIBE/SEND requires principal |
| Order debug endpoints | **Fixed** — `/order/analytics/debug`, `/order/test/vip-tier` require `ORDERS_VIEW` |

---

## P0 — implemented

| Item | Status |
|------|--------|
| Secrets externalized | **Addressed** |
| Authorization / IDOR | **Addressed** (strict-review fixes: order/address ownership, identity resolution) |
| PAN / saved cards (last-4) | **Addressed** |
| Server-side pricing | **Addressed** |
| OTP / verification | **Addressed** (typed OTP flows; no passwordless login OTP) |
| HttpOnly cookies | **Addressed** |

## P1 — implemented

| Item | Status |
|------|--------|
| XSS / innerHTML (DOMPurify) | **Addressed** |
| Prod environment (`environment.prod.ts`) | **Addressed** |
| Permission guards (fail-closed) | **Addressed** |
| Token/OTP logging removed | **Addressed** |
| Auth rate limiting | **Addressed** (in-memory; Redis optional in P2) |
| File upload sanitization | **Addressed** |

## P2 — implemented

| Item | Status | Summary |
|------|--------|---------|
| Lazy-loaded modules | **Addressed** | `AdminModule`, `CartModule`, `CheckoutModule` via `loadChildren` |
| N+1 + pagination | **Addressed** | Order list `@EntityGraph` + optional `page`/`size`; customer summaries via SQL aggregation |
| Input validation | **Addressed** | `spring-boot-starter-validation`, `@Valid` on auth/order/card DTOs, 400 handler |
| Redis blacklist + rate limit | **Addressed** | Optional `REDIS_ENABLED=true`; fail-closed on Redis errors when enabled; in-memory when disabled |
| Public catalog browsing | **Addressed** | SecurityConfig + product GET endpoints permit anonymous catalog reads |
| Admin UX (lux-async-state) | **Partial** | Customers + order management loading/error/retry |
| CI pipeline | **Addressed** | `.github/workflows/ci.yml` — blocking backend unit tests, frontend prod build, gitleaks |

## Residual items — addressed in-repo

| Item | Status | Notes |
|------|--------|-------|
| Google Maps API key | **Addressed** | Removed from `index.html`; `GoogleMapsLoaderService` + `GOOGLE_MAPS_API_KEY` env |
| Payment tokenization | **Documented + stub** | `PaymentTokenizationPort`, `PAYMENT_TOKENIZATION.md`; last-4 default preserved |
| Git history secrets | **Documented** | `SECURITY_ROTATION.md` — manual BFG/filter-repo steps |
| SessionUser type errors | **Addressed** | Optional profile fields on `SessionUser`; full profile via UserService when needed |

---

## Configuration reference

Copy `.env.example` to `.env`.

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET` | JWT signing (≥64 chars) | required in prod |
| `AUTH_RATE_LIMIT_*` | Auth rate limiting | enabled, 30 RPM |
| `REDIS_ENABLED` | Shared blacklist + rate limits | `false` |
| `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT` | Redis connection | localhost:6379 |
| `PAYMENT_PROCESSOR` | `local` or `stripe` (stub) | `local` |
| `GOOGLE_MAPS_API_KEY` | Frontend build-time injection | empty |
| `APP_*_UPLOAD_DIR` | Upload directories | see `.env.example` |

**Google Maps:** Restrict key in GCP Console to your domains (HTTP referrers). Inject at build:

```bash
# Example: patch environment.prod.ts or use CI secret
GOOGLE_MAPS_API_KEY=your-key npm run build -- --configuration=production
```

**Vercel:** `vercel.json` is SPA-only. Point `environment.prod.ts` `apiUrl` at your backend host at build time, or deploy frontend behind the same origin as the API.

---

## Manual actions still required

1. **Rotate** all previously exposed secrets (see `SECURITY_ROTATION.md`)
2. **Purge git history** if secrets were committed (BFG / git-filter-repo — force-push)
3. **Enable Redis** in production multi-instance: `REDIS_ENABLED=true`
4. **Restrict Maps key** in Google Cloud Console
5. **Choose payment processor** and implement `StripePaymentTokenizationAdapter` when ready
6. **Ensure CUSTOMER role** has `orders.create` / `orders.view` in DB seed

---

## Tests

- P0: `CardMaskingUtilTest`, `AuthServicePermissionTest`, `OrderServicePricingTest`
- P1: `AuthRateLimitFilterTest`, `FileUploadSanitizerTest`, `permission.guard.spec.ts`
- Strict review: `SecurityUtilsTest`, `LoginOtpSecurityTest`
