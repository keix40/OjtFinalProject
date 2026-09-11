# PR #16 Strict Adversarial Code Review

**Repository:** [keix40/OjtFinalProject](https://github.com/keix40/OjtFinalProject)  
**PR:** [#16 — P0–P2 security & hardening](https://github.com/keix40/OjtFinalProject/pull/16)  
**Branch:** `fix/grok-bot-fixes` → `main`  
**Head SHA:** `e06b8e04`  
**Reviewer stance:** Independent, adversarial — did not author this PR  
**Review date:** 2026-09-11  

---

## Merge Recommendation: **BLOCK**

This PR makes meaningful security investments (HttpOnly cookies, DOMPurify, server-side unit pricing, upload path sanitization, rate limiting scaffolding, CI skeleton). However, several **Critical** defects undermine core auth and checkout flows, and `CODE_REVIEW_MAIN.md` overstates remediation completeness. Do **not** merge until Critical and listed High items are fixed and verified end-to-end.

---

## Executive Summary

- **Cookie auth is wired but user identity resolution is broken.** `SecurityUtils.getCurrentUserId()` only reads `CustomUserDetails`, which is never instantiated anywhere in the codebase. JWT auth sets `org.springframework.security.core.userdetails.User` as principal. Result: `/api/auth/me` returns 401, `createOrder`/`previewOrder` throw `AccessDeniedException`, and all `enforceSelfOrAdmin` ownership checks fail for normal sessions.
- **Passwordless account takeover via login OTP.** Public `POST /api/auth/send-login-otp` + `POST /api/auth/verify-login-otp` mint full sessions without password verification — contradicting the intended post-password OTP flow in the login handler.
- **Authorization claims in CODE_REVIEW_MAIN.md are overstated.** Unauthenticated CMS mutation (events, attributes), order IDOR, address IDOR, unvalidated discount application, and security-policy CRUD without permissions remain.
- **Checkout unit prices are server-authoritative (good), but discounts and addresses are not.** Client-supplied `discountId` is applied without eligibility validation; addresses are loaded by ID without ownership checks.
- **Redis optional path fails open on errors** — blacklisted tokens and rate limits are bypassed during Redis outages; in-memory fallback is per-instance and unsuitable for multi-instance production without explicit ops awareness.
- **Frontend auth migration is half-done.** ~13 files still read `localStorage` tokens; WebSockets pass JWT in query strings; guards fail open on blacklist check errors; payment page submits client-computed totals and trusts `history.state`.
- **CI can report green while tests/build fail.** Backend `mvn test || mvn -DskipTests package`, frontend `continue-on-error`, gitleaks `continue-on-error`, and no frontend test execution.
- **Public catalog browsing is not actually public.** `SecurityConfig` permits GET `/product/**`, but `@RequiresPermission(PRODUCTS_VIEW)` on product list endpoints blocks anonymous users.

---

## CODE_REVIEW_MAIN.md Claim Verification

| Claim | Verdict | Notes |
|-------|---------|-------|
| Authorization / IDOR **Addressed** | **False / Overstated** | `SecurityUtils` bug breaks ownership checks; order/address/coupon IDORs remain |
| Server-side pricing **Addressed** | **Partial** | `resolveUnitPrice()` ignores client line prices; discounts/addresses not validated |
| OTP / verification **Addressed** | **False** | Login OTP bypass; OTP type not enforced on `verify-otp` / `reset-password` |
| HttpOnly cookies **Addressed** | **True** | `AuthCookieService` sets `HttpOnly`; `Secure` defaults false |
| Permission guards fail-closed | **Partial** | `PermissionGuard` fails closed; many backend mutators unguarded; frontend guards fail open on errors |
| Auth rate limiting **Addressed** | **Partial** | Implemented; Redis/in-memory fail-open on error |
| Redis blacklist + rate limit | **Partial** | Implemented; fail-open on Redis errors; in-memory not shared across instances |
| Public catalog browsing | **False** | Product GET endpoints require `products.view` permission |
| Input validation | **Partial** | Auth/order/card DTOs validated; reset password, coupons, many controllers not |
| CI pipeline **Addressed** | **False** | Pipeline exists but does not reliably gate merges |
| XSS / DOMPurify | **Partial** | Central sanitizer + pipe; some pre-sanitize `innerHTML` patterns remain |
| File upload sanitization | **Partial** | Path traversal blocked; extension-only validation, no magic-byte check |
| Lazy-loaded modules | **True** | Modules compile; lazy wiring present |
| PAN / saved cards last-4 | **Mostly True** | `CardMaskingUtil` + entity constraints; legacy PAN masking tested; CVV sent from profile UI |

---

## Findings by Severity

### Critical

| # | Finding | Impact | Location | Suggested Fix |
|---|---------|--------|----------|---------------|
| C1 | **`SecurityUtils.getCurrentUserId()` incompatible with JWT principal** — only handles `CustomUserDetails`; `CustomUserDetails` is never constructed (`new CustomUserDetails` — 0 matches). `JwtAuthenticationFilter` sets `UserDetailsServiceImpl.loadUserByUsername()` result (`org.springframework.security.core.userdetails.User`) as principal. | `/api/auth/me` always 401 for cookie sessions; `OrderService.createOrder` / `previewOrder` fail at `requireCurrentUserId()`; `SavedCardService.enforceSelfOrAdmin`, address/wishlist ownership checks broken. Entire cookie-auth identity layer non-functional. | `SecurityUtils.java:23-32`, `JwtAuthenticationFilter.java:111-114`, `AuthController.java:395-419`, `OrderService.java:194-200,448-452` | Return `CustomUserDetails` from `UserDetailsServiceImpl`, or resolve user ID from JWT `id` claim / email lookup in `SecurityUtils`. Add integration test: login → `/me` → create order. |
| C2 | **Login OTP bypass (passwordless session)** — `send-login-otp` is public and sends OTP to any existing email without password proof; `verify-login-otp` mints access+refresh cookies. | Full account takeover for any known email with intercepted/brute-forced OTP (10-min window, rate limits bypassable via IP header spoofing). | `AuthController.java:737-759,460-556`, `SecurityConfig.java:50-52` | Remove standalone `send-login-otp` or require prior password auth + server-side login nonce. Only issue login OTP from the `requireOtpCaptcha` branch (lines 182-198). |
| C3 | **CI backend job masks test failures** — `mvn test \|\| mvn -DskipTests package` exits 0 after test failure. | Broken backend merges with green CI. | `.github/workflows/ci.yml:36-37` | Use `mvn -B test` only; fail the job on test failure. |

### High

| # | Finding | Impact | Location | Suggested Fix |
|---|---------|--------|----------|---------------|
| H1 | **Order detail IDOR** — `getOrderById` requires `orders.view` but no ownership check. | Any user with `orders.view` reads any order by ID (PII, address, card last-4). | `OrderController.java:443-447`, `OrderService.java:847-850` | Enforce `order.user.id == requireCurrentUserId()` unless admin. |
| H2 | **Address IDOR on order creation** — address loaded by ID without verifying `address.user.id == order.user.id`. | Attacker ships to victim's address. | `OrderService.java:218-220` | Validate address ownership before `order.setAddress()`. |
| H3 | **Unvalidated discount application** — client `discountId` applied without eligibility, usage limits, min spend, or date checks (unlike `DiscountCouponService.validateCoupon`). | Arbitrary/admin coupon application; discount abuse. | `OrderService.java:273-281` | Reuse `validateCoupon` logic at order commit; reject ineligible discounts. |
| H4 | **Event/attribute CMS open to any authenticated user** — create/update/delete have no `@RequiresPermission`. | Any customer creates/deletes promotional events and product attributes. | `EventController.java:30-81`, `AttributeController.java:65-197` | Add admin permissions on all mutating endpoints. |
| H5 | **Security policy CRUD unguarded** — GET/PUT/DELETE `/api/login-attempts/security-policy*` lack `@RequiresPermission`. | Any authenticated user reads/modifies login security policy. | `LoginAttemptController.java:175-192` | Restrict to `SECURITY_UPDATE_ATTEMPTS` / admin view permissions. |
| H6 | **Redis blacklist & rate limit fail-open** | Logged-out tokens remain valid; auth endpoints unbounded during Redis outage. | `RedisTokenBlacklistStore.java:39-46`, `RedisAuthRateLimitStore.java:36-38` | Fail-closed on blacklist reads; fall back to in-memory store on Redis failure instead of allowing traffic. |
| H7 | **JWT filter blacklist check fail-open** | Blacklisted users retain API access when blacklist lookup throws. | `JwtAuthenticationFilter.java:107-109` | Return 403 on blacklist lookup failure for authenticated requests. |
| H8 | **OTP cross-flow confusion** — single OTP row per email; `verify-otp` and `reset-password` do not check OTP `type`. Login OTP can verify email (`verify-otp`) or reset password (`reset-password`). | Flow confusion, wrong side effects, OTP invalidation across flows. | `AuthController.java:440-457,680-707`, `OtpVerification` single-row model | Composite key `(email, type)`; enforce type on all verify endpoints. |
| H9 | **Frontend auth migration incomplete** — 13+ files still use `localStorage.getItem('token')` / Bearer headers while auth moved to HttpOnly cookies. | Notifications WS never connects, address CRUD sends `Bearer null`, role/coupon APIs broken after cookie login; reintroducing localStorage tokens re-exposes XSS theft. | `notifcation.service.ts`, `address.service.ts`, `payment.component.ts`, `cart-page.component.ts`, etc. | Remove all localStorage token paths; use `withCredentials` + session from `/me`. |
| H10 | **Frontend guards fail open on blacklist errors** | Network/backend errors grant access to blacklisted users. | `auth.guard.service.ts:75-77`, `blacklist.guard.ts:47` | Fail closed: deny access or show blocking page on check failure. |
| H11 | **CI frontend build + gitleaks use `continue-on-error`** | Broken prod builds and secret leaks do not block merge. | `.github/workflows/ci.yml:21,55` | Remove `continue-on-error`; fix underlying failures. |
| H12 | **Public product catalog blocked for anonymous users** — `@RequiresPermission(PRODUCTS_VIEW)` on product GET endpoints conflicts with `permitAll` intent. | Anonymous browsing broken; contradicts P2 "public catalog" claim. | `ProductController.java:87-97`, `SecurityConfig.java:61-63` | Remove permission requirement from public read endpoints or grant anonymous `products.view`. |
| H13 | **Production deploy placeholder** — `vercel.json` uses `YOUR_BACKEND_HOST`; only `/api` rewritten. | Production API routing broken; `/order`, `/card`, `/ws` not proxied. | `frontend/Ecommerce/vercel.json:6-8` | Set real backend URL; proxy all backend prefixes. |

### Medium

| # | Finding | Impact | Location | Suggested Fix |
|---|---------|--------|----------|---------------|
| M1 | **CSRF disabled + credentialed CORS** — localhost-only origins; no prod CORS env config. | CSRF on cookie-auth mutations in misconfigured prod; CORS breaks non-localhost deploys. | `SecurityConfig.java:40,98-128` | Externalize allowed origins; consider CSRF tokens or `SameSite=Strict` for sensitive cookies. |
| M2 | **Public coupon validation IDOR** — `POST /api/coupons/validate` is public, accepts client `userId`; `GET /api/coupons/user/{userId}` has no ownership check. | Coupon enumeration/eligibility leak for arbitrary users. | `CouponController.java:33-51`, `SecurityConfig.java:78` | Require auth; bind userId to current user; add `@Valid`. |
| M3 | **IP spoofing for rate limit / ban** — trusts `X-Client-IP`, `X-Debug-IP` from client. | Bypass IP rate limits and IP bans. | `IpLocationUtil.java:28-36` | Only trust forwarded headers from known reverse proxies; strip debug headers in prod. |
| M4 | **WebSocket handshake always succeeds; token in query string** | Anonymous topic subscription; token leakage via logs/referrer. | `JwtHandshakeInterceptor.java:50`, `SecurityConfig.java:83` | Reject handshake without valid token; use cookie auth or ticket exchange. |
| M5 | **Public debug endpoints** — `/product/debug/discounts`, `/product/debug/products-with-discounts` unauthenticated via `GET /product/**` permitAll. | Unauthenticated discount intelligence leak. | `ProductController.java:249-296` | Remove or guard; disable in prod profile. |
| M6 | **Upload validation extension-only** — no magic-byte/content inspection; `Content-Type` optional for images. | Polyglot/malicious upload if served from `/uploads/**` (permitAll). | `FileUploadSanitizer.java:42-58`, `SecurityConfig.java:67-74` | Verify with `ImageIO`/Tika; serve uploads with safe headers or separate domain. |
| M7 | **Refresh token not rotated** | Stolen refresh token valid until expiry/logout. | `AuthController.java:362-381` | Rotate refresh token on each refresh; detect reuse. |
| M8 | **Payment page trusts client totals + `history.state`** | Tampered checkout state (address, discount, delivery fee); display/submit mismatch with server preview. | `payment.component.ts:99-113,348-350,471-486` | Re-fetch `/order/preview` on payment; submit only IDs/qty; strip client monetary fields. |
| M9 | **Coupon metadata in localStorage trusted at payment** | Forged `discountId` / discount amounts. | `cart-page.component.ts`, `payment.component.ts:643-652` | Server-issued coupon token; re-validate on submit. |
| M10 | **CVV included in profile save-card payload** | PCI scope expansion if backend persists CVV. | `user-payment-methods.component.ts:90-94` | Strip CVV before POST; tokenize via payment processor. |
| M11 | **Login blacklist check fail-open** | Blacklisted users may log in when DB/service errors. | `AuthController.java:171-175` | Fail closed on blacklist errors. |
| M12 | **In-memory Redis fallback breaks multi-instance assumptions silently** | Per-instance blacklist/rate limits; logout on instance A doesn't invalidate on instance B. | `InMemoryTokenBlacklistStore.java`, `InMemoryAuthRateLimitStore.java` | Document loudly; require `REDIS_ENABLED=true` in prod; health check warns when Redis disabled in multi-instance. |
| M13 | **No frontend tests in CI** | 48 spec files including `permission.guard.spec.ts` never run. | `.github/workflows/ci.yml:39-55` | Add `npm test -- --watch=false --browsers=ChromeHeadless`. |
| M14 | **reset-password uses JPA entity, no validation** | Weak passwords accepted; no structured 400 responses. | `AuthController.java:680-707` | DTO with `@Valid`, `@Size(min=8)`, password strength rules. |
| M15 | **Profile avatar uses Authorization header without token validation** | Inconsistent auth surface; forged header handling. | `AuthController.java:711-723` | Use cookie auth + `validateToken()` like other endpoints. |

### Low / Info

| # | Finding | Impact | Location | Suggested Fix |
|---|---------|--------|----------|---------------|
| L1 | Cookie defaults unsafe for prod (`COOKIE_SECURE=false`, `SameSite=Lax`) | Session cookie theft via MITM if deployed as-is. | `application.properties`, `AuthCookieService.java:22-26` | Enforce secure cookies in prod profile. |
| L2 | `UserDetailsServiceImpl` grants `permission.getName()` but JWT/`@RequiresPermission` use `permission.getKey()` | Authority mismatch on non-JWT code paths. | `UserDetailsServiceImpl.java:52-55`, `JwtTokenProvider.java:50-52` | Align on `getKey()` everywhere. |
| L3 | `@RequiresPermission.level` ignored by aspect | Decorative annotation; misleading for reviewers. | `PermissionAspect.java:18-24` | Implement level checks or remove attribute. |
| L4 | Public IP-ban oracle — `GET /api/login-attempts/is-blocked?ip=` | Reveals ban status to unauthenticated callers. | `LoginAttemptController.java:156-165` | Require admin auth or remove. |
| L5 | CDN scripts without SRI | CDN compromise → full app takeover. | `index.html:13-22` | Add SRI or self-host; add CSP. |
| L6 | Debug logging of order/financial data in payment component | Sensitive data in browser logs. | `payment.component.ts:414-428` | Remove in production builds. |
| L7 | `admin/profile/:id` AuthGuard-only | Inconsistent with other admin routes; future IDOR risk. | `admin-routing.module.ts:74` | Add `PermissionGuard`; enforce self-only if applicable. |
| L8 | Card tests miss null/blank/legacy PAN edge cases | Regression risk on PCI display path. | `CardMaskingUtilTest.java` | Add null, blank, full-PAN-never-returned assertions. |
| L9 | Security tests shallow / no integration coverage | Authorization and order flows unverified by CI. | Test suite overall | Add `@WebMvcTest` for `@RequiresPermission`, order IDOR, `/me` session tests. |

---

## What Looks Solid

1. **HttpOnly auth cookies** — `AuthCookieService` correctly sets `HttpOnly`, configurable `Secure`/`SameSite` (`AuthCookieService.java:68-78`).
2. **Server-side unit pricing** — `OrderService.resolveUnitPrice()` overwrites client `CartDTO.price` at order time (`OrderService.java:315-316,921-929`); covered by `OrderServicePricingTest`.
3. **Card last-4 storage** — `CardMaskingUtil` + `SavedCard` entity constraints; legacy PAN stripped in `maskForDisplay`.
4. **Upload path traversal defense** — `FileUploadSanitizer.resolveUploadPath()` with tests.
5. **Auth rate limiting scaffold** — `AuthRateLimitFilter` + configurable RPM; `AuthRateLimitFilterTest` verifies 429 behavior.
6. **Central XSS sanitization** — `HtmlSanitizerService` + DOMPurify + `SafeHtmlPipe`; most `[innerHTML]` bindings use `| safeHtml`.
7. **PermissionGuard fail-closed** — Missing route permission blocks access (unit tested).
8. **JWT blacklist enforcement (when store works)** — Filter returns 401 for blacklisted tokens (`JwtAuthenticationFilter.java:58-62`).
9. **Secrets externalization** — JWT, DB, Redis via env vars in `application.properties`.
10. **Lazy module structure** — Admin/cart/checkout modules wired via `loadChildren`; production build path exists.
11. **Saved card ownership check at order time** — Validates card belongs to user (`OrderService.java:241-243`) — effective once C1 fixed.
12. **Registration blocks unverified login** — `AuthController.java:206-208`.

---

## Must-Fix Before Merge

### Merge-blocking (Critical + blocking High)

- [ ] **C1** Fix `SecurityUtils` / JWT principal user ID resolution; verify `/api/auth/me` and order create/preview E2E.
- [ ] **C2** Remove or restrict login OTP bypass (`send-login-otp` without password).
- [ ] **C3** Remove CI `test || package` fallback.
- [ ] **H1** Order detail ownership check.
- [ ] **H2** Address ownership validation on order create.
- [ ] **H3** Server-side discount eligibility validation at order commit.
- [ ] **H4** Permission guards on Event/Attribute mutators.
- [ ] **H5** Permission guards on security-policy CRUD.
- [ ] **H6-H7** Fail-closed Redis blacklist/rate-limit; fail-closed JWT blacklist check.
- [ ] **H8** OTP type enforcement across all verify/reset flows.
- [ ] **H9-H10** Complete frontend cookie auth migration; fail-closed guards.
- [ ] **H11** Remove CI `continue-on-error` on frontend build and gitleaks.
- [ ] **H12** Fix public catalog permission conflict.
- [ ] **H13** Replace `vercel.json` placeholder before deploy.

### Strongly recommended pre-deploy (Medium)

- [ ] M1-M7 Backend hardening (CORS/CSRF, coupons, IP trust, WS, debug endpoints, uploads, refresh rotation)
- [ ] M8-M9 Checkout/payment server-trust contract
- [ ] M10 CVV stripping on save-card
- [ ] M12-M13 Redis prod requirement + frontend tests in CI

---

## Test & CI Assessment

| Test | Depth | Gap |
|------|-------|-----|
| `CardMaskingUtilTest` | Moderate | No null/blank; no max-length assertion |
| `AuthServicePermissionTest` | Shallow | No unauthenticated/null key tests; no aspect/controller tests |
| `OrderServicePricingTest` | Shallow | Reflection-only; no `createOrder` integration |
| `AuthRateLimitFilterTest` | Good | Only `/login` path tested |
| `FileUploadSanitizerTest` | Partial | Path traversal only; no content-type rejection tests |
| `permission.guard.spec.ts` | Shallow | Fail-closed case only; not run in CI |

**CI reliability:** The pipeline structure is a good start (backend, frontend, gitleaks, audit) but currently **cannot be trusted as a merge gate** due to error suppression documented in C3, H11, M13.

---

## Appendix: Review Methodology

1. Read full diff stat (174 files, +3160/−1691) on branch `fix/grok-bot-fixes` @ `e06b8e04`.
2. Cross-checked every "Addressed" claim in `CODE_REVIEW_MAIN.md` against source.
3. Traced auth flow: login → cookie → JWT filter → `SecurityUtils` → `/me` → order create.
4. Traced OTP flows: registration, login, reset, cross-flow interactions.
5. Traced checkout: frontend payload → `OrderService.createOrder` → pricing/discount/address paths.
6. Reviewed CI workflow line-by-line for false-green patterns.
7. Scanned frontend for `localStorage` token usage, `innerHTML`, guard error paths, lazy module imports.

---

*Generated by independent strict review. No code fixes applied in this pass.*
