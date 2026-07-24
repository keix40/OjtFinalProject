# Britium Gallery — Luxury Redesign & Architecture Blueprint

> **Document type:** Production-ready system architecture + UI/UX design specification + migration roadmap
> **Target application:** `OjtFinalProject` (branded *Britium Gallery*)
> **Stack (as-built):** Angular 19 (NgModule-based) frontend · Spring Boot / Java backend (`com.Ojt.Ecommerce`) · JWT auth · JasperReports · STOMP WebSockets
> **Goal:** Modernize the UI to a high-end luxury fashion/lifestyle aesthetic, refactor the logic/data-flow layer for integrity, and fix known bugs (pagination state, cross-page checkbox selection) — with a zero-data-loss, step-by-step migration.

---

## 0. Current-State Audit (What we are migrating from)

This blueprint is grounded in a direct read of your codebase. The findings below are the "before" picture; every recommendation later maps back to one of these.

### 0.1 Architecture as-built

| Layer | Reality today |
|---|---|
| Frontend | Angular 19, **NgModule-based** (`app.module.ts`), all components `standalone: false`. ~90 routes in a single `app-routing.module.ts` (1 file, ~280 lines). |
| Styling | **Three UI frameworks stacked simultaneously**: Bootstrap 5 (CDN + npm), Angular Material 19, and TailwindCSS. Plus jQuery + DataTables, SweetAlert2, ngx-toastr, Font Awesome, Bootstrap Icons, Lucide, Material Icons. |
| Backend | Spring Boot, package `com.Ojt.Ecommerce`, layered `controller` → `service` → `repository` → `entity`, DTOs, JWT `SecurityConfig`, `@RequiresPermission` annotation, JasperReports (`.jrxml`) for CSV/PDF export, STOMP `DashboardBroadcastService`. |
| Auth | JWT `accessToken` + `refreshToken` stored in `localStorage`. Permissions decoded from token, stored in both `PermissionService` **and** `localStorage`. Role redirect: `CUSTOMER → /home`, else `→ /dashboard`. OTP, CAPTCHA, forgot-password, blacklist, IP-ban flows. |
| Portals | Customer portal (public-ish routes) and Admin portal (under `LayoutComponent` shell) share **one Angular app and one route table**. |

### 0.2 Confirmed defects (root-caused, not guessed)

**BUG-1 — Dual pagination engines fight each other.**
In `product-mangement.component.ts`, the component paginates *manually* (`paginatedProducts`, `updatePaginatedProducts()`, `filteredProducts.slice(...)`) **and simultaneously** boots jQuery DataTables on the same table:

```184:204:frontend/Ecommerce/src/app/product-mangement/product-mangement.component.ts
  loadProduct() {
    this.productService.getAllProduct().subscribe({
      next: (data) => {
        this.products = data.map(p => ({ ...p, checked: false }));
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.updatePaginatedProducts();
        setTimeout(() => {
          $('#productTable').DataTable({
            destroy: true,
            columnDefs: [
              { orderable: false, targets: 0 }
            ]
          });
```

DataTables re-paginates and re-sorts the rows Angular *already* sliced, so page counts, ordering, and the "showing X–Y of Z" label desynchronize. This is the core "pagination state persistence" bug.

**BUG-2 — Checkbox selection does not survive page changes.**
Selection is derived from the *current visible page only*:

```371:383:frontend/Ecommerce/src/app/product-mangement/product-mangement.component.ts
  get selectedProducts(): any[] {
    return this.paginatedProducts.filter(p => p.checked);
  }

  toggleAllCheckboxes(): void {
    this.paginatedProducts.forEach(p => p.checked = this.selectAll);
  }

  updateSelection(): void {
    const total = this.paginatedProducts.length;
    const selected = this.paginatedProducts.filter(p => p.checked).length;
    this.selectAll = total === selected;
  }
```

Check items on page 1 → go to page 2 → bulk *Delete/Export* only sees page 2. "Select all" only selects the visible page. This is the "checkbox multi-page management" bug.

**BUG-3 — View state mutated onto data models.**
`checked` is spliced onto every product entity (`data.map(p => ({ ...p, checked: false }))`). UI state and domain data are entangled, which is exactly the "corrupted/wrong data structure" risk called out in the goals — selection flags can leak into payloads and re-renders reset user intent.

