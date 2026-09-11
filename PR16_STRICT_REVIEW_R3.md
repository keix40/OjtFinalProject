# PR #16 Strict Re-Review (R3)

**PR:** [keix40/OjtFinalProject#16](https://github.com/keix40/OjtFinalProject/pull/16)  
**Branch:** `fix/grok-bot-fixes` → `main`  
**HEAD reviewed:** `23e04f055a2df1c9694f9a39b77691ef61be6c8c` ("fix(security): address PR #16 R2 High items")  
**Reviewer role:** Independent adversarial re-review (not author)  
**Date:** 2026-09-11  
**Prior reviews:** R1 Block → R2 Conditional (3 Highs open) → authors claim R2 Highs fixed in `23e04f05`

---

## Merge recommendation: **Approve-with-nits**

All three R2 **High** must-fix items are substantively **fixed** in `23e04f05`. R1 **Critical** identity and OTP gates still hold. No new Critical regressions found. Remaining gaps are **Medium/Low** (catalog route split, address IDOR on fee preview, CSRF, shallow tests, manual deploy steps). **Go for merge** after documented manual deploy checklist; track Medium items as follow-up PRs.

---

## Status table — Critical + R2 High items

| ID | Item | R3 status | Evidence |
|----|------|-----------|----------|
| **C1** | `CustomUserDetails` / `SecurityUtils.getCurrentUserId()` | **FIXED** | `UserDetailsServiceImpl.java:21-24` → `CustomUserDetails`; filter sets principal (`JwtAuthenticationFilter.java:115-118`); `SecurityUtils.java:29-30`; test `SecurityUtilsTest` |
| **C2** | Login OTP password gate (no passwordless takeover) | **FIXED** | No `send-login-otp`; OTP minted only after `authenticationManager.authenticate` with `passwordVerifiedAt` (`AuthController.java:182-194`); `verify-login-otp` rejects null `passwordVerifiedAt` (`AuthController.java:475-477`); test `LoginOtpSecurityTest` |
| **C3** | CI not greenwashing core jobs | **PARTIAL** | Blocking `mvn test`, frontend prod build, gitleaks (`ci.yml:35-36,52-53,17-20`); **still** `npm audit ... \|\| true` and Maven audit is echo-only (`ci.yml:67-69`) |
| **R2-H1** | Login-attempt read routes require `SECURITY_VIEW_ATTEMPTS` (except `is-blocked`) | **FIXED** | All GET read handlers annotated (`LoginAttemptController.java:37-137,175-177`); public only `is-blocked` (`157-173`, `SecurityConfig.java:78`); test `LoginAttemptPermissionTest` |
| **R2-H2** | Order discounts via full coupon validation (no discount-ID bypass) | **FIXED** | `applyValidatedDiscount` → `requireEligibleDiscountForOrder` (`OrderService.java:933-941`); validator enforces autoApply, dates, status, usage, VIP, product rules (`DiscountCouponService.java:167-323`); test `DiscountCouponOrderValidationTest` |
| **R2-H3** | WebSocket handshake + STOMP reject unauthenticated access | **FIXED** | Handshake rejects missing/invalid JWT (`JwtHandshakeInterceptor.java:46-48`); cookie or query token (`56-61`); STOMP SUBSCRIBE/SEND require principal (`WebSocketConfig.java:49-52`); principal from handshake (`69-74`); tests `JwtHandshakeInterceptorTest` |

---

## R2 High re-verification (detailed)

### R2-H1 — Login-attempt enumeration — **FIXED**

Commit `23e04f05` added `@RequiresPermission(SECURITY_VIEW_ATTEMPTS)` to previously open sub-routes:

- `/status/{status}`, `/threat/{level}`, `/search`, `/range`, `/filter`, `/paged`, `/session/{sessionId}`, `/security-policy`

Intentional public exception preserved:

```157:173:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/controller/LoginAttemptController.java
    @GetMapping("/is-blocked")
    public ResponseEntity<?> isBlocked(@RequestParam String ip) {
        // ... no @RequiresPermission — pre-login IP self-check
    }
```

**Test quality:** `LoginAttemptPermissionTest` uses reflection to assert every `@GetMapping` except `isBlocked` carries `SECURITY_VIEW_ATTEMPTS`. Adequate as a regression guard; not an integration test.

---

### R2-H2 — Coupon / discount-ID bypass — **FIXED**

**Before (R2):** `OrderService.findEligibleDiscount` loaded discount by ID with incomplete rules.

**After (R3):** Manual coupon path routes through centralized validator:

```933:941:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/service/OrderService.java
    private void applyValidatedDiscount(User user, UserOrder order, Long discountId, List<CartDTO> cartItems) {
        List<Long> productIds = cartItems.stream()
                .map(CartDTO::getProductId)
                .filter(Objects::nonNull)
                .toList();
        Discount discount = discountCouponService.requireEligibleDiscountForOrder(
                user.getId(), discountId, productIds);
        order.setDiscount(discount);
        order.setUserDiscountId(discountId);
    }
```

`requireEligibleDiscountForOrder` (`DiscountCouponService.java:167-187`):

1. Loads discount by ID; requires non-blank code (rejects autoApply-only promos applied by ID).
2. Builds `CouponApplyRequest` with user + cart product IDs + VIP tier.
3. Delegates to `validateCoupon` → `validateDiscountEntity`.
4. Rejects if `autoApply`, expired/inactive, already used, wrong user/VIP/product scope.
5. Cross-checks returned `discountId` matches requested ID.

**Preview path** also uses validator (`OrderService.java:507-514`).

**Residual (Medium, not blocking):** `minimumSpend` is stored on `Discount` but never enforced in `validateDiscountEntity`. Pre-existing gap; not part of R2 explicit scope (autoApply/VIP/code/dates/usage).

**Test quality:** Single Mockito test rejects autoApply discount — covers the highest-risk bypass. Missing: VIP mismatch, expired coupon, already-used, wrong product set (follow-up).

---

### R2-H3 — WebSocket auth — **FIXED**

**Handshake:** Invalid/missing token → `return false` (connection rejected):

```46:48:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/JwtHandshakeInterceptor.java
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            log.warn("[WebSocket] Rejected unauthenticated handshake from {}", httpRequest.getRemoteAddr());
            return false;
```

Token resolution prefers HttpOnly cookie, falls back to `?token=` query param (`56-61`). R2 stdout token logging removed.

**STOMP channel:** Inbound interceptor blocks SUBSCRIBE/SEND without authenticated user:

```49:52:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/WebSocketConfig.java
                if (command == StompCommand.SUBSCRIBE || command == StompCommand.SEND) {
                    if (accessor.getUser() == null) {
                        throw new AccessDeniedException("Unauthenticated WebSocket client");
```

**Principal wiring:** `DefaultHandshakeHandler.determineUser` maps JWT email from handshake attributes (`69-74`).

**Note:** `/topic/*` destinations remain broadly named, but only **authenticated** clients can connect and subscribe. `@MessageMapping("/history")` (`ReviewSocketController.java:78-81`) is protected by the SEND guard.

**Test quality:** Handshake unit tests only (reject/accept). No STOMP integration test for channel interceptor — nit.

**Residual (Low):** Query-string JWT fallback widens exfil surface vs cookie-only; acceptable for SockJS compatibility if documented.

---

## Critical re-spot-check (still hold)

### C1 — **FIXED** (unchanged from R2)

End-to-end chain verified on `23e04f05`. Order create still enforces caller identity (`OrderService.java:198-204`).

### C2 — **FIXED** (unchanged from R2)

No passwordless OTP session path found. `/resend-otp` cannot mint `passwordVerifiedAt`.

### C3 — **PARTIAL** (unchanged from R2)

Core CI jobs are honestly blocking. Dependency-audit job still always green due to `|| true`. Not a merge blocker for security code paths but should be tracked.

**Local verification:** `./mvnw test -Dspring.profiles.active=test` → **27 tests, 0 failures, 1 skipped** (BUILD SUCCESS).

---

## Medium / also-check items (not merge blockers)

| Item | R3 status | Notes |
|------|-----------|-------|
| Product admin GETs public | **STILL OPEN (Medium)** | `GET /product/getallproduct` returns non-deleted including **inactive** (`ProductRepository.java:17-18`, `ProductController.java:87-89`); `adminProductDetail`, stock endpoints ungated — intentional storefront vs admin split incomplete |
| Order debug endpoints | **FIXED** | `/order/analytics/debug` gated `ORDERS_VIEW` (`OrderController.java:889-890`) |
| Delivery-fee address IDOR | **STILL OPEN (Medium)** | `preview-delivery-fee` / `calculateFeeByDistance` require `orders.view` but **no address ownership** (`OrderController.java:79-103`, `DeliveryService.java:137-138`). Create/preview order paths **do** enforce ownership (`OrderService.java:222-226`) |
| `GET /order/getdiscount/{userId}/{code}` | **STILL OPEN (Medium)** | No `enforceSelfOrAdmin(userId)` (`OrderController.java:107-118`) |
| `/order/test/*` endpoints | **PARTIAL (Medium)** | Gated by `ORDERS_VIEW` but no self-or-admin on `{userId}` (`OrderController.java:451-469`) — customers with `orders.view` can probe others |
| Cookie / CSRF / CORS | **PARTIAL** | HttpOnly + SameSite=Lax (`AuthCookieService.java:69-74`); CSRF disabled (`SecurityConfig.java:40`); CORS credentials limited to dev origins (`97-127`); `secure` defaults false — prod env required |
| Payment client totals | **FIXED** | Server authoritative pricing via `resolveUnitPrice` (`OrderService.java:315-316,944-952`); preview API used in checkout (`checkout.component.ts:372-375,528-529`) |

---

## Regressions from `23e04f05`

**None identified at Critical/High severity.**

Changes are scoped to security fixes + targeted tests. No weakening of prior C1/C2 fixes observed.

---

## Test quality summary (R2 High fixes)

| Test | Verdict |
|------|---------|
| `LoginAttemptPermissionTest` | Good regression guard (reflection on annotations) |
| `DiscountCouponOrderValidationTest` | Minimal but covers key autoApply bypass |
| `JwtHandshakeInterceptorTest` | Good for handshake; missing STOMP channel test |
| `SecurityUtilsTest` / `LoginOtpSecurityTest` | Still shallow (mirror logic, not MVC integration) |
| `OrderServicePricingTest` | Unrelated to R2 Highs; pricing unit test only |

Recommend follow-up integration tests for coupon VIP/expiry and WebSocket STOMP denial — **nits**, not merge blockers.

---

## New findings (R3)

1. **minimumSpend not enforced at order commit (Medium)** — coupons with minimum cart value can apply below threshold (`DiscountCouponService.validateDiscountEntity` has no minimumSpend check).
2. **Delivery-fee preview IDOR persists (Medium)** — any user with `orders.view` can pass arbitrary `addressId`; differs from authors' "already owned" claim which applies to order **create**, not fee preview GETs.
3. **One Vercel deployment check failed** on `23e04f05` (other Vercel checks green) — deploy/config nit, not a code security regression.
4. **roles-permissions localStorage token paths (Low)** — dead code after cookie migration (`roles-permissions.component.ts:849-856` et al.).

No new **Critical** or **High** findings.

---

## Must-fix before merge

| Priority | Item | Severity |
|----------|------|----------|
| — | *(none — R2 High must-fix list cleared)* | — |

### Manual deploy / ops (documented in PR body — required at deploy time)

1. Rotate secrets per `SECURITY_ROTATION.md`
2. Production: `REDIS_ENABLED=true`, `app.auth.cookie.secure=true`
3. Restrict Maps key; set `GOOGLE_MAPS_API_KEY`
4. Ensure CUSTOMER role has `orders.create` / `orders.view`
5. Real payment processor when ready

### Recommended follow-up (post-merge)

| Item | Severity |
|------|----------|
| Enforce `minimumSpend` in `validateDiscountEntity` | Medium |
| Address ownership on delivery-fee preview endpoints | Medium |
| `enforceSelfOrAdmin` on `/order/getdiscount/{userId}` and `/order/test/*` | Medium |
| Split public catalog vs admin product GETs | Medium |
| Remove `npm audit \|\| true`; add Maven OWASP check | Low |
| STOMP channel integration test | Low |
| Clean roles-permissions localStorage dead paths | Low |

---

## What looks solid

- **R2 High trifecta closed** — login-attempt ACL, coupon validation centralization, WebSocket auth.
- **C1/C2 identity + OTP** — durable fixes from `44781c2d`, unchanged by `23e04f05`.
- **Server-side order pricing** — client cart prices overwritten at commit.
- **HttpOnly cookie auth** — tokens not returned in login/refresh body.
- **Order/address ownership on create** — consistent `AccessDeniedException` paths.
- **Debug endpoint gating** — analytics debug now admin-permissioned.
- **Targeted unit tests** — all pass; annotation-level regression for login-attempt ACL.

---

## Conclusion

**Go:** PR #16 is **ready to merge** from a strict security review perspective, pending manual deploy/ops steps only. R2's three High blockers are **verified fixed** in `23e04f05`. C3 remains **Partial** on dependency-audit soft-pass only — acceptable nit. Medium catalog/IDOR/CSRF items should ship in follow-up but do **not** warrant blocking this PR after the R2 High remediation.

**No-go would apply only if** R2-H1/H2/H3 were still open — they are not.

---

*Review performed on branch `fix/grok-bot-fixes` @ `23e04f05`. Doc-only branch: `cursor/pr16-strict-review-r3-45fd`.*
