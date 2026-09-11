# PR #16 Strict Re-Review (R2)

**PR:** [keix40/OjtFinalProject#16](https://github.com/keix40/OjtFinalProject/pull/16)  
**Branch:** `fix/grok-bot-fixes` → `main`  
**HEAD reviewed:** `44781c2d` ("Fix PR #16 strict review blockers (C1-C3, H1-H13)")  
**Reviewer role:** Independent adversarial re-review (not author)  
**Date:** 2026-09-11  

---

## Merge recommendation: **Conditional**

The three **Critical** auth/OTP/CI-greenwash blockers from R1 are substantively fixed. However, several items the authors mark as **High — Fixed** are only **Partial**, and at least three **High** gaps remain (**login-attempt data leak**, **coupon bypass via `discountId`**, **unauthenticated WebSocket**). Merge only after the must-fix list below.

CI on `44781c2d`: Backend tests, frontend prod build, and gitleaks all **green**; dependency-audit is soft-pass (`|| true`).

---

## Status table — prior Critical + High items

| ID | Item | R1 severity | R2 status | Notes |
|----|------|-------------|-----------|-------|
| **C1** | `SecurityUtils.getCurrentUserId()` / JWT `CustomUserDetails` chain | Critical | **FIXED** | Filter → principal → `/me` → order create verified |
| **C2** | Passwordless login OTP (`send-login-otp` / `verify-login-otp`) | Critical | **FIXED** | Public send removed; `passwordVerifiedAt` enforced; no session mint without password |
| **C3** | CI false green (`mvn test \|\| package`, continue-on-error) | Critical | **PARTIAL** | Core jobs blocking; `dependency-audit` still greenwashes |
| **H1** | Order detail ownership (`getOrderById`) | High | **FIXED** | Self-or-admin in `OrderService.getOrderById` |
| **H2** | Order/address ownership on create | High | **PARTIAL** | Create/preview enforce address; delivery-fee GETs do not |
| **H3** | Server discount eligibility | High | **PARTIAL** | Catalog pricing authoritative; `findEligibleDiscount` skips code/VIP/autoApply rules |
| **H4** | Event/Attribute mutation permissions | High | **FIXED** | `@RequiresPermission` on create/update/delete |
| **H5** | Security-policy permissions | High | **FIXED** | GET/PUT/DELETE gated; many login-attempt **reads** still open (see H3b) |
| **H6** | Redis fail-closed when enabled | High | **PARTIAL** | Blacklist/rate-limit **reads** fail-closed; blacklist **writes** fail-open |
| **H7** | OTP purpose types | High | **FIXED** | `login` / `email_verification` / `password_reset` enforced |
| **H8** | Frontend localStorage JWT removal | High | **PARTIAL** | Core auth migrated to cookies; admin `roles-permissions` still writes/reads token keys |
| **H9** | Frontend fail-closed guards | High | **FIXED** | Auth/blacklist guards deny on error; 401 clears session |
| **H10** | Public product GETs vs `products.view` | High | **PARTIAL** | Storefront intent met; admin-grade data still anonymous |
| **H11** | `vercel.json` placeholder | High | **FIXED** | SPA-only rewrites, no API placeholder |
| **H12** | Payment trusting client totals | High (also-check) | **FIXED** | Server recomputes unit prices; no payment capture on client total |
| **H13** | WebSocket auth | High (also-check) | **STILL OPEN** | Handshake always succeeds; no cookie auth; public topics |

*H3b (login-attempt read enumeration) grouped under H5 partial.*

---

## Critical re-verification

### C1 — JWT principal / `SecurityUtils.getCurrentUserId()` — **FIXED**

**Claim:** `UserDetailsServiceImpl` returns `CustomUserDetails`; filter sets it as principal.

**Verified chain:**

1. `UserDetailsServiceImpl.loadUserByUsername` returns `new CustomUserDetails(user)` (`UserDetailsServiceImpl.java:21-24`).
2. `JwtAuthenticationFilter` loads user details and sets authentication principal to that object (`JwtAuthenticationFilter.java:115-118`).
3. `SecurityUtils.getCurrentUserId()` reads `CustomUserDetails.getUser().getId()` (`SecurityUtils.java:23-30`).
4. `/api/auth/me` uses `SecurityUtils.getCurrentUserId()` and requires authentication (`AuthController.java:396-420`, `SecurityConfig.java:83`).
5. Order create enforces caller identity and overwrites `userId` for non-admins (`OrderService.java:194-200`).

Unit test: `SecurityUtilsTest.getCurrentUserId_returnsIdWhenPrincipalIsCustomUserDetails`.

**Residual (Info):** JWT authorities come from token claims, not `CustomUserDetails.getAuthorities()` (`JwtAuthenticationFilter.java:68-84`). Does not break identity resolution.

---

### C2 — Passwordless login OTP — **FIXED**

**Claim:** Public `send-login-otp` removed; OTP only after password + `passwordVerifiedAt`.

**Verified:**

- No `send-login-otp` endpoint exists in backend or frontend (grep across repo).
- Login OTP issued only after successful `authenticationManager.authenticate` when OTP required; sets `type="login"` and `passwordVerifiedAt=now()` (`AuthController.java:182-194`).
- `verify-login-otp` rejects wrong type and null `passwordVerifiedAt` (`AuthController.java:472-477`).
- `verify-otp` rejects `login` type (`AuthController.java:447-448`).
- Registration/reset flows set non-login types and clear `passwordVerifiedAt` (`AuthController.java:622-623`, `655-656`, `684-685`, `708-709`).

**Bypass hunt:** No path found to mint a session from email alone without prior correct password (or DB tampering).

**Edge (Low):** Public `/resend-otp` can refresh OTP for an existing login record without re-checking password (`AuthController.java:565-584`), but cannot create `passwordVerifiedAt` — attacker still needs the password step first. Rate-limited (`AuthRateLimitFilter.java:32`).

---

### C3 — CI false green — **PARTIAL**

**Claim:** Blocking tests/build/gitleaks; no `|| package` fallback.

**Verified fixed:**

```35:36:.github/workflows/ci.yml
      - name: Unit tests
        run: mvn -B test -Dspring.profiles.active=test
```

- No `continue-on-error` on backend/frontend/secret-scan jobs.
- Gitleaks runs as blocking job (`ci.yml:17-20`).
- GitHub check runs on `44781c2d`: Backend tests ✅, Frontend build ✅, Secret scan ✅.

**Still greenwashing:**

```63:69:.github/workflows/ci.yml
      - name: npm audit (frontend)
        ...
          npm audit --audit-level=high || true
      - name: Maven dependency check note
        run: echo "Review backend/Ecommerce/pom.xml for outdated dependencies manually or add OWASP plugin later."
```

Dependency-audit always passes even on high-severity npm findings; Maven audit is a no-op echo.

---

## High re-verification

### Order / address ownership — **PARTIAL**

| Path | Status | Evidence |
|------|--------|----------|
| Order create — user, address, card | **FIXED** | `OrderService.java:194-246` |
| Order preview — user, address | **FIXED** | `OrderService.java:444-527` |
| `getOrderById` self-or-admin | **FIXED** | `OrderService.java:847-855` |
| `getOrdersByUserId` | **FIXED** | `OrderController.java:141-146` |
| Address CRUD | **FIXED** | `AddressServiceImpl.java:29,52,84,106` |
| Delivery fee preview (`preview-delivery-fee`, `calculateFeeByDistance`) | **STILL OPEN** | Any user with `orders.view` can pass arbitrary `addressId`; no ownership check in `DeliveryService.calculateFeeByDistance` (`OrderController.java:79-103`, `DeliveryService.java:137-157`) — leaks coordinates-derived distance for other users' addresses |
| `GET /order/getdiscount/{userId}/{code}` | **STILL OPEN** | No `enforceSelfOrAdmin(userId)` (`OrderController.java:107-118`) |
| Test endpoints `/order/test/*` | **STILL OPEN** | Any authenticated user can probe other users' first-time/discount status (`OrderController.java:451-469`) |

---

### Server discount eligibility — **PARTIAL**

**Fixed:**

- Unit prices from catalog via `resolveUnitPrice`; client `CartDTO.price` overwritten (`OrderService.java:311-312`, `960-968`).
- Client `couponDiscount` / `couponName` logged only, not used for pricing (`OrderService.java:362-363`).

**Still open (High):**

`findEligibleDiscount` validates dates, prior use, and user-specific rules only — it does **not** enforce:

- `autoApply == false` (code-required coupons)
- Coupon code submission
- VIP tier / minimum-spend rules present in `DiscountCouponService.validateCoupon`

```935:957:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/service/OrderService.java
    private Discount findEligibleDiscount(User user, Long discountId) {
        Discount discount = discountRepo.findById(discountId).orElse(null);
        // ... date/status/used checks ...
        // user-rule check only — no autoApply, code, or VIP tier validation
        return discount;
    }
```

**Impact:** Authenticated user who learns a coupon's numeric `discountId` (e.g. from network traffic or admin UI) can apply it at checkout without entering the code, bypassing `autoApply=false` and VIP restrictions enforced elsewhere in `DiscountCouponService.java:176-226`.

---

### Event / Attribute / security-policy permissions — **PARTIAL**

**Fixed:**

- Event mutations: `@RequiresPermission(PRODUCTS_CREATE/UPDATE/DELETE)` (`EventController.java:35-91`).
- Attribute mutations: `@RequiresPermission(PRODUCTS_CREATE/UPDATE/DELETE)` (`AttributeController.java:71+`).
- Security-policy CRUD: `@RequiresPermission(SECURITY_VIEW/UPDATE_ATTEMPTS)` (`LoginAttemptController.java:174-193`).

**Still open (High):**

Login-attempt **read** endpoints lack `@RequiresPermission` — any authenticated user (including customers) can enumerate security telemetry:

```44:47:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/controller/LoginAttemptController.java
    @GetMapping("/status/{status}")
    public ResponseEntity<List<LoginAttemptDTO>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(loginAttemptService.getByStatus(status));
    }
```

Same pattern for `/threat/{level}`, `/search`, `/range`, `/filter`, `/paged`, `/session/{sessionId}` (`LoginAttemptController.java:50-137`). Only `GET /` (all attempts) is protected (`LoginAttemptController.java:37-38`).

Order analytics debug endpoints have **no** `@RequiresPermission`:

```890:891:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/controller/OrderController.java
    @GetMapping("/analytics/debug")
    public ResponseEntity<Map<String, Object>> debugData() {
```

```952:953:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/controller/OrderController.java
    @GetMapping("/test/vip-tier")
    public ResponseEntity<Map<String, Object>> testVipTier() {
```

---

### Redis fail-closed when enabled — **PARTIAL**

**Fixed (reads / rate limit):**

```38:46:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/security/RedisTokenBlacklistStore.java
    public boolean isBlacklisted(String token) {
        try { ... }
        catch (Exception e) {
            return true; // fail-closed
        }
    }
```

```36:38:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/RedisAuthRateLimitStore.java
        catch (Exception e) {
            return -1; // blocks request
        }
```

**Partial (writes):**

```28:35:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/security/RedisTokenBlacklistStore.java
    public void blacklist(String token, long ttlSeconds) {
        try { ... }
        catch (Exception e) {
            log.warn("Redis blacklist write failed, token may remain valid until expiry: ...");
        }
    }
```

Logout blacklist may silently fail; token remains valid until JWT expiry.

---

### OTP purpose types — **FIXED**

Entity documents intent (`OtpVerification.java:28-31`). Controller enforces per flow (`AuthController.java:447-448`, `472-477`, `708-709`). Test: `LoginOtpSecurityTest`.

---

### Frontend localStorage JWT + fail-closed guards — **PARTIAL / FIXED**

**Fixed (core path):**

- Session from HttpOnly cookie via `/me` (`auth.service.ts:75-84`).
- `saveToken` is no-op (`auth.service.ts:107-110`).
- Legacy keys cleared on logout (`auth.service.ts:153-158`).
- Auth/blacklist guards fail closed on errors (`auth.guard.service.ts`, `blacklist.guard.ts`).
- 401 interceptor clears session (`auth.interceptor.ts`).

**Partial (admin leftovers):**

`roles-permissions.component.ts` still writes/reads `jwtToken`, `token`, `accessToken` (`848-856`, `1206`, `1304`, `1381`, `1559-1560`, `1595`). Backend `refresh-token` no longer returns `accessToken` in body (`AuthController.java:380`) — dead/broken path, not an active XSS exfil vector since tokens are cookie-only.

`register.component.ts:254` calls `saveToken(response.accessToken!)` but register response is message-only — harmless no-op.

---

### Public product GETs vs `products.view` — **PARTIAL**

Authors intentionally removed `@RequiresPermission(PRODUCTS_VIEW)` from storefront GETs and added `SecurityConfig` permit-all for `GET /product/**` (`SecurityConfig.java:59-60`, commit `44781c2d` on `ProductController.java`).

**Storefront goal:** met — anonymous catalog browsing works.

**Security regression:** admin-grade endpoints remain anonymous:

| Endpoint | Risk | Evidence |
|----------|------|----------|
| `GET /product/getallproduct` | Lists all non-deleted products including **inactive** | `ProductController.java:87-89`, `ProductService.java:712-716` |
| `GET /product/adminProductDetail/{id}` | Full admin product detail | `ProductController.java:156-158` |
| `GET /product/productquantity/{id}` | Exact stock | `ProductController.java:161-164` |
| `GET /product/variantstock/{id}` | Variant stock | `ProductController.java:167-170` |

---

### `vercel.json` placeholder — **FIXED**

SPA-only rewrites; no backend URL placeholder (`frontend/Ecommerce/vercel.json`).

---

## Also-check items

### Payment trusting client totals — **FIXED**

Client sends totals (`payment.component.ts`, `UserOrderDTO.java`); server ignores client unit prices and recomputes via `resolveUnitPrice` (`OrderService.java:311-312`). No live payment processor charges client-supplied amounts.

### WebSocket auth — **STILL OPEN** (High)

```81:82:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/SecurityConfig.java
                        .requestMatchers("/ws/**", "/ws-review/**").permitAll()
```

```33:50:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/JwtHandshakeInterceptor.java
            // optional ?token= query param; invalid/missing token still connects
            return true; // Let the handshake continue
```

- No HttpOnly cookie auth on handshake.
- Token logged to stdout (`JwtHandshakeInterceptor.java:37`).
- Frontend connects without token (`notifcation.service.ts`, `review.service.ts`).
- Public STOMP topics (`/topic/activity-feed`, `/topic/dashboard-metrics`, `/topic/reviews.*`) subscribable without identity.
- `@MessageMapping("/history")` serves review history to any connected client (`ReviewSocketController.java:78-81`).

### Cookie Secure / SameSite / CSRF / CORS — **PARTIAL**

| Control | Status | Evidence |
|---------|--------|----------|
| HttpOnly cookies | **FIXED** | `AuthCookieService.java:69-74` |
| Secure flag | **PARTIAL** | Defaults `false`; env-gated (`application.properties`, `AuthCookieService.java:22-23`) |
| SameSite | **FIXED** (configurable) | Default `Lax` |
| CSRF | **STILL OPEN** | Disabled (`SecurityConfig.java:40`) — relevant with cookie sessions |
| CORS + credentials | **FIXED** (dev origins) | `SecurityConfig.java:97-102,127` |
| Bearer header fallback | **Info** | `JwtAuthenticationFilter.java:127-131` — widens token surface |

### Tests — **PARTIAL**

| Test | Assessment |
|------|------------|
| `SecurityUtilsTest` | Real behavior — **good** |
| `LoginOtpSecurityTest` | Duplicates controller logic locally; does not hit `AuthController` — **shallow** |
| `OrderServicePricingTest` | Reflection on private method only — **shallow** |
| `AuthRateLimitFilterTest` | Real filter — **good** (narrow) |
| Missing | No integration tests for IDOR, discount bypass, login-attempt ACL, WebSocket auth |

---

## New / notable findings since R1

1. **Login-attempt enumeration (High)** — Partial fix added permission to `GET /api/login-attempts` only; sub-routes remain open to any authenticated user. Not listed as fixed in commit message but is a significant data leak.
2. **Coupon `discountId` bypass (High)** — `findEligibleDiscount` added in blocker commit but incomplete vs `DiscountCouponService` — new logic introduces a false sense of security.
3. **Product permission removal regression (Medium)** — Commit `44781c2d` *removed* `@RequiresPermission` from admin GETs rather than splitting public vs admin routes.
4. **Order debug/analytics endpoints (Medium)** — `/order/analytics/debug`, `/order/test/vip-tier` lack permission annotations; accessible to any authenticated user.
5. **Delivery-fee address IDOR (Medium)** — Preview endpoints leak distance calculation for arbitrary `addressId`.
6. **roles-permissions stale token code (Low)** — Dead localStorage/JWT refresh path after cookie migration.

No new Critical regressions identified in `44781c2d`.

---

## Must-fix before merge

| Priority | Item | Severity |
|----------|------|----------|
| 1 | Add `@RequiresPermission(SECURITY_VIEW_ATTEMPTS)` to all login-attempt read endpoints | **High** |
| 2 | Align `findEligibleDiscount` with coupon validator: enforce `autoApply`, code, VIP tier, min spend; reject code-only coupons applied by ID alone | **High** |
| 3 | WebSocket: reject handshakes without valid auth; read HttpOnly cookie or short-lived WS token; protect public topics / `@MessageMapping` | **High** |
| 4 | Split product routes: public storefront GETs vs admin GETs (`getallproduct`, `adminProductDetail`, stock) gated by `products.view` | **Medium** |
| 5 | Add `enforceSelfOrAdmin` to `/order/getdiscount/{userId}/*` and delivery-fee endpoints; verify address ownership | **Medium** |
| 6 | Remove or permission-gate order debug/analytics endpoints | **Medium** |
| 7 | Remove `|| true` from npm audit; add real Maven dependency scan | **Low** |
| 8 | Clean up `roles-permissions` localStorage token references | **Low** |

---

## What looks solid

- **C1 identity chain** — End-to-end `CustomUserDetails` wiring with test coverage; order create ownership enforcement is correct.
- **C2 OTP login** — Passwordless takeover path closed; typed OTP flows with `passwordVerifiedAt` gate.
- **C3 core CI** — Blocking `mvn test`, prod frontend build, and gitleaks; no `\|\| package` fallback on test jobs.
- **Server-side catalog pricing** — Authoritative unit prices; client cart prices cannot manipulate order line items.
- **HttpOnly cookie auth migration** — Tokens removed from API responses; frontend session via `/me`; logout blacklists cookie token.
- **Auth rate limiting** — Redis/in-memory with fail-closed on Redis errors when enabled.
- **Event/Attribute/security-policy mutators** — Permission annotations present.
- **Saved card / wishlist / address IDOR fixes** — Consistent `enforceSelfOrAdmin` patterns.
- **vercel.json** — Clean SPA config.

---

## Conclusion

PR #16 has made **material progress** on the R1 Critical blockers. The authors' claim that **all Critical and High blockers are fixed is overstated** — C3 dependency audit, several High ownership/discount/catalog items, and WebSocket auth remain open or partial.

**Recommendation: Conditional merge** — acceptable after must-fix items 1–3 (High) are addressed; items 4–6 strongly recommended for the same PR or immediate follow-up.