**BUG-4 — No single source of design truth.** `src/styles.css` declares the **`:root` block six times**, each redefining `--primary-color` to a *different* value (`#2563eb`, `#2a2a2a`, …), and sets the global font three ways (`Poppins`, then `Inter`, then `Roboto`). Whatever loads last silently wins.

**BUG-5 — Tailwind version conflict.** Root `package.json` pins `tailwindcss ^4.1.11`; `frontend/Ecommerce` devDependencies pin `tailwindcss ^3.4.17` with a v4 PostCSS plugin. v3 and v4 have incompatible config models.

**BUG-6 — Security/state smells.** JWTs in `localStorage` (XSS-exfiltratable); permissions duplicated across `localStorage` + service (drift risk); leftover `console.log` in `BlacklistGuard`; guards do network calls with a fail-*open* default.

### 0.3 Design language today
Tech-SaaS blue (`#2563eb`), dense Bootstrap cards, Poppins/Inter/Roboto mixed, SweetAlert modals with blue confirm buttons. Functional, but reads "admin tool," not "luxury house."

---

# PILLAR 1 — Luxury UI/UX Design System & Brand Identity

The design system is delivered as **CSS custom properties (design tokens)** in a single source file, consumed by Tailwind theme extension and component styles. One token layer, zero hard-coded hex values in components.

## 1.1 Brand principles
1. **Restraint over decoration.** Generous negative space, few accents, no gradients-for-gradients'-sake.
2. **Editorial, not dashboard.** Large imagery, asymmetric hero layouts, typographic hierarchy that feels like a lookbook.
3. **Materiality.** Matte surfaces, hairline borders, soft (not neon) shadows, one champagne-gold accent used *sparingly*.
4. **Human-centric.** Warm ivory/cream neutrals rather than cold grey; photography of people and objects, not icons and charts, on customer surfaces.
5. **Motion is a whisper.** 200–400ms ease transitions; nothing bounces, nothing pulses on the luxury surfaces.

## 1.2 Color palette (tokens)

Create `frontend/Ecommerce/src/app/theme/_tokens.css` (single source of truth; replaces the six competing `:root` blocks).

```css
:root {
  /* --- Core neutrals (warm, human) --- */
  --lux-ink:        #1C1B19;  /* deep charcoal — primary text & headings */
  --lux-espresso:   #2B2925;  /* near-black surfaces (admin nav, footer) */
  --lux-graphite:   #4A463F;  /* secondary text */
  --lux-stone:      #8C857A;  /* muted/placeholder text */
  --lux-fog:        #D9D3C7;  /* hairline borders, dividers */
  --lux-ivory:      #F7F3EC;  /* app background */
  --lux-cream:      #FBF9F4;  /* card / raised surface */
  --lux-porcelain:  #FFFFFF;  /* pure white for imagery frames */

  /* --- Accent: champagne gold (use sparingly) --- */
  --lux-champagne:      #C6A667;  /* primary accent */
  --lux-champagne-deep: #A9884A;  /* accent hover / pressed */
  --lux-champagne-soft: #E8DCC2;  /* accent tint backgrounds */

  /* --- Semantic (muted, not neon) --- */
  --lux-success: #5F7355;  /* sage */
  --lux-warning: #B08234;  /* amber-brass */
  --lux-danger:  #9E4A43;  /* oxblood */
  --lux-info:    #4A5A66;  /* slate */

  /* --- Elevation (soft, warm-tinted) --- */
  --lux-shadow-xs: 0 1px 2px rgba(28,27,25,.04);
  --lux-shadow-sm: 0 2px 8px rgba(28,27,25,.06);
  --lux-shadow-md: 0 8px 24px rgba(28,27,25,.08);
  --lux-shadow-lg: 0 20px 48px rgba(28,27,25,.10);

  /* --- Geometry --- */
  --lux-radius-sm: 2px;   /* luxury = crisp; small radii */
  --lux-radius-md: 4px;
  --lux-radius-lg: 8px;
  --lux-border-hair: 1px solid var(--lux-fog);

  /* --- Motion --- */
  --lux-ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --lux-dur-fast: 180ms;
  --lux-dur:      280ms;
  --lux-dur-slow: 420ms;

  /* --- Type scale --- */
  --lux-font-serif: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  --lux-font-sans:  'Inter', 'Montserrat', system-ui, sans-serif;
}

/* Optional dark editorial mode for hero/campaign sections */
[data-lux-theme="noir"] {
  --lux-ivory: #17150F; --lux-cream: #1F1C15;
  --lux-ink: #F7F3EC;   --lux-graphite: #C9C2B4; --lux-fog: #3A362D;
}
```

