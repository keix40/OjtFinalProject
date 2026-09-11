# Code Review — `main` Branch

**Repository:** OjtFinalProject (Spring Boot 3.5 + Angular 19 e-commerce platform)  
**Review date:** 2026-09-11  
**Scope:** Read-only review of branch `main`  
**Reviewer:** Automated Cloud Agent review  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Methodology & Limitations](#methodology--limitations)
3. [Findings by Category](#findings-by-category)
   - [1. Code Bugs & Logic Errors](#1-code-bugs--logic-errors)
   - [2. Security Vulnerabilities & Risks](#2-security-vulnerabilities--risks)
   - [3. UI / UX Issues](#3-ui--ux-issues)
   - [4. Performance & Breaking Changes](#4-performance--breaking-changes)
4. [Repository Hygiene & Operational Gaps](#repository-hygiene--operational-gaps)
5. [Prioritized Remediation Roadmap](#prioritized-remediation-roadmap)
6. [Positive Observations](#positive-observations)

---

## Executive Summary

This is a feature-rich e-commerce monorepo (Java backend + Angular frontend) with RBAC, VIP tiers, orders, returns, reporting, WebSockets, and activity logging. **The application is not production-ready.** Authorization is effectively disabled at multiple layers, sensitive credentials are committed to the repository, and several endpoints allow unauthenticated access to PII and payment data.

**Top risks (fix before any public deployment):**

| # | Severity | Issue |
|---|----------|-------|
| 1 | **Critical** | `SecurityConfig` marks `/order/**`, `/card/**`, `/product/**`, `/api/admin/discounts/**`, `/wishlist/**`, and more as `permitAll()` — no JWT required |
| 2 | **Critical** | `AuthService.currentUserHasPermission()` always returns `true`, making `@RequiresPermission` a no-op |
| 3 | **Critical** | Admin user management lives under `/api/auth/user/**`, which is also `permitAll()` |
| 4 | **Critical** | Live secrets in `application.properties` (DB, JWT, Gmail app password) |
| 5 | **Critical** | Full credit card numbers stored and returned in plaintext (PCI-DSS violation) |
| 6 | **High** | Client-controlled order pricing — attackers can set arbitrary unit prices |
| 7 | **High** | Password reset does not validate OTP code; only checks that an unexpired OTP record exists |
| 8 | **High** | JWT + refresh tokens in `localStorage` (XSS → account takeover) |
| 9 | **High** | Production build still points at `localhost:8080`; no `environment.prod.ts` |
| 10 | **High** | No lazy-loaded routes; 4–8 MB initial bundle budget |

---

## Methodology & Limitations

### What was reviewed

- Full repository structure: `backend/Ecommerce`, `frontend/Ecommerce`, root config, docs
- Spring Security config, JWT filter, auth controllers, representative services/controllers
- Angular routing, guards, interceptors, environment config, build config
- Dependency manifests (`pom.xml`, `package.json`, `angular.json`)
- Grep/static analysis for secrets, `innerHTML`, `localhost:8080`, validation usage

### What could not be run in this environment

| Check | Result |
|-------|--------|
| `mvn test` | **Not run** — Maven not installed in review VM |
| `ng build` | **Not run** — `ng` binary permission denied |
| Dynamic penetration testing | **Not performed** — static review only |
| Dependency CVE scan (OWASP/Snyk) | **Not run** — recommend CI integration |

### Test coverage observation

Only two backend test files exist:

- `backend/Ecommerce/src/test/java/com/Ojt/Ecommerce/EcommerceApplicationTests.java`
- `backend/Ecommerce/src/test/java/com/Ojt/Ecommerce/util/PhoneNumberUtilTest.java`

No meaningful frontend unit/e2e tests were found. **Security-critical flows (auth, orders, payments) appear untested.**

---

## Findings by Category

Severity legend: **Critical** → **High** → **Medium** → **Low** → **Info**

---

### 1. Code Bugs & Logic Errors

#### CRIT-LOGIC-01 — Permission system is stubbed out

**What's wrong:** The custom permission aspect delegates to a service that always grants access.

**Why it matters:** Every `@RequiresPermission`-annotated endpoint (orders, users, blacklist, activity logs, roles) is authorized in name only.

**Where:**

```7:10:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/service/AuthService.java
    // TODO: Replace with real user context/permission logic
    public boolean currentUserHasPermission(String permissionKey) {
        // Example: always allow for now
        return true;
```

Used by `PermissionAspect.java` (~line 21).

**Fix:** Implement permission checks from `SecurityContext` JWT claims or database role-permission mappings; fail closed on missing context.

---

#### CRIT-LOGIC-02 — User admin API is anonymously reachable

**What's wrong:** `UserController` is mapped to `/api/auth/user`, which matches the global `permitAll()` rule for `/api/auth/**`.

**Why it matters:** Endpoints like `GET /api/auth/user/all`, `POST /api/auth/user/createUser`, `DELETE /api/auth/user/{id}`, and `PATCH /api/auth/user/{id}/status` require no authentication at the HTTP layer.

**Where:**

```45:45:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/controller/UserController.java
@RequestMapping("/api/auth/user")
```

```49:50:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/SecurityConfig.java
                        .requestMatchers("/api/auth/**").permitAll()  // ✅ Only write this once
```

**Fix:** Move user management to `/api/users/**` (authenticated) or remove `/api/auth/**` blanket permit and whitelist only login/register/OTP endpoints.

---

#### HIGH-LOGIC-01 — Password reset skips OTP verification

**What's wrong:** `resetPassword` checks that an OTP record exists and is not expired, but never compares `request.getOtp()` to `otpVerification.getOtpCode()` and never requires prior OTP verification.

**Why it matters:** An attacker who triggers OTP generation for a victim email can reset the password by submitting `{ email, newPassword }` while any unexpired OTP row exists — without knowing the OTP value.

**Where:**

```649:674:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/controller/AuthController.java
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        // ...
        OtpVerification otpVerification = otpVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("No OTP found for this email"));

        if ( otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new CustomException("OTP expired");
        }

        // ✅ Set new password — no OTP code check
        user.setPassword(passwordEncoder.encode(newPassword));
```

**Fix:** Require OTP in the request body, validate with constant-time comparison, mark OTP as consumed, and optionally require a separate "verified" flag set only by `/verify-reset-otp`.

---

#### HIGH-LOGIC-02 — Registration marks users verified without OTP flow

**What's wrong:** `UserServiceImpl.register()` sets `verified=true` immediately during registration.

**Why it matters:** Comment says "if OTP is verified before" but registration path does not enforce prior OTP verification in the same transaction.

**Where:**

```150:150:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/service/UserServiceImpl.java
        user.setVerified(true); // Set as verified if OTP is verified before
```

**Fix:** Set `verified=false` on register; flip to `true` only in the OTP verification endpoint.

---

#### HIGH-LOGIC-03 — Client-supplied prices used at checkout

**What's wrong:** Order line items take `unitPrice` from the client `CartDTO`, not from the database product/variant price.

**Why it matters:** Combined with public `/order/**` access, attackers can purchase items at $0.01 or negative effective prices.

**Where:**

```292:300:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/service/OrderService.java
            for (CartDTO item : dto.getCartItem()) {
                Product product = proRepo.findById(item.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found with ID: " + item.getProductId()));
                // ...
                orderProduct.setUnitPrice(item.getPrice());
```

**Fix:** Load authoritative price from `Product` / `ProductVariant`, apply discounts server-side, reject client price fields.

---

#### HIGH-LOGIC-04 — IDOR on user-scoped resources

**What's wrong:** Many endpoints accept `userId`, `cardId`, or `orderId` in the path/body without verifying the authenticated user owns that resource.

**Why it matters:** Any caller (currently unauthenticated for several routes) can read/modify another user's data.

**Examples:**

| Endpoint | File | Issue |
|----------|------|-------|
| `GET /order/getorderbyuserid/{userId}` | `OrderController.java` ~140 | List any user's orders |
| `GET /card/user/{userId}` | `SavedCardController.java` ~52 | Read any user's saved cards |
| `PUT /card/update/{cardId}` | `SavedCardController.java` | No ownership check |
| `POST /wishlist/save/{userId}/{proId}` | Wishlist controller | Modify any wishlist |
| `GET /api/addresses/showAddressList/{userId}` | Address controller | Read any addresses |
| `PUT /api/addresses/updateAddress/{id}` | `AddressServiceImpl.java` ~84 | Can reassign address to different user via `dto.userId` |

**Fix:** Derive user ID from JWT `SecurityContext`; compare to path/body IDs; return 403 on mismatch.

---

#### MED-LOGIC-01 — Profile image path inconsistency

**What's wrong:** Registration saves images under `/upload/` while updates may use `/uploads/`.

**Where:** `UserServiceImpl.java` line ~180 vs ~348.

**Fix:** Standardize on one static resource mapping and migration path.

---

#### MED-LOGIC-02 — Multi-role JWT mishandled in frontend guards

**What's wrong:** `AuthGuard` treats `decoded.roles` as a single string; comma-separated roles like `"CUSTOMER,ADMIN"` fail equality checks.

**Where:** `frontend/Ecommerce/src/app/auth/guards/auth.guard.service.ts` ~81–86.

**Fix:** Split roles consistently (the auth service already has a `getRoles()` helper — use it in the guard).

---

#### MED-LOGIC-03 — Route params ignored on profile pages

**What's wrong:** `/profile/:userId` and `/admin/profile/:id` always load the JWT user's data, ignoring the URL param.

**Where:** `user-profile.component.ts` ~105–121, `admin-profile.component.ts`.

**Fix:** Either enforce param === JWT user ID or remove misleading params from routes.

---

#### LOW-LOGIC-01 — Dead / scaffold code shipped

- `backend/.../controller/TestController.java` — TEACHER/STUDENT role demo endpoints
- `frontend/.../TestComponent` imported in `app.module.ts` but not routed
- Commented-out code blocks throughout services (e.g. `ProductService.java`)

**Fix:** Remove or gate behind dev-only profiles.

---

### 2. Security Vulnerabilities & Risks

#### CRIT-SEC-01 — Mass `permitAll()` on business-critical API paths

**What's wrong:** Spring Security allows unauthenticated access to orders, saved cards, products, admin discounts, wishlists, returns, contact messages, notifications, product reports, and more.

**Where:** `SecurityConfig.java` lines 47–84 (representative excerpt):

```65:72:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/SecurityConfig.java
                        .requestMatchers("/order/**").permitAll()
                        .requestMatchers("/card/**").permitAll()
                        .requestMatchers("/api/admin/discounts/**").permitAll()
                        .requestMatchers("/api/discounts/**").permitAll()
                        .requestMatchers("/wishlist/**").permitAll()
```

**Fix:** Default-deny; explicitly `permitAll` only for: auth login/register/OTP, public product catalog **read** endpoints (if desired), static assets, health checks.

---

#### CRIT-SEC-02 — Secrets committed to version control

**What's wrong:** Active (uncommented) `application.properties` contains live credentials.

**Where:** `backend/Ecommerce/src/main/resources/application.properties`

| Secret type | Redacted value | Lines |
|-------------|----------------|-------|
| MySQL password | `root` (user: `root`) | 33–35 |
| Spring Security user | `admin` / `admin` | 40–41 |
| JWT signing secret | `MySuper...7890` (64+ chars) | 44 |
| Gmail address | `Pyaehtoo...65@gmail.com` | 51 |
| Gmail app password | `pgiv...bfwk` (16 chars) | 52 |

**Note:** A commented block (lines 1–30) shows env-var-based config intended for Render deployment, but the active config ignores it.

**Fix:** Rotate all exposed credentials immediately; use `${ENV_VAR}` placeholders; add secret scanning to CI; consider BFG/git history purge (`bfg-1.14.0.jar` is already in the repo, suggesting prior awareness).

---

#### CRIT-SEC-03 — Plaintext PAN storage and exposure (PCI-DSS)

**What's wrong:** Full card numbers are persisted and returned in API responses.

**Where:**

```21:22:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/entity/SavedCard.java
    @Column(name = "card_number", nullable = false, length = 20)
    private String cardNumber;
```

```64:71:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/service/SavedCardService.java
        return cards.stream()
                .map(card -> new SavedCardResponseDTO(
                        // ...
                        card.getCardNumber()
                ))
```

Combined with `/card/**` being `permitAll()`.

**Fix:** Never store full PAN; use a payment processor tokenization (Stripe, etc.); if retention is required, store only last-4 + brand; encrypt at rest; mandate auth + ownership checks.

---

#### CRIT-SEC-04 — JWT and refresh tokens in `localStorage`

**What's wrong:** Access and refresh tokens are stored in browser `localStorage`, readable by any XSS payload.

**Where:**

```61:66:frontend/Ecommerce/src/app/auth/auth.service.ts
  saveToken(token: string) {
    // ...
    localStorage.setItem('token', token);
```

Also `login.component.ts` ~116–119 for refresh token.

**Fix:** HttpOnly, Secure, SameSite cookies via a BFF or backend cookie-based session; or strict CSP + token rotation with short TTL if SPA-only.

---

#### CRIT-SEC-05 — Stored XSS via `[innerHTML]`

**What's wrong:** Admin-controlled policy HTML and activity-log formatting inject unsanitized HTML.

**Where:**

- `user-policy.component.html` line 61 — public policy page
- `admin-policy.component.html` lines 113, 150
- `activity-logs.component.ts` lines 714, 738–747 — string interpolation into HTML
- `order-tracking.component.html` line 135

Example (activity logs):

```714:714:frontend/Ecommerce/src/app/activity-logs/activity-logs.component.ts
        return `<span class="font-bold">${category}</span>`;
```

**Fix:** Use Angular's `DomSanitizer` with strict allowlists, or DOMPurify; never build HTML strings from log data; render structured data with template bindings.

---

#### HIGH-SEC-01 — Authorization header logged on every request

**What's wrong:** Full Bearer token written to application logs.

**Where:**

```61:61:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/JwtAuthenticationFilter.java
        logger.info("HEADER => {}", header);
```

**Fix:** Remove or redact; log only request URI + authenticated email after validation.

---

#### HIGH-SEC-02 — Hardcoded third-party API key (IPQualityScore)

**What's wrong:** IPQS API key embedded in source.

**Where:**

```114:115:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/controller/AuthController.java
            String ipqsApiKey = "RL4UtL8bX86mxJKRY3nqYNGdlPrViZX";
            String ipqsUrl = "https://ipqualityscore.com/api/json/ip/" + ipqsApiKey + "/" + ip;
```

**Fix:** Externalize to env var; rotate key.

---

#### HIGH-SEC-03 — OTP generated with `java.util.Random`

**What's wrong:** Predictable OTP generation; 6-digit codes are brute-forceable (~10⁶ combinations) without rate limiting on verify endpoints.

**Where:** `AuthController.java` line ~177.

**Fix:** Use `SecureRandom`; add per-IP and per-email rate limits; lockout after N failures; increase OTP length or use TOTP.

---

#### HIGH-SEC-04 — Login OTP path weakens authentication

**What's wrong:** After password auth succeeds, login OTP is issued. The `/verify-login-otp` endpoint grants full session tokens based on email + OTP alone (no password re-check). OTP is also logged to stdout in dev (`System.out.println` with OTP value at line ~187).

**Why it matters:** Email compromise or OTP brute-force → full account access without password knowledge.

**Fix:** Remove OTP logging; rate-limit verification; bind OTP to session nonce; consider WebAuthn/MFA.

---

#### HIGH-SEC-05 — Client-side CAPTCHA only

**What's wrong:** Login CAPTCHA is generated and verified entirely in the browser.

**Where:** `login.component.ts` ~188–209.

**Fix:** Server-side CAPTCHA (hCaptcha, reCAPTCHA) validated on the backend.

---

#### HIGH-SEC-06 — Exposed Google Maps API key

**What's wrong:** API key hardcoded in client HTML.

**Where:**

```21:21:frontend/Ecommerce/src/index.html
  <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSy...KzLg"></script>
```

**Fix:** Restrict key by HTTP referrer/IP in Google Cloud Console; use env injection at build time.

---

#### HIGH-SEC-07 — Frontend permission checks are tamperable

**What's wrong:** `PermissionGuard` reads permissions from `localStorage`, not the signed JWT on each navigation.

**Where:**

```18:21:frontend/Ecommerce/src/app/guards/permission.guard.ts
    const required = route.data['permission'] as string;
    if (!required || this.perms.hasPermission(required)) {
      return true;
```

**Fix:** Decode permissions from JWT (or fetch from server); treat UI guard as UX-only; backend must enforce (currently doesn't — see CRIT-LOGIC-01).

---

#### HIGH-SEC-08 — Missing `PermissionGuard` on roles route

**What's wrong:** `/users/roles` has `permission` in route data but no `canActivate: [PermissionGuard]`.

**Where:** `app-routing.module.ts` line 252.

**Fix:** Add guard; audit all admin child routes.

---

#### HIGH-SEC-09 — `PermissionGuard` allows access when `permission` key omitted

**What's wrong:** Routes like `revenue-target-admin` and `admin/vip-tiers` use `PermissionGuard` but omit `permission` in `data` → guard passes all admins.

**Where:** `app-routing.module.ts` lines 257–258; `permission.guard.ts` line 20.

**Fix:** Require `permission` for all guarded routes; fail closed if missing.

---

#### MED-SEC-01 — No server-side input validation

**What's wrong:** No `spring-boot-starter-validation`; zero `@Valid` / `@NotNull` usage found.

**Fix:** Add validation dependency; annotate DTOs; return 400 with field errors.

---

#### MED-SEC-02 — Path traversal in file uploads

**What's wrong:** `getOriginalFilename()` used directly in file paths without sanitization.

**Where:** `UserServiceImpl.java` ~176–178, `FileStorageService.java` ~18–20, and 10+ other upload sites.

**Fix:** Strip path components (`Paths.get(name).getFileName()`), allowlist extensions, enforce max size, scan content, store outside web root.

---

#### MED-SEC-03 — Hardcoded Windows upload paths

**What's wrong:** `FileStorageService.java` uses `C:/Ecommerce/...` style paths — breaks on Linux containers.

**Fix:** Configurable `${app.upload.dir}` with sensible defaults.

---

#### MED-SEC-04 — Global exception handler leaks internal messages

**What's wrong:** Generic handler returns `ex.getMessage()` to clients.

**Where:**

```63:63:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/exception/GlobalExceptionHandler.java
        errorDetails.put("message", "Something went wrong: " + ex.getMessage());
```

**Fix:** Log full stack server-side; return generic message to clients.

---

#### MED-SEC-05 — In-memory JWT blacklist

**What's wrong:** `TokenBlacklistService` is process-local; tokens remain valid on other instances / after restart.

**Fix:** Redis or DB-backed blacklist with TTL matching token expiry.

---

#### MED-SEC-06 — WebSocket endpoints permitAll; handshake may proceed without valid token

**What's wrong:** `/ws/**` and `/ws-review/**` are public; JWT handshake interceptor may allow connections without authentication.

**Fix:** Require valid JWT at handshake; reject unauthenticated STOMP sessions.

---

#### MED-SEC-07 — JWT carries excessive PII

**What's wrong:** Token payload includes phone, DOB, gender, permissions — increases blast radius on leak.

**Where:** `JwtTokenProvider.java` ~60–75.

**Fix:** Keep JWT minimal (sub, roles, jti, exp); fetch profile server-side.

---

#### MED-SEC-08 — Sensitive data logged in frontend console

**What's wrong:** Tokens, decoded JWT payloads, and OTP values logged via `console.log`.

**Where:** `auth.service.ts` ~224–226, `verify-otp.component.ts` ~140, `roles-permissions.component.ts` (extensive debug block ~1627+).

**Fix:** Strip all debug logging before production builds; use build-time dead-code elimination.

---

#### MED-SEC-09 — `hibernate.ddl-auto=update` and `show-sql=true` in active config

**Where:** `application.properties` lines 37–38.

**Fix:** Use Flyway/Liquibase migrations; disable SQL logging in production.

---

#### LOW-SEC-01 — CSRF disabled

**Where:** `SecurityConfig.java` line 44.

**Info:** Acceptable for pure JWT header auth if cookies are not used. Re-evaluate if moving tokens to cookies.

---

#### LOW-SEC-02 — CORS limited to localhost

**Where:** `SecurityConfig.java` lines 105–110.

**Info:** Good for dev; production deployment origins must be added explicitly.

---

#### INFO-SEC-01 — No SQL injection found

Native queries use `@Param` binding. JPQL uses bound parameters. **Positive finding.**

---

### 3. UI / UX Issues

#### HIGH-UX-01 — Storefront requires login to browse products

**What's wrong:** Home, product list, product detail, and cart all require `AuthGuard`.

**Where:** `app-routing.module.ts` lines 199–212.

**Why it matters:** Standard e-commerce allows anonymous browsing; this hurts SEO, sharing, and conversion.

**Fix:** Make catalog routes public; guard only checkout, profile, and order history.

---

#### HIGH-UX-02 — Production deployment will fail silently for API calls

**What's wrong:** 50+ TypeScript files hardcode `http://localhost:8080`; `environment.ts` has `production: false`; no `fileReplacements` in `angular.json`.

**Where:** `frontend/Ecommerce/src/environments/environment.ts`; grep shows widespread `localhost:8080` in services/components.

**Fix:** Centralize `environment.apiUrl`; add prod environment; configure Vercel/hosting API proxy.

---

#### MED-UX-01 — Inconsistent loading/error patterns in admin UI

**What's wrong:** `lux-async-state` is used on some storefront pages but not uniformly in large admin views (e.g. 3,678-line `dashboard.component.ts`).

**Fix:** Standardize async state wrapper across admin modules.

---

#### MED-UX-02 — Login modals lack accessibility attributes

**What's wrong:** CAPTCHA and OTP modals missing `role="dialog"`, `aria-modal`, focus trap (VIP modals do have `role="dialog"`).

**Fix:** Align login modals with existing accessible modal patterns.

---

#### MED-UX-03 — Silent redirects on role mismatch

**What's wrong:** `AuthGuard` redirects without user feedback when role doesn't match.

**Where:** `auth.guard.service.ts` ~94–98.

**Fix:** Show toast/dialog explaining access denial.

---

#### MED-UX-04 — Blacklist guard fails open on API error

**What's wrong:** If blacklist check fails, guard resolves `true` (allow access).

**Where:** `app-routing.module.ts` ~176–179.

**Fix:** Fail closed or retry with cached status.

---

#### LOW-UX-01 — Empty `alt` on user-generated review images

**Where:** `user-reviews.component.html` line 36.

**Fix:** Use descriptive alt text from product/review context.

---

#### LOW-UX-02 — Duplicate blacklist checks on navigation

**What's wrong:** Both `AuthGuard` and `BlacklistGuard` call similar blacklist APIs — doubled latency.

**Fix:** Consolidate into one guard or cache result per session.

---

#### INFO-UX-01 — Positive accessibility patterns exist

- `lux-async-state` provides `role="alert"`, `aria-busy`, retry UI
- Login form labels and password toggle `aria-label`
- `prefers-reduced-motion` respected in some storefront CSS
- `trackBy` used in several admin lists

---

### 4. Performance & Breaking Changes

#### HIGH-PERF-01 — No lazy-loaded Angular modules

**What's wrong:** All ~50+ components imported eagerly in `app.module.ts`; zero `loadChildren` routes.

**Why it matters:** Initial bundle includes admin dashboards, Chart.js, Quill, Leaflet, DataTables, XLSX, jsPDF for every visitor.

**Fix:** Split into `StorefrontModule`, `AdminModule`, `AuthModule` with lazy routes.

---

#### HIGH-PERF-02 — Permissive bundle budgets (4 MB warn / 8 MB error)

**Where:** `angular.json` lines 61–71; default build configuration is `production`.

**Fix:** Target < 500 KB initial JS (gzipped) for storefront; lazy-load admin/heavy libs.

---

#### HIGH-PERF-03 — N+1 queries on order list endpoints

**What's wrong:** `getAllOrders()` and `getOrdersByUserId()` call `findAll()` / `findByUserId()` without `@EntityGraph`, then `convertToDTO()` touches lazy collections.

**Where:**

```530:538:backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/service/OrderService.java
    public List<UserOrderListDTO> getAllOrders() {
        List<UserOrder> orders = repo.findAll();
        return orders.stream()
                .map(this::convertToDTO)
```

Contrast: `OrderRepository.findByIdWithEntity` already uses `@EntityGraph` for single-order fetch.

**Fix:** Add `@EntityGraph` or DTO projections to list queries; paginate.

---

#### HIGH-PERF-04 — N+1 in customer summary aggregation

**What's wrong:** `UserServiceImpl.getAllCustomerSummaries()` iterates users → orders → products in nested loops.

**Fix:** Single aggregated SQL/JPQL query or batch fetching (`@BatchSize`).

---

#### HIGH-PERF-05 — Login attempts service loads all records into memory

**What's wrong:** Multiple `repository.findAll()` calls with in-memory filtering.

**Where:** `LoginAttemptServiceImpl.java`.

**Fix:** Query with indexed filters (IP, email, time window).

---

#### MED-PERF-01 — Duplicate CDN + npm assets

**What's wrong:** Bootstrap, Font Awesome, Leaflet loaded from both `index.html` CDN and `angular.json` bundles.

**Fix:** Choose one source; prefer npm with tree-shaking.

---

#### MED-PERF-02 — Global jQuery + DataTables in main bundle

**Where:** `angular.json` scripts array lines 52–57.

**Fix:** Lazy-load only on pages that use DataTables.

---

#### MED-PERF-03 — Heavy libraries statically imported in large components

| Library | Component | Lines |
|---------|-----------|-------|
| Chart.js (all registerables) | `dashboard.component.ts` | 3,678 |
| XLSX + jsPDF | `customers.component.ts` | — |
| Leaflet | `checkout.component.ts` | — |

**Fix:** Dynamic `import()` (already used in `order-management` for jsPDF — extend pattern).

---

#### MED-PERF-04 — Default change detection on mega-components

**What's wrong:** Only VIP customers and blacklist use `OnPush`; dashboard and product detail use default CD.

**Fix:** Adopt `OnPush` + immutable data patterns on hot paths.

---

#### MED-PERF-05 — Dev JWT interceptor fetches external IP on every HTTP call

**Where:** `jwt.interceptors.service.ts` ~46–60.

**Fix:** Cache IP for session duration.

---

#### LOW-PERF-01 — Dead dependencies

- `exceljs` in frontend `package.json` — unused in `src/`
- Root `package.json` has `ngx-quill` but main app is under `frontend/Ecommerce/`
- `spring-boot-devtools` as runtime dependency in backend `pom.xml`

---

#### LOW-PERF-02 — EAGER fetching on User.role

**What's wrong:** EAGER role + permissions loaded on every user fetch.

**Fix:** LAZY + `@EntityGraph` where needed.

---

## Repository Hygiene & Operational Gaps

| Item | Severity | Detail |
|------|----------|--------|
| No CI/CD workflows | **High** | No `.github/workflows` in project root — only inside `node_modules` |
| Minimal automated tests | **High** | 2 backend test files; no frontend tests |
| `node_modules/` at repo root | **Medium** | `.gitignore` only excludes `/frontend/node_modules/`, not root |
| `bfg-1.14.0.jar` (14 MB) | **Low** | Git history cleaning tool committed to repo |
| `sbasetosql_original.sql` (499 KB) | **Info** | Large SQL dump — verify no production data |
| No PR template | **Info** | None found |
| Maven not in PATH / ng permission issue | **Info** | Build verification blocked in review environment |

---

## Prioritized Remediation Roadmap

### P0 — Block deployment (days, not weeks of engineering focus)

1. Rotate **all** secrets in `application.properties`; move to environment variables; purge from git history.
2. Remove blanket `permitAll()` from `/order/**`, `/card/**`, `/wishlist/**`, `/api/admin/**`, and relocate `/api/auth/user/**`.
3. Implement real `currentUserHasPermission()` and resource ownership checks.
4. Stop storing/returning full PAN; engage payment processor tokenization.
5. Server-side price validation in `OrderService.createOrder()`.
6. Fix password reset OTP validation.
7. Move JWT to HttpOnly cookies or enforce strict CSP + short-lived tokens.

### P1 — High priority (next sprint)

8. Sanitize all `[innerHTML]` usage; remove HTML string building in activity logs.
9. Add `environment.prod.ts` and replace all hardcoded `localhost:8080`.
10. Add `PermissionGuard` to `/users/roles`; add `permission` keys to all admin routes.
11. Remove token/OTP console logging (frontend and backend).
12. Add rate limiting on auth/OTP endpoints.
13. Sanitize file uploads; configurable upload directory.

### P2 — Medium priority

14. Introduce lazy-loaded Angular feature modules.
15. Fix N+1 queries with `@EntityGraph` / projections + pagination.
16. Add `spring-boot-starter-validation` and DTO constraints.
17. Redis-backed JWT blacklist.
18. Make product browsing public; improve admin error/loading UX.
19. Add CI pipeline (build, test, secret scan, dependency audit).

### P3 — Lower priority / cleanup

20. Remove dead code (`TestController`, `TestComponent`).
21. Deduplicate CDN/npm assets and HTTP interceptors.
22. Adopt `OnPush` change detection on large components.
23. Add meaningful integration tests for auth, checkout, and permissions.

---

## Positive Observations

- **Layered architecture** is clear: Controller → Service → Repository with DTOs and MapStruct/ModelMapper.
- **Activity logging system** is documented (`ACTIVITY_LOGGING_SYSTEM.md`) and integrated via AOP — good audit foundation once auth is fixed.
- **CORS** uses explicit origin patterns (not wildcard) with credentials — correct pattern for SPA.
- **JWT implementation** uses HS512 with `Keys.hmacShaKeyFor` and includes blacklist checking in the filter.
- **Parameterized SQL** in native queries — no string-concatenated SQL injection found.
- **Shared UX component** (`lux-async-state`) demonstrates thoughtful loading/error/accessibility patterns where used.
- **IP ban filter** and login attempt tracking show security awareness (undermined by permitAll and stub permissions).
- **Commented env-var config** in `application.properties` shows the team knows the correct deployment pattern — it needs to be activated.

---

## Appendix: Files Most Relevant to Remediation

| Area | Primary files |
|------|---------------|
| Security config | `backend/Ecommerce/src/main/java/com/Ojt/Ecommerce/config/SecurityConfig.java` |
| Auth / OTP | `backend/Ecommerce/.../controller/AuthController.java` |
| Permissions | `backend/Ecommerce/.../service/AuthService.java`, `.../aspect/PermissionAspect.java` |
| Orders / pricing | `backend/Ecommerce/.../service/OrderService.java` |
| Saved cards | `backend/Ecommerce/.../service/SavedCardService.java`, `.../entity/SavedCard.java` |
| Secrets | `backend/Ecommerce/src/main/resources/application.properties` |
| Frontend auth | `frontend/Ecommerce/src/app/auth/auth.service.ts`, `.../guards/*.ts` |
| Frontend routing | `frontend/Ecommerce/src/app/app-routing.module.ts` |
| Environment | `frontend/Ecommerce/src/environments/environment.ts`, `angular.json` |
| XSS surfaces | `activity-logs.component.ts`, `user-policy.component.html`, `admin-policy.component.html` |

---

*End of report.*
