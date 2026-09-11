# Code Review — Remediation Status

Tracks **P0 + P1 + P2** on branch `fix/grok-bot-fixes` (PR #16). Full original review: branch `cursor/code-review-main-6066`.

---

## P0 — implemented

| Item | Status |
|------|--------|
| Secrets externalized | **Addressed** |
| Authorization / IDOR | **Addressed** |
| PAN / saved cards (last-4) | **Addressed** |
| Server-side pricing | **Addressed** |
| OTP / verification | **Addressed** |
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
| Redis blacklist + rate limit | **Addressed** | Optional `REDIS_ENABLED=true`; in-memory fallback when disabled |
| Public catalog browsing | **Addressed** | Home, product list/detail, categories, brands public; cart/checkout/auth protected |
| Admin UX (lux-async-state) | **Partial** | Customers + order management loading/error/retry |
| CI pipeline | **Addressed** | `.github/workflows/ci.yml` — backend test, frontend build, gitleaks, npm audit |

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

**Vercel:** Set `YOUR_BACKEND_HOST` in `frontend/Ecommerce/vercel.json`.

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