**Usage rule:** charcoal/ivory carry ~95% of the UI. Champagne gold appears only on: primary CTA, active nav indicator, focus ring, price/selected-state, and thin section rules. Never fill large areas with gold.

## 1.3 Typography

Load in `index.html` (replace the current Poppins/Roboto/Inter triple-load):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

Pairing: **Cormorant Garamond** (display serif, headings) + **Inter** (body/UI). Montserrat / Playfair Display are approved alternates.

| Token | Font | Size / Line | Tracking | Use |
|---|---|---|---|---|
| `display` | Cormorant 500 | 56–72px / 1.05 | -0.01em | Hero, campaign titles |
| `h1` | Cormorant 500 | 40px / 1.15 | 0 | Page titles |
| `h2` | Cormorant 500 | 30px / 1.2 | 0 | Section titles |
| `h3` | Cormorant 600 | 22px / 1.3 | 0 | Card/product names |
| `overline` | Inter 500 | 12px / 1.4 | **0.18em, UPPERCASE** | Eyebrow labels, categories |
| `body` | Inter 400 | 16px / 1.6 | 0 | Paragraphs |
| `body-sm` | Inter 400 | 14px / 1.55 | 0 | Meta, captions |
| `ui` | Inter 500 | 14px / 1 | 0.02em | Buttons, nav, table headers |
| `data` | Inter 400 tabular-nums | 14px | 0 | Prices, table cells |

**Rule:** serif for *editorial* voice (headings, prices in showcase), sans for *functional* voice (forms, tables, admin). Admin data grids stay Inter-only for legibility; the serif is the customer-facing signature.

## 1.4 Component language

**Buttons**
- *Primary:* charcoal fill `--lux-ink`, ivory text, 1px transparent border; hover → champagne-deep fill, 280ms. Radius `--lux-radius-sm`. Uppercase `ui` token, letterspaced.
- *Secondary (ghost):* transparent fill, `--lux-ink` hairline border; hover → `--lux-ink` fill / ivory text.
- *Accent:* champagne fill for the single most important CTA per view (e.g., *Add to Bag*, *Checkout*).
- Kill SweetAlert's blue `confirmButtonColor: '#3085d6'` everywhere → `var(--lux-ink)` / `var(--lux-danger)` for destructive. Centralize via a `LuxDialogService` wrapper (see §2 & §3).

**Cards (product / editorial)**
- Surface `--lux-cream`, `--lux-border-hair`, `--lux-shadow-sm`; hover lifts to `--lux-shadow-md` + image zoom `scale(1.03)` (overflow hidden), 420ms `--lux-ease`.
- Image-first: 3:4 portrait imagery for products, 16:9 for campaigns. Text block below with `overline` category, `h3` serif name, `data` price.
- No inner borders between meta rows — use whitespace.

**Glassmorphism (used only on overlays over imagery):** `background: rgba(251,249,244,.72); backdrop-filter: blur(16px) saturate(120%); border: 1px solid rgba(255,255,255,.4);`. Reserved for sticky "Add to Bag" bars, nav-over-hero, and cart drawer header — **never** on data-dense admin tables (matte only there).

**Inputs / forms**
- Underline or hairline-box style, `--lux-cream` fill, label in `overline` above field. Focus → champagne 1px ring (`box-shadow: 0 0 0 2px var(--lux-champagne-soft)` + border `--lux-champagne`). No blue focus glows.

**Micro-interactions**
- Links: animated underline that grows from left (`background-size` transition).
- Nav active state: 1px champagne underline, not a filled pill.
- Page/section entrance: fade + 12px rise, 420ms, `IntersectionObserver`-driven (replace the current always-on `pulse-soft`/`bounce-gentle` keyframes on luxury surfaces).
- Reduced motion: honor `@media (prefers-reduced-motion: reduce)` → disable transforms.

**Imagery / editorial layout guidelines**
- Grid: 12-col, 96–120px max gutter on desktop, wide margins (content max-width ~1360px, but heroes go full-bleed).
- Product grid: 2 cols mobile / 3 tablet / 4 desktop, portrait cards, generous 32–40px row gap.
- Alternating asymmetric "editorial rows": image 7 cols / copy 5 cols, then flipped — like a magazine spread.
- Duotone/monochrome hover treatment optional on category tiles; always keep one focal product in full color.

## 1.5 Iconography & motion cleanup
Standardize on **Lucide** (already present) for a thin, elegant line set; retire Font Awesome + Bootstrap Icons + Material Icons from customer surfaces to cut weight and visual noise. Stroke width 1.5, size 20px default.

---

# PILLAR 2 — Logic Structure & Data-Flow Refactoring

## 2.1 Target architecture (modular, scalable)

**Frontend — feature-module + core/shared split.** Convert the flat `src/app` into bounded contexts. You do *not* need to rewrite to standalone components immediately; first impose module boundaries and lazy loading.

```
src/app/
├── core/                      # singletons, provided once
│   ├── auth/                  # AuthService, token store, guards, interceptors
│   ├── http/                  # ApiService, error + auth interceptors
│   ├── state/                 # selection store, pagination store (see 2.4/2.5)
│   └── config/                # environment, API base, feature flags
├── shared/                    # dumb, reusable UI (design-system components)
│   ├── ui/                    # LuxButton, LuxCard, LuxTable, LuxPaginator...
│   ├── directives/ pipes/
│   └── dialog/                # LuxDialogService (wraps SweetAlert once)
├── theme/                     # _tokens.css, _typography.css, _components.css
├── portals/
│   ├── storefront/            # customer feature modules (lazy)
│   │   ├── home/ catalog/ product/ cart/ checkout/ account/
│   └── admin/                 # admin feature modules (lazy, under LayoutComponent)
│       ├── dashboard/ catalog-admin/ orders/ users/ discounts/ security/
└── app-routing.module.ts      # thin: delegates to portal route modules
```

Split the 280-line route file into `storefront-routing.module.ts` and `admin-routing.module.ts`, each `loadChildren`-lazy-loaded. This shrinks the initial bundle (admin code never ships to customers) and enforces the **portal separation** the brief requires.

**Backend — keep the clean layered structure, harden the seams.** The existing `controller/service/repository/entity/dto` layering is sound. Reinforce:
- **DTO-only at the boundary.** Controllers never return JPA entities directly (prevents lazy-load serialization corruption + over-exposure). You already have DTOs — make it a rule with MapStruct or explicit mappers.
- **Transaction boundaries in the service layer** (`@Transactional`) — never in controllers or repositories.
- **A uniform response envelope** (`ApiResponse<T>` already exists) and **`PagedResponse<T>`** (already exists) for every list endpoint.

## 2.2 Data-flow integrity contract

**Principle: the server is the source of truth; the client holds derived, disposable view state.**

1. **Never mutate domain objects for UI state.** Fixes BUG-3. Product/order/user objects returned by services are treated as immutable. Selection, `checked`, expansion, edit-buffers live in a *separate* view-state structure keyed by entity id.
2. **Server-side pagination + filtering for all admin grids.** The client sends `{ page, size, sort, filters }`; the server returns `PagedResponse<T>`. The client never `.slice()`s a full dataset for display. Fixes the root of BUG-1 and removes the "load all rows then DataTables re-paginate" anti-pattern.
3. **Optimistic UI only with rollback.** Mutations (delete, status change) update the server first; on error, `LuxDialogService` surfaces the failure and the grid reloads the affected page. No silent local edits.
4. **Idempotent, validated writes.** Every write DTO validated with `jakarta.validation` (`@NotNull`, `@Size`, `@Positive` for prices/quantities). Reject partials with `400` + field-level messages rendered under inputs.
5. **Money is integer minor units or `BigDecimal`** on the server, never JS `number` arithmetic on the client (you already centralize with `PriceFormatService` — keep formatting client-side, keep *math* server-side).
6. **PostgreSQL / SSMS compatibility:** target JPA/Hibernate with dialect-agnostic mappings. Avoid DB-specific SQL in `@Query`; use JPQL or Spring Data derived queries. For pagination use `Pageable` (works identically on Postgres `LIMIT/OFFSET` and SQL Server `OFFSET/FETCH`). Use `TIMESTAMP`/`TIMESTAMPTZ` ↔ `datetime2` via `Instant`. Wrap multi-write operations in a single `@Transactional` unit so a mid-batch failure rolls back cleanly (fixes the bulk-delete `Promise.all` partial-failure risk in `deleteSelectedProducts`).

## 2.3 Session & auth hardening

| Concern | Today | Target |
|---|---|---|
| Token storage | `localStorage` (XSS-readable) | Access token in memory (service field); refresh token in **HttpOnly Secure SameSite cookie**. If cookie infra is out of scope, at minimum isolate token access behind a `TokenStore` and add short access-token TTL + silent refresh. |
| Permissions | Duplicated in `localStorage` + `PermissionService` | Single `PermissionService` (signal-based) hydrated from the decoded token on load; `localStorage` only as a boot cache, re-validated against `/me`. |
| Refresh | Manual | `HttpInterceptor` that catches `401`, calls refresh once, retries queued requests, else routes to `/login`. |
| Guards | Fail-*open* (`resolve(true)` on error), `console.log`s left in | Fail-*closed* for auth; strip debug logs; `BlacklistGuard` reads a single source, not scattered `localStorage` keys. |
| CSRF | n/a with localStorage bearer | If moving to cookies, add Spring `CookieCsrfTokenRepository` + `X-XSRF-TOKEN`. |

## 2.4 The Pagination Store (fixes BUG-1)

A reusable, URL-synced pagination state so page/size/sort/filter **persist** across navigation, refresh, and back-button. Delete all jQuery DataTables usage on admin grids.

```typescript
// core/state/grid-state.ts
export interface GridQuery {
  page: number;        // 0-based to match Spring Pageable
  size: number;
  sort?: string;       // e.g. "createDate,desc"
  search?: string;
  filters?: Record<string, string | number | null>;
}

export interface GridState<T> extends GridQuery {
  items: T[];
  totalElements: number;
  totalPages: number;
  loading: boolean;
}
```

- State is written to the URL query params (`?page=2&size=10&sort=name,asc&search=silk`). On reload or shared link, the grid restores exactly. This *is* pagination-state persistence.
- One `LuxPaginator` component renders "Showing X–Y of Z" from `PagedResponse`, never from a client slice.

## 2.5 The Selection Store (fixes BUG-2 & BUG-3)

Selection persists across pages because it lives outside the row data, keyed by id.

```typescript
// core/state/selection-store.ts
import { Injectable, signal, computed } from '@angular/core';

@Injectable()   // provided per-grid, not root
export class SelectionStore<ID = number> {
  private readonly _selected = signal<Set<ID>>(new Set());
  readonly count = computed(() => this._selected().size);

  isSelected = (id: ID) => this._selected().has(id);
  ids = () => Array.from(this._selected());

  toggle(id: ID, on: boolean) {
    const next = new Set(this._selected());
    on ? next.add(id) : next.delete(id);
    this._selected.set(next);
  }
  /** "select all on this page" adds only the visible ids, keeping prior pages */
  setPage(pageIds: ID[], on: boolean) {
    const next = new Set(this._selected());
    for (const id of pageIds) on ? next.add(id) : next.delete(id);
    this._selected.set(next);
  }
  isPageAllSelected = (pageIds: ID[]) =>
    pageIds.length > 0 && pageIds.every(id => this._selected().has(id));
  clear() { this._selected.set(new Set()); }
}
```

Template binds `[checked]="sel.isSelected(row.id)"` `(change)="sel.toggle(row.id, $event.target.checked)"`. Bulk actions read `sel.ids()` — which now spans **every** page the user touched. A "N items selected across pages" chip with a *Clear* action makes the persistence visible and safe.

## 2.6 Structured error handling

- **Backend:** `@RestControllerAdvice` `GlobalExceptionHandler` mapping domain exceptions → typed HTTP codes + `ApiResponse` with `code`, `message`, `fieldErrors[]`. No stack traces to the client.
- **Frontend:** one `ErrorInterceptor` → normalizes errors → `LuxDialogService` (toast for transient, modal for blocking). Replaces the ~30 duplicated `Swal.fire({icon:'error'...})` blocks with one styled channel.
- **Forms:** field-level messages under inputs (pattern already used in `login.component.ts`), standardized via a `LuxFieldErrorComponent`.
- **Logging:** remove `console.log` debug noise (e.g., `BlacklistGuard`); route real diagnostics through an `AppLogger` gated by environment.

## 2.7 Known-bottleneck remediation checklist

| ID | Bottleneck | Fix |
|---|---|---|
| BUG-1 | DataTables vs manual pagination | Remove `$('#...').DataTable()`; adopt server-side `GridState` + `LuxPaginator`. |
| BUG-2 | Cross-page selection lost | `SelectionStore` keyed by id. |
| BUG-3 | `checked` mutated on entities | Selection lives in store; entities immutable. |
| BUG-4 | 6 conflicting `:root` blocks | Single `theme/_tokens.css`. |
| BUG-5 | Tailwind v3/v4 mismatch | Pin one version (recommend Tailwind v4 + `@tailwindcss/postcss`) repo-wide; align `tailwind.config`. |
| BUG-6 | Tokens in localStorage, fail-open guards | `TokenStore`, refresh interceptor, fail-closed guards, cookie option. |
| — | Bulk delete partial failure (`Promise.all`) | Single transactional batch endpoint `DELETE /products?ids=...`. |
| — | `setTimeout(...100)` icon/DOM hacks | Angular lifecycle + `AfterViewInit`/signals; drop jQuery DOM pokes. |

---

# PILLAR 3 — Component & Page Specification

All pages consume the Pillar 1 tokens and the Pillar 2 shared UI kit. Below, each spec lists layout, states, and the data contract.

## 3.1 Unified authentication flow

**Shared `AuthShellComponent`** — a split-screen luxury layout used by Login, Register, Verify-OTP, Forgot/Reset:
- **Left (60%):** full-bleed editorial campaign image (portrait model / product still-life), subtle dark scrim, `display` serif brand line "Britium Gallery" + `overline` tagline. `noir` theme.
- **Right (40%):** `--lux-cream` panel, generous padding, centered form, hairline divider, single champagne primary CTA.
- Responsive: image collapses to a top 30vh band on mobile.

**Login** (`portals/.../auth/login`) — keep the existing robust logic (OTP-required, CAPTCHA, blacklist, forgot-password), restyle only. Replace the math-CAPTCHA modal + SweetAlerts with `LuxDialogService` modals. **Role-based routing (unchanged logic, formalized):**

```133:139:frontend/Ecommerce/src/app/auth/login/login.component.ts
      const roles = decoded?.roles ? decoded.roles.split(',') : [];
      if (roles.includes('CUSTOMER')) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/dashboard']);
      }
```
→ Centralize into `AuthService.redirectForRoles(roles)` returning `/home` (Customer Portal) vs `/dashboard` (Admin Dashboard), so every entry point (login, reset auto-login, guard) uses one rule.

**Register / Verify-OTP / Reset** — same shell; multi-step with a slim champagne progress rule; inline validation; success states route through the centralized redirect.

**States for all auth screens:** idle, submitting (button spinner, disabled), field-error, server-error (inline banner), locked/blacklisted (routes to themed blocked page), success.

## 3.2 Data grids & tables (`LuxTable` + `LuxPaginator`)

A single reusable admin table component replaces per-component tables and all DataTables usage. Used by: Products, Customers, Admins, Orders, Returns, Discounts, Delivery, Activity Logs, Login Attempts, Blacklist.

**Anatomy**
- **Toolbar:** title (`h2` serif), search (debounced 300ms → `GridState.search`), filter chips, right-aligned bulk-action bar that appears only when `SelectionStore.count > 0` ("3 selected across pages · Export · Delete · Clear").
- **Header row:** Inter `ui` uppercase, `--lux-fog` bottom hairline, sortable columns emit `sort` into `GridState`.
- **Select column:** header checkbox = `isPageAllSelected(pageIds)` (indeterminate when partial); row checkbox bound to `SelectionStore`.
- **Rows:** 56px min height, hover `--lux-cream`→`--lux-champagne-soft/30`, matte (no glass), tabular-nums for `data` cells, thumbnail images 40×48 portrait.
- **Action buttons:** icon-ghost (Lucide) with accessible `aria-label`, 40px hit target, tooltip; destructive in `--lux-danger`.
- **Footer:** `LuxPaginator` — page size selector (10/25/50), "Showing X–Y of Z", prev/next + numbered pages, all from `PagedResponse`.
- **States:** loading (skeleton rows, not spinner-over-blank), empty (illustration + copy + primary action), error (inline retry).

**Data contract:** `@Input() query: GridState<T>`, `@Output() queryChange` (URL-synced); rows via `@Input() columns: LuxColumn<T>[]`. Server endpoints return `PagedResponse<T>`.

**Accessibility:** `role="grid"`, header `scope="col"`, keyboard row focus, checkbox `aria-checked` incl. `mixed`, focus-visible champagne ring.

## 3.3 Core customer pages

**Home** (`storefront/home`)
- Full-bleed hero (campaign image or muted video), `noir` glass nav on top, `display` serif headline, single champagne CTA "Explore the Collection".
- Editorial rows (alternating 7/5 asymmetry): "New Arrivals", "The Icons", brand story.
- Curated category tiles (duotone hover), featured products carousel (portrait cards), newsletter capture in ivory band. Retire chart/dashboard widgets from the customer home.

**Product Showcase / Catalog** (`storefront/catalog`)
- Left rail filters (category, brand, price, attributes) OR top filter bar; sticky. Server-side filtered + paginated (`GridState`).
- 4-col portrait product grid, hover image-swap to second image, quick "Add to Bag" reveal, wishlist heart (champagne when active).
- Sort (Newest, Price), result count, load-more or numbered pagination sharing `LuxPaginator`.

**Product Detail** (`storefront/product/:id`)
- Split: gallery left (vertical thumbs + zoom), info right — `overline` brand, `h1` serif name, serif price, variant selectors (color swatches = real hex circles, size pills), quantity stepper, sticky glass "Add to Bag" bar on scroll.
- Tabs: Details / Materials & Care / Shipping & Returns; reviews section; "You may also like" editorial row.

**Galleries / Collections** — magazine-style masonry or fixed editorial grid; lightbox with glass chrome; supports lookbook storytelling (image + copy blocks).

**Account Dashboard** (`storefront/account`)
- Left vertical nav (Orders, Addresses, Payment Methods, Wishlist, Reviews, Coupons, Notifications, Personal Info) — mirrors your existing `user-profile/*` children, restyled.
- Order cards with status pill (semantic muted colors), track-order CTA → `OrderTrackingComponent` (restyled timeline: champagne progress line).
- Wishlist as a mini product grid; addresses/payment as matte cards.

**Cart & Checkout**
- Cart drawer (`cart-sidebar`) with glass header, line items with thumbnails, quantity steppers, subtotal in serif.
- Checkout: 3-step (Address → Delivery → Payment) with slim progress rule; order summary sticky card; single champagne "Place Order". Money math server-verified before confirm.

## 3.4 Admin dashboard pages
- `LayoutComponent` shell: `--lux-espresso` slim left sidebar (Lucide icons + labels, champagne active underline), top bar with breadcrumb (existing `BreadcrumbComponent`), profile menu, notifications.
- **Dashboard:** KPI cards (matte, serif numbers), Chart.js restyled to the palette (charcoal/champagne/sage, no default blue), live via existing STOMP `DashboardBroadcastService`.
- All list pages use `LuxTable`. All confirmations use `LuxDialogService`. Admin surfaces stay matte + Inter for density and legibility (serif reserved for numbers/titles).

## 3.5 Shared UI kit inventory (build order)
`LuxButton`, `LuxIconButton`, `LuxCard`, `LuxInput`/`LuxSelect`/`LuxField`, `LuxBadge`/`LuxStatusPill`, `LuxTable`, `LuxPaginator`, `LuxDialogService` (wraps SweetAlert2 once, themed), `LuxDrawer`, `LuxTabs`, `LuxSkeleton`, `LuxEmptyState`, `AuthShellComponent`, `ProductCard`, `EditorialRow`.

---

# PILLAR 4 — Step-by-Step Implementation Roadmap

Sequenced so the app is **always shippable**; each phase is independently reversible. No "big bang" rewrite.

### Phase 0 — Safety net & baseline (0.5 day)
1. `git switch -c feat/luxury-redesign`; confirm clean build (`ng build`, backend `mvn -q -DskipTests package`).
2. Commit the untracked stray upload (`backend/uploads/...jpg`) into `.gitignore` (uploads shouldn't be versioned).
3. Add a screenshot/E2E smoke pass of the critical flows (login, product list, add-to-cart, checkout, admin bulk-delete) to detect regressions.
4. **No behavior change in this phase.**

### Phase 1 — Design token foundation (1–2 days) · *pure additive, low risk*
1. Create `theme/_tokens.css`, `_typography.css`, `_components.css`.
2. Replace the six `:root` blocks in `src/styles.css` with a single `@import './app/theme/_tokens.css';` (BUG-4).
3. Swap fonts in `index.html` to Cormorant + Inter; remove Poppins/Roboto triple-load.
4. Resolve Tailwind version (recommend v4 repo-wide) and map `theme.extend.colors`/`fontFamily` to the CSS vars (BUG-5).
5. Introduce `LuxDialogService` and re-skin SweetAlert defaults (charcoal/champagne). Ship. *Visual refresh only; logic untouched.*

### Phase 2 — Shared UI kit (3–5 days)
1. Build `LuxButton`, `LuxCard`, `LuxInput/Field`, `LuxBadge/StatusPill`, `LuxSkeleton`, `LuxEmptyState` in `shared/ui`.
2. Storybook-style demo route (`/_ui`) to visually verify tokens & states (dev-only).
3. Roll the kit into 1–2 low-risk pages first (About, Contact) to validate.

### Phase 3 — Grid & selection refactor (4–6 days) · *fixes BUG-1/2/3*
1. Backend: add server-side paged+filtered endpoints returning `PagedResponse<T>` for Products first (then Customers, Orders…). Use Spring `Pageable` (Postgres/SSMS-safe).
2. Frontend: implement `GridState` (URL-synced) + `SelectionStore` + `LuxTable` + `LuxPaginator`.
3. **Migrate `ProductMangementComponent` as the pilot:** remove `$('#productTable').DataTable()`, remove manual `.slice()` pagination, remove `checked` from the entity, wire `SelectionStore`. Verify: select across pages → bulk delete/export hits all selected; refresh preserves page/sort/search.
4. Convert bulk delete to a single transactional batch endpoint (removes `Promise.all` partial-failure risk).
5. Repeat for each admin grid, one PR each. Delete jQuery + DataTables deps once the last grid is migrated.

### Phase 4 — Auth & session hardening (2–3 days) · *fixes BUG-6*
1. Introduce `TokenStore` + `ErrorInterceptor` + refresh `AuthInterceptor`.
2. Centralize `redirectForRoles()`; strip guard `console.log`s; make auth guards fail-closed.
3. (If infra allows) move refresh token to HttpOnly cookie + CSRF; otherwise ship the interceptor + TTL improvements.
4. Re-skin the auth flow with `AuthShellComponent` (Login/Register/OTP/Reset). Logic preserved.

### Phase 5 — Modular restructure & lazy portals (3–5 days)
1. Introduce `core/`, `shared/`, `portals/storefront`, `portals/admin` folders (move files incrementally, keep barrels).
2. Split routing into `storefront-routing` + `admin-routing`, `loadChildren`-lazy. Verify admin code is absent from the customer bundle (`source-map-explorer`).
3. Wrap service-layer writes in `@Transactional`; enforce DTO-only controller returns + `jakarta.validation`; add `GlobalExceptionHandler`.

### Phase 6 — Customer storefront redesign (5–8 days)
1. Home (hero + editorial rows), Catalog (server-side grid reuse), Product Detail (gallery + variants), Cart drawer, Checkout, Account dashboard, Galleries.
2. Restyle Chart.js + STOMP dashboard to palette. Retire Font Awesome / Bootstrap Icons / Material Icons from customer surfaces (standardize Lucide).

### Phase 7 — Polish, a11y, QA, cutover (2–3 days)
1. `prefers-reduced-motion`, focus-visible rings, `aria` on grids/dialogs, contrast audit (charcoal-on-ivory passes AA; verify champagne usage).
2. Lighthouse + bundle budget; remove dead CSS and unused deps (jQuery, DataTables, ExcelJS/xlsx if backend Jasper covers exports).
3. Full regression against Phase-0 smoke suite; stakeholder review on `noir`/`ivory`; merge behind a feature flag if desired, then flip.

### Risk controls (apply every phase)
- One concern per PR; each PR builds & passes smoke.
- Design changes never ride with logic changes in the same commit.
- Data-layer changes are additive first (new paged endpoints alongside old), old endpoints removed only after the UI cuts over.
- Keep a rollback tag at each phase boundary.

---

## Appendix A — Token → Tailwind bridge (v4)

```css
/* styles.css (v4 style) */
@import './app/theme/_tokens.css';
@theme {
  --color-ink: var(--lux-ink);
  --color-ivory: var(--lux-ivory);
  --color-cream: var(--lux-cream);
  --color-champagne: var(--lux-champagne);
  --font-serif: var(--lux-font-serif);
  --font-sans: var(--lux-font-sans);
}
```

## Appendix B — Definition of Done (per surface)
- Uses only design tokens (no literal hex).
- No jQuery/DataTables; grids use `LuxTable` + server `PagedResponse`.
- Selection via `SelectionStore`; no `checked` on entities.
- All dialogs via `LuxDialogService`; all errors via `ErrorInterceptor`.
- Keyboard-navigable, `aria`-labeled, `prefers-reduced-motion` honored.
- Loading/empty/error states implemented.
- Money math server-verified; writes `@Transactional` + validated.
```
