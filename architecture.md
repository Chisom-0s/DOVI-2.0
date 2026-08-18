# DOVI 2.0 — PERSON 2 & PERSON 3 ARCHITECTURE

**VERSION:** 2.0  
**STATUS:** PRODUCTION ARCHITECTURE  
**ROLES COVERED:** Person 2 (Frontend/Buyer Experience) + Person 3 (Admin/Save2Own/Dovi Auto)  
**STACK:** React · TypeScript · Vite · Django REST APIs  

---

## PHASES — MASTER BUILD REFERENCE

> When you say **"build Phase N"**, I will open `architecture.md`, read the phase definition below, and execute every item in it — nothing more, nothing less. Each phase is self-contained and buildable independently. Phases are ordered so each one depends only on what came before it.

---

### PHASE 1 — Frontend Foundation (Person 2)
**Goal:** Scaffold the buyer frontend. Nothing visible to end users yet — this is the engine.

**Output folder:** `frontend/`

| # | Task | API Used |
|---|------|----------|
| 1 | `npx create vite@latest frontend -- --template react-ts` | — |
| 2 | Configure path aliases (`@/api`, `@/components`, `@/hooks`, `@/types`, `@/pages`, `@/utils`, `@/contexts`) | — |
| 3 | Configure `VITE_API_BASE_URL` environment variable in `.env` and `.env.example` | — |
| 4 | Set up ESLint + Prettier with project-wide config | — |
| 5 | Set up React Router v6 with placeholder routes for every page in the project | — |
| 6 | Build Axios API client (`src/api/client.ts`) with: base URL injection, Authorization header, 401 token-refresh interceptor, 403 handler, error shape normalization | — |
| 7 | Create all API module files (empty stubs): `auth.ts`, `products.ts`, `cart.ts`, `orders.ts`, `payments.ts`, `reviews.ts`, `save2own.ts`, `auto.ts`, `notifications.ts`, `homepage.ts`, `wishlist.ts` | — |
| 8 | Build `AuthContext` — stores `user`, `token`, `isAuthenticated`, `login()`, `logout()`, `refreshToken()` | `POST /api/v1/auth/login/`, `POST /api/v1/auth/logout/`, `POST /api/v1/auth/token/refresh/`, `GET /api/v1/users/me/` |
| 9 | Session persistence — survive browser refresh (token in memory + refresh cookie pattern) | — |
| 10 | Build `<AuthGuard>` protected route wrapper — redirects unauthenticated users to `/login` | — |
| 11 | Build `<RoleGuard role="BUYER">` — verifies role from `GET /api/v1/users/me/` | `GET /api/v1/users/me/` |
| 12 | Build global `<ErrorBoundary>` component | — |
| 13 | Build shared `<Skeleton>` component (configurable width/height) | — |
| 14 | Build shared `<EmptyState>` component (icon + title + subtitle + optional CTA) | — |
| 15 | Build shared `<LoadingSpinner>` component | — |
| 16 | Build toast/notification system (react-hot-toast or equivalent) | — |
| 17 | Build `<ApiErrorMessage>` component — displays field-level and general API errors | — |
| 18 | Set up mobile-first CSS baseline (reset, typography, spacing tokens, breakpoints) | — |
| 19 | Build Login page — form + `POST /api/v1/auth/login/` | `POST /api/v1/auth/login/` |
| 20 | Build Register page — form + `POST /api/v1/auth/register/` | `POST /api/v1/auth/register/` |
| 21 | Build Password Reset pages (request + confirm) | `POST /api/v1/auth/password/reset/`, `POST /api/v1/auth/password/reset/confirm/` |
| 22 | Build Email Verification handler page | `POST /api/v1/auth/email/verify/` |
| 23 | Define all TypeScript interfaces in `src/types/` (User, Product, Cart, Order, Payment, Refund, Review, Save2Own, Auto, Notification, APIError, PaginatedResponse) | — |

**Rules for Phase 1:**
- No UI styling beyond functional CSS — visual polish comes in later phases
- No hardcoded users or tokens
- Auth state must survive a full browser refresh before Phase 1 is considered done
- Every API module file must exist even if empty
- TypeScript `any` is forbidden in all type definitions

---

### PHASE 2 — Homepage & Marketplace (Person 2)
**Goal:** Build the fully database-driven homepage and product listing page.

**Output folder:** `frontend/src/pages/Home/`, `frontend/src/pages/Products/`

| # | Task | API Used |
|---|------|----------|
| 1 | Build `Header` component — logo, search bar, nav links, cart icon, auth state | — |
| 2 | Build `Footer` component | — |
| 3 | Build `MainLayout` — Header + outlet + Footer | — |
| 4 | Implement homepage API call — fetch full config | `GET /api/v1/homepage/` |
| 5 | Build `HeroBannerCarousel` — auto-slide, manual nav, dot indicators, desktop + mobile images, lazy load, skeleton | `GET /api/v1/homepage/banners/` |
| 6 | Build `SearchBar` — debounced input (300ms), suggestions dropdown, navigate on submit | `GET /api/v1/products/search/?q=...` |
| 7 | Build `CategoryGrid` — horizontal scroll mobile, grid desktop | `GET /api/v1/categories/` |
| 8 | Build `ProductCard` component — image, name, price, vendor, rating stars, stock badge, Add to Cart, Wishlist toggle | `POST /api/v1/cart/items/`, `POST/DELETE /api/v1/wishlist/` |
| 9 | Build `ProductRow` component — horizontal scrollable strip of ProductCards with section title | — |
| 10 | Wire Flash Deals section | `GET /api/v1/products/flash-deals/` |
| 11 | Wire Marketplace Feed section | `GET /api/v1/products/` |
| 12 | Wire Trending Now section | `GET /api/v1/products/trending/` |
| 13 | Wire Best Sellers section | `GET /api/v1/products/best-sellers/` |
| 14 | Wire New Arrivals section | `GET /api/v1/products/new-arrivals/` |
| 15 | Wire Top Rated section | `GET /api/v1/products/top-rated/` |
| 16 | Wire Budget Deals section | `GET /api/v1/products/budget-deals/` |
| 17 | Wire Featured Products section | `GET /api/v1/products/featured/` |
| 18 | Wire Featured Vendors section | `GET /api/v1/vendors/` |
| 19 | Wire Recently Viewed section | `GET /api/v1/recently-viewed/` |
| 20 | Wire all remaining homepage sections (Student Essentials, Buy With Confidence, Save2Own teaser, Dovi Auto teaser) from `GET /api/v1/homepage/sections/` | `GET /api/v1/homepage/sections/` |
| 21 | Homepage section visibility — only render sections where `visible: true` from API | `GET /api/v1/homepage/sections/` |
| 22 | Homepage section order — render in the order returned by API | — |
| 23 | Build Product Listing page (`/products`) — paginated grid, filter sidebar (desktop), filter drawer (mobile), sort dropdown, result count, skeleton, empty state | `GET /api/v1/products/` |
| 24 | Build Category page (`/categories/:slug`) | `GET /api/v1/categories/:slug/products/` |
| 25 | Build Search Results page (`/search?q=...`) | `GET /api/v1/products/search/` |
| 26 | Filters: price range, category, in_stock, sort (price_asc, price_desc, newest, rating) — all as query params to API | — |

**Rules for Phase 2:**
- Zero hardcoded banners, products, categories, or section titles
- Every section must have its own loading skeleton
- Every section must have its own empty state
- Sections hidden in admin must not render — driven by API `visible` field
- Prices displayed exactly as returned from API — no frontend math

---

### PHASE 3 — Product Discovery (Person 2)
**Goal:** Build the complete product detail experience.

**Output folder:** `frontend/src/pages/Products/Detail/`

| # | Task | API Used |
|---|------|----------|
| 1 | Build Product Detail page (`/products/:id`) | `GET /api/v1/products/:id/` |
| 2 | Fetch and display product images | `GET /api/v1/products/:id/images/` |
| 3 | Build `ProductImageGallery` — thumbnail strip, main image zoom (desktop), swipe (mobile), lazy load, error fallback | — |
| 4 | Display product name, price, SKU, stock status — all from API | — |
| 5 | Build `VariantSelector` — options from API, on change re-fetch price/stock | `GET /api/v1/products/:id/variants/` |
| 6 | Add to Cart button — `POST /api/v1/cart/items/` with selected variant | `POST /api/v1/cart/items/` |
| 7 | Buy Now — add to cart then redirect to `/checkout` | `POST /api/v1/cart/items/` |
| 8 | Wishlist toggle on product detail | `POST/DELETE /api/v1/wishlist/` |
| 9 | Build `VendorInfoCard` — name, logo, rating, location, link to `/vendors/:id` | `GET /api/v1/vendors/:vendorId/` |
| 10 | Build `RatingSummary` — average star rating + breakdown bar (5★→1★) | — |
| 11 | Build `ReviewsList` — paginated, rating, text, verified badge, date | `GET /api/v1/products/:id/reviews/` |
| 12 | Build `ReviewForm` — check eligibility first, then rating inputs + text area + submit | `GET /api/v1/reviews/eligibility/:order_ref/`, `POST /api/v1/reviews/` |
| 13 | Record product view on page mount | `POST /api/v1/recently-viewed/` |
| 14 | Build Related Products strip (from API response `related_products` field) | — |
| 15 | Build `RecentlyViewedStrip` (horizontal scroll) | `GET /api/v1/recently-viewed/` |
| 16 | Build Vendor Store page (`/vendors/:id`) | `GET /api/v1/vendors/:id/`, `GET /api/v1/vendors/:id/products/` |

**Rules for Phase 3:**
- Variant price must update from API response only — never recalculate
- Verified Purchase badge must come from API boolean field
- Review form must only show if API says user is eligible
- Images must have fallback src on `onError`

---

### PHASE 4 — Cart, Checkout & Orders (Person 2)
**Goal:** Build the complete purchase flow — cart through payment to order confirmation.

**Output folder:** `frontend/src/pages/Cart/`, `frontend/src/pages/Checkout/`, `frontend/src/pages/Orders/`

| # | Task | API Used |
|---|------|----------|
| 1 | Build `CartContext` — synced with backend on every change | `GET /api/v1/cart/` |
| 2 | Build Cart page (`/cart`) — item list, quantity stepper, remove, totals from API | `GET /api/v1/cart/`, `PATCH /api/v1/cart/items/:id/`, `DELETE /api/v1/cart/items/:id/` |
| 3 | Cart summary — subtotal, delivery estimate, total (ALL figures from API) | — |
| 4 | Cart stock warning (out-of-stock badge, disable checkout) — from API validation response | `POST /api/v1/cart/validate/` |
| 5 | Cart empty state | — |
| 6 | Checkout Step 1 — Delivery address (select saved or add new) | `GET /api/v1/users/me/addresses/`, `POST /api/v1/users/me/addresses/` |
| 7 | Checkout Step 2 — Delivery method (options + prices from API) | `POST /api/v1/checkout/` |
| 8 | Checkout Step 3 — Payment method selection | `GET /api/v1/payments/methods/` |
| 9 | Checkout Step 4 — Order review (all amounts from API, NEVER frontend-calculated) | `GET /api/v1/checkout/:id/` |
| 10 | Confirm checkout | `POST /api/v1/checkout/:id/confirm/` |
| 11 | Flutterwave payment flow — initialize → SDK/redirect → poll verify → success/failure | `POST /api/v1/payments/initialize/`, `GET /api/v1/payments/:ref/verify/` |
| 12 | OPay payment flow — same pattern as Flutterwave | `POST /api/v1/payments/initialize/`, `GET /api/v1/payments/:ref/verify/` |
| 13 | Payment success page (`/orders/:ref?status=success`) | — |
| 14 | Payment failure page — message from API, retry button, choose different method | `POST /api/v1/payments/:ref/retry/` |
| 15 | Order Confirmation page | `GET /api/v1/orders/:ref/` |
| 16 | Order History page (`/dashboard/orders`) — list, status badge, totals from API | `GET /api/v1/orders/` |
| 17 | Order Detail page (`/dashboard/orders/:ref`) — items, status timeline, tracking, actions | `GET /api/v1/orders/:ref/`, `GET /api/v1/orders/:ref/tracking/` |
| 18 | Confirm Receipt button | `POST /api/v1/orders/:ref/confirm-receipt/` |
| 19 | Cancel Order button (only when API says cancellable) | `POST /api/v1/orders/:ref/cancel/` |
| 20 | Refund Request flow — reason, explanation, evidence upload, submit | `POST /api/v1/refunds/`, `POST /api/v1/refunds/:id/evidence/` |
| 21 | Refund Status page — approval/rejection/processed from API | `GET /api/v1/refunds/:id/` |

**Rules for Phase 4:**
- NEVER calculate any cart total, order total, or delivery fee on the frontend
- Payment status is set ONLY by the backend webhook — the frontend only reads it
- Frontend must not trust redirect params as payment proof — must verify via API
- All order status badges must use labels from API `status` field

---

### PHASE 5 — Buyer Dashboard & Trust (Person 2)
**Goal:** Build the complete Jumia-style buyer dashboard.

**Output folder:** `frontend/src/pages/Dashboard/`

| # | Task | API Used |
|---|------|----------|
| 1 | Build Dashboard shell — sidebar nav (desktop), bottom nav (mobile) | — |
| 2 | Dashboard Overview page — recent orders widget, notification preview | `GET /api/v1/orders/`, `GET /api/v1/notifications/unread-count/` |
| 3 | Profile page — view + edit name, email, avatar | `GET /api/v1/users/me/`, `PATCH /api/v1/users/me/` |
| 4 | Addresses page — list, add, edit, delete | `GET /api/v1/users/me/addresses/`, `POST`, `PATCH`, `DELETE` |
| 5 | Payment Methods page — list saved methods | `GET /api/v1/users/me/payment-methods/` |
| 6 | Wishlist page | `GET /api/v1/wishlist/`, `DELETE /api/v1/wishlist/:id/` |
| 7 | Recently Viewed page | `GET /api/v1/recently-viewed/` |
| 8 | Reviews page — list submitted reviews, edit, delete | `GET /api/v1/reviews/`, `PATCH /api/v1/reviews/:id/`, `DELETE /api/v1/reviews/:id/` |
| 9 | Refund Requests page — list all refunds + statuses | `GET /api/v1/refunds/` |
| 10 | Notifications page — full list, mark read, mark all read | `GET /api/v1/notifications/`, `PATCH /api/v1/notifications/:id/read/`, `POST /api/v1/notifications/read-all/` |
| 11 | Notification bell in header — unread badge count, dropdown preview of last 5, navigate on click | `GET /api/v1/notifications/unread-count/` |
| 12 | Account Settings page — name, email, phone | `PATCH /api/v1/users/me/` |
| 13 | Security Settings page — change password | `POST /api/v1/auth/password/reset/` |
| 14 | Deactivate Account option | `DELETE /api/v1/users/me/` |

**Rules for Phase 5:**
- All dashboard routes are protected by `<AuthGuard>`
- Avatar upload must send to API and display URL from API response
- Notification count must poll `GET /api/v1/notifications/unread-count/` every 30s

---

### PHASE 6 — Save2Own Buyer UI (Person 2)
**Goal:** Build the complete buyer-facing Save2Own experience.

**Output folder:** `frontend/src/pages/Save2Own/`

| # | Task | API Used |
|---|------|----------|
| 1 | Save2Own Goals list page (`/dashboard/save2own`) | `GET /api/v1/save2own/goals/` |
| 2 | Goal creation flow — product select, variant select, contribution plan, review, confirm | `POST /api/v1/save2own/goals/` |
| 3 | Goal Detail page (`/save2own/goals/:id`) | `GET /api/v1/save2own/goals/:id/` |
| 4 | Display: target amount, contributed, remaining, progress %, target date — ALL from API | — |
| 5 | Contribution History list | `GET /api/v1/save2own/goals/:id/contributions/` |
| 6 | Make Contribution button → payment flow → verify | `POST /api/v1/save2own/goals/:id/contribute/`, `POST /api/v1/payments/initialize/`, `GET /api/v1/payments/:ref/verify/` |
| 7 | Pause goal action | `POST /api/v1/save2own/goals/:id/pause/` |
| 8 | Resume goal action | `POST /api/v1/save2own/goals/:id/resume/` |
| 9 | Cancel goal action (with confirmation modal) | `POST /api/v1/save2own/goals/:id/cancel/` |
| 10 | Change product/variant flow | `PATCH /api/v1/save2own/goals/:id/` |
| 11 | Change quantity flow | `PATCH /api/v1/save2own/goals/:id/` |
| 12 | Goal Complete — Checkout CTA | `POST /api/v1/save2own/goals/:id/checkout/` |
| 13 | Refund status within goal | `GET /api/v1/save2own/goals/:id/refund/` |
| 14 | Handle all 10 goal states with correct UI per state (see state list in architecture) | — |
| 15 | PRICE_CHANGED state — show old target AND new target (both from API, never recalculated) | — |
| 16 | PRODUCT_UNAVAILABLE state — show warning + prompt product change | — |

**Rules for Phase 6:**
- NEVER calculate remaining amount, progress %, or target on the frontend
- Contribution history is read-only — never allow editing history
- Old target and old product must remain visible when product changes (from API history)
- All financial figures shown come directly from API response fields

---

### PHASE 7 — Admin Foundation (Person 3)
**Goal:** Scaffold the admin panel and build all core management pages.

**Output folder:** `admin/`

| # | Task | API Used |
|---|------|----------|
| 1 | `npx create vite@latest admin -- --template react-ts` (separate app) | — |
| 2 | Configure path aliases, env vars, ESLint/Prettier | — |
| 3 | Admin routing with all page stubs | — |
| 4 | `AdminAuthContext` — admin login, role check (must be ADMIN from API) | `POST /api/v1/auth/login/`, `GET /api/v1/users/me/` |
| 5 | `<AdminAuthGuard>` — non-admin sees access denied | — |
| 6 | Admin layout — sidebar navigation + header | — |
| 7 | Admin Dashboard Overview — analytics widgets (all from API) | `GET /api/v1/admin/analytics/overview/` |
| 8 | User Management — searchable table, detail, suspend, activate | `GET /api/v1/admin/users/`, `GET /api/v1/admin/users/:id/`, `PATCH /api/v1/admin/users/:id/suspend/`, `PATCH /api/v1/admin/users/:id/activate/` |
| 9 | Vendor Management — table with status filter, detail, approve, reject, suspend | `GET /api/v1/admin/vendors/`, `POST /api/v1/admin/vendors/:id/approve/`, `POST /api/v1/admin/vendors/:id/reject/`, `POST /api/v1/admin/vendors/:id/suspend/` |
| 10 | Product Management — table, archive | `GET /api/v1/admin/products/`, `POST /api/v1/admin/products/:id/archive/` |
| 11 | Category Management — tree view, create, edit, delete | `GET /api/v1/admin/categories/`, `POST`, `PATCH`, `DELETE` |
| 12 | Order Management — table with filters, detail, status update | `GET /api/v1/admin/orders/`, `PATCH /api/v1/admin/orders/:ref/status/` |
| 13 | Payment Monitoring — view-only table + detail | `GET /api/v1/admin/payments/`, `GET /api/v1/admin/payments/:ref/` |
| 14 | Refund Management — queue, detail, approve, reject | `GET /api/v1/admin/refunds/`, `POST /api/v1/admin/refunds/:id/approve/`, `POST /api/v1/admin/refunds/:id/reject/` |
| 15 | Review Moderation — table, remove review | `GET /api/v1/admin/reviews/`, `DELETE /api/v1/admin/reviews/:id/` |
| 16 | Audit Log Viewer — view-only, filterable | `GET /api/v1/admin/audit-logs/` |

**Rules for Phase 7:**
- Admin app is completely separate from buyer frontend
- Admin role MUST be verified from `GET /api/v1/users/me/` on every protected admin route
- Payment monitoring is VIEW ONLY — no payment manipulation
- Audit logs are VIEW ONLY — no editing

---

### PHASE 8 — Homepage Management (Person 3)
**Goal:** Build the CMS for all buyer homepage content. No frontend code changes should be needed to update homepage content after this phase.

**Output folder:** `admin/src/pages/Homepage/`

| # | Task | API Used |
|---|------|----------|
| 1 | Banner list with drag-and-drop reorder | `GET /api/v1/admin/homepage/banners/`, `POST /api/v1/admin/homepage/banners/reorder/` |
| 2 | Create banner form — title, subtitle, CTA, desktop image URL, mobile image URL, start/end date, target URL | `POST /api/v1/admin/homepage/banners/` |
| 3 | Edit banner form | `PATCH /api/v1/admin/homepage/banners/:id/` |
| 4 | Delete banner (confirmation modal) | `DELETE /api/v1/admin/homepage/banners/:id/` |
| 5 | Activate / deactivate toggle | `POST /api/v1/admin/homepage/banners/:id/activate/`, `POST /api/v1/admin/homepage/banners/:id/deactivate/` |
| 6 | Schedule activation — start date + end date picker | — |
| 7 | Banner preview (desktop + mobile) | — |
| 8 | Homepage sections list with drag-and-drop reorder | `GET /api/v1/admin/homepage/sections/`, `POST /api/v1/admin/homepage/sections/reorder/` |
| 9 | Section visibility toggle (show/hide) | `PATCH /api/v1/admin/homepage/sections/:id/` |
| 10 | Section title edit | `PATCH /api/v1/admin/homepage/sections/:id/` |
| 11 | Section config editor (JSON config fields from API) | `PATCH /api/v1/admin/homepage/sections/:id/` |

**Rules for Phase 8:**
- No buyer frontend code should need modification for homepage content to change
- All changes saved immediately to API on submit
- Reorder must be reflected on the buyer homepage without a deploy

---

### PHASE 9 — Save2Own Admin Module (Person 3)
**Goal:** Full admin monitoring and control of Save2Own goals.

**Output folder:** `admin/src/pages/Save2Own/`

| # | Task | API Used |
|---|------|----------|
| 1 | Save2Own goals table — all goals, filterable by status | `GET /api/v1/admin/save2own/` |
| 2 | Goal detail view — full timeline, contributions, product history, price history | `GET /api/v1/admin/save2own/:id/` |
| 3 | Suspend goal (with reason) | `POST /api/v1/admin/save2own/:id/suspend/` |
| 4 | Display all 10 goal states with clear labels and color-coded badges | — |
| 5 | Contribution history table — immutable, full timeline | — |
| 6 | Product change history — show old and new product (both from API, never overwritten) | — |
| 7 | Price change history — show old and new target (both from API) | — |
| 8 | Financial summary per goal (target, contributed, remaining — all from API) | — |

**Rules for Phase 9:**
- Financial history is never overwritten — display exactly what API returns
- Admin can suspend but cannot manually edit contributions or financial records
- Old product and old target remain visible after product change

---

### PHASE 10 — Dovi Auto Foundation (Person 3)
**Goal:** Build Dovi Auto as a dedicated section — NOT a marketplace category.

**Output folder:** `frontend/src/pages/Auto/`

| # | Task | API Used |
|---|------|----------|
| 1 | Dovi Auto landing page (`/auto`) — dedicated branding, sub-navigation | — |
| 2 | Auto sub-navigation — Cars \| Parts \| Accessories \| Rentals \| Services | — |
| 3 | Car Listings page (`/auto/cars`) — paginated grid with search + filters | `GET /api/v1/auto/listings/` |
| 4 | Filters: make, model, year range, fuel type, transmission, condition, price range, location | — |
| 5 | Car Listing Card — image, make+model+year, price, mileage, transmission, fuel type, location, seller | — |
| 6 | Car Listing Detail page (`/auto/cars/:id`) | `GET /api/v1/auto/listings/:id/` |
| 7 | Image gallery on listing detail | — |
| 8 | Full vehicle specs display — all fields from API | — |
| 9 | Seller profile card + rating | — |
| 10 | Favorites toggle | `POST /api/v1/auto/favorites/`, `DELETE /api/v1/auto/favorites/:id/` |
| 11 | Reviews on listing | `GET /api/v1/auto/listings/:id/reviews/` (or products reviews endpoint — confirm with P1) |
| 12 | Similar listings section (from API response) | — |
| 13 | Admin: Auto listings table — edit, remove, view orders | `GET /api/v1/admin/auto/listings/`, `PATCH`, `DELETE` |

**Rules for Phase 10:**
- Dovi Auto must have its own dedicated URL space under `/auto`
- It must NOT appear as just another category in the main product feed
- Auto reuses core Users, Payments, Reviews, Media, Notifications from the backend

---

### PHASE 11 — Car Parts, Accessories & Auto Checkout (Person 3)
**Goal:** Build parts, accessories discovery and wire Auto purchases through the core checkout.

**Output folder:** `frontend/src/pages/Auto/`

| # | Task | API Used |
|---|------|----------|
| 1 | Car Parts listing page (`/auto/parts`) | `GET /api/v1/auto/parts/` |
| 2 | Parts filters: make, model, year, type (OEM/aftermarket), condition, in_stock, price range | — |
| 3 | Part Detail page (`/auto/parts/:id`) — part number, compatibility list, condition, stock, price, vendor | `GET /api/v1/auto/parts/:id/` |
| 4 | Compatibility check UI — buyer enters vehicle → API confirms compatible | — |
| 5 | Add to Cart (reuses core cart) | `POST /api/v1/cart/items/` |
| 6 | Accessories listing page (`/auto/accessories`) | `GET /api/v1/auto/accessories/` |
| 7 | Accessories filtered by sub-category (electronics, dashcams, floor mats, etc.) | — |
| 8 | Accessory Detail page — reuses standard product detail pattern | `GET /api/v1/auto/accessories/:id/` |
| 9 | Auto checkout — fully reuses core checkout flow (no separate payment system) | Core checkout + payment APIs |
| 10 | Auto delivery/pickup selection in checkout | — |
| 11 | Order created → buyer sees auto order in `/dashboard/orders` | — |
| 12 | Admin: parts + accessories management tables | `GET /api/v1/admin/auto/listings/` |

**Rules for Phase 11:**
- Auto must reuse the core checkout and payment system — no new payment layer
- Auto-specific business logic stays in backend Auto domain (Person 1)
- Parts purchase flow: Browse → Detail → Compatibility check → Cart → Checkout → Payment → Order → Delivery → Confirm → Review

---

### PHASE 12 — Rentals, Notifications & Final Integration (Person 3)
**Goal:** Build auto rentals, wire all notifications, and complete full integration.

**Output folder:** `frontend/src/pages/Auto/Rentals/`, `frontend/src/components/Notifications/`

| # | Task | API Used |
|---|------|----------|
| 1 | Rental Listings page (`/auto/rentals`) | `GET /api/v1/auto/rentals/` |
| 2 | Rental Listing Detail — vehicle images, rate, availability calendar, pickup/return location, deposit (from API) | `GET /api/v1/auto/rentals/:id/` |
| 3 | Booking flow — select dates, confirm locations, review total (from API), payment | `POST /api/v1/auto/rentals/:id/book/` |
| 4 | Booking confirmation page | — |
| 5 | My Rentals / Bookings page | `GET /api/v1/auto/rentals/bookings/` |
| 6 | Cancel Booking (eligibility from API) | `POST /api/v1/auto/rentals/bookings/:id/cancel/` |
| 7 | Notification Centre page (all 17 notification types handled with correct copy + action buttons) | `GET /api/v1/notifications/`, `PATCH`, `POST /api/v1/notifications/read-all/` |
| 8 | Notification bell badge — poll unread count every 30s | `GET /api/v1/notifications/unread-count/` |
| 9 | All action-button notifications route to correct page (e.g., "Confirm receipt" → order detail) | — |
| 10 | Admin: Rental management — listings, bookings, cancellations | `GET /api/v1/admin/auto/listings/` |
| 11 | Admin: Notifications management (if admin-facing alerts needed) | — |
| 12 | Final Integration Checklist (all items in architecture `Final Integration Checklist`) | — |

**Final Integration Checklist (Phase 12 sign-off):**
```
- [ ] Save2Own connected to payment APIs
- [ ] Save2Own connected to orders
- [ ] Save2Own connected to notifications
- [ ] Dovi Auto connected to payments
- [ ] Dovi Auto connected to orders
- [ ] Dovi Auto connected to delivery
- [ ] Admin connected to all management APIs
- [ ] Homepage connected to database
- [ ] Notifications connected to backend
- [ ] Audit logs verified
- [ ] End-to-end testing completed
- [ ] Mobile tested all pages
- [ ] Desktop tested all pages
- [ ] Tablet tested all pages
- [ ] Browser refresh / session persistence verified
- [ ] Slow network simulation passed
- [ ] API failure simulation passed
- [ ] Failed payment flow tested
- [ ] No mock data in any production path
```

**Rules for Phase 12:**
- Rental total must never be calculated on the frontend
- Booking cancellation eligibility must come from API
- Every notification type must route to the correct page when clicked
- No phase is complete until the full Definition of Done checklist in the architecture is satisfied

---

> **BUILD INSTRUCTION FOR ANTIGRAVITY:**
> When the user says "build Phase N", read the phase table above, then read the corresponding detailed section in this document for full context. Build every item in the phase table. Follow all rules listed for that phase. Reference the API Contract section for exact endpoint shapes. Do not build anything outside the phase scope. Do not skip items.

---

## TABLE OF CONTENTS

1. [Technology Stack](#technology-stack)
2. [Non-Negotiable Rules](#non-negotiable-rules)
3. [API Contract Reference](#api-contract-reference)
4. [Project Structure](#project-structure)
5. [PERSON 2 — Frontend Foundation](#person-2--frontend-foundation)
6. [PERSON 2 — Homepage & Marketplace](#person-2--homepage--marketplace)
7. [PERSON 2 — Product Discovery](#person-2--product-discovery)
8. [PERSON 2 — Cart & Checkout](#person-2--cart--checkout)
9. [PERSON 2 — Orders & Tracking](#person-2--orders--tracking)
10. [PERSON 2 — Buyer Dashboard](#person-2--buyer-dashboard)
11. [PERSON 2 — Reviews & Trust](#person-2--reviews--trust)
12. [PERSON 2 — Save2Own (Buyer UI)](#person-2--save2own-buyer-ui)
13. [PERSON 2 — Delivery Roadmap](#person-2--delivery-roadmap)
14. [PERSON 3 — Admin System](#person-3--admin-system)
15. [PERSON 3 — Homepage Management](#person-3--homepage-management)
16. [PERSON 3 — Save2Own (Full Module)](#person-3--save2own-full-module)
17. [PERSON 3 — Dovi Auto](#person-3--dovi-auto)
18. [PERSON 3 — Notifications](#person-3--notifications)
19. [PERSON 3 — Delivery Roadmap](#person-3--delivery-roadmap)
20. [Shared Frontend Patterns](#shared-frontend-patterns)
21. [Definition of Done](#definition-of-done)

---

## TECHNOLOGY STACK

```
Frontend:        React + TypeScript + Vite
Routing:         React Router v6+
State:           Context API / Zustand (no Redux unless team agrees)
HTTP Client:     Axios with interceptors
Forms:           React Hook Form + Zod
Styling:         CSS Modules / Styled Components (team decides — one standard)
Payment UI:      Flutterwave JS SDK / OPay redirect
Media:           Served from S3-compatible object storage (URLs from API)
API Base:        /api/v1/
```

---

## NON-NEGOTIABLE RULES

These rules apply to EVERY line of frontend code written by Person 2 and Person 3.

```
1.  Never calculate the authoritative order total on the frontend.
2.  Never calculate authoritative financial balances on the frontend.
3.  Never determine authorization or permissions on the frontend.
4.  Never write directly to PostgreSQL from the frontend.
5.  Never store secrets, API keys, or payment credentials in React.
6.  Never hardcode products, banners, categories, users, or orders.
7.  Never use localStorage as a database.
8.  Never use JSON files as a fallback database.
9.  Never allow frontend-controlled payment status changes.
10. Never allow frontend-controlled role assignment.
11. Every UI feature is INCOMPLETE until the real backend API works.
12. All forms must display server-side validation errors exactly as returned.
13. All financial figures displayed must come from API responses.
14. All permissions must be checked against the backend before rendering.
15. All protected routes must verify authentication before rendering.
16. No mock production data in any deployed environment.
17. API error responses must be surfaced to the user in a clear, friendly way.
18. Every page must handle: loading state, error state, empty state.
19. Mobile-first. Every UI must be tested on mobile before it is considered done.
20. Payment UI must never manipulate payment status. Status comes from webhook.
```

---

## API CONTRACT REFERENCE

All endpoints are owned by Person 1. Person 2 and Person 3 consume only.  
**Base URL:** `/api/v1/`

### Authentication & Users
```
POST   /api/v1/auth/register/              — Buyer registration
POST   /api/v1/auth/login/                 — Login (returns token)
POST   /api/v1/auth/logout/                — Logout
POST   /api/v1/auth/token/refresh/         — Refresh access token
POST   /api/v1/auth/password/reset/        — Password reset request
POST   /api/v1/auth/password/reset/confirm/ — Password reset confirm
POST   /api/v1/auth/email/verify/          — Email verification
GET    /api/v1/users/me/                   — Authenticated user profile
PATCH  /api/v1/users/me/                   — Update profile
DELETE /api/v1/users/me/                   — Deactivate account
GET    /api/v1/users/me/addresses/         — List saved addresses
POST   /api/v1/users/me/addresses/         — Add address
PATCH  /api/v1/users/me/addresses/{id}/    — Edit address
DELETE /api/v1/users/me/addresses/{id}/    — Delete address
GET    /api/v1/users/me/payment-methods/   — Saved payment methods
```

### Vendors
```
GET    /api/v1/vendors/                    — List all vendors (public)
GET    /api/v1/vendors/{id}/               — Vendor public profile
GET    /api/v1/vendors/{id}/products/      — Products by vendor
POST   /api/v1/vendors/register/           — Register as vendor
GET    /api/v1/vendors/me/                 — Authenticated vendor profile
PATCH  /api/v1/vendors/me/                 — Update vendor profile
GET    /api/v1/vendors/me/products/        — Vendor's own products
GET    /api/v1/vendors/me/orders/          — Vendor's orders
GET    /api/v1/vendors/me/analytics/       — Vendor analytics
```

### Categories
```
GET    /api/v1/categories/                 — All categories (tree)
GET    /api/v1/categories/{slug}/          — Category detail
GET    /api/v1/categories/{slug}/products/ — Products in category
```

### Products
```
GET    /api/v1/products/                   — Product listing (paginated)
GET    /api/v1/products/{id}/              — Product detail
GET    /api/v1/products/search/            — Search products
GET    /api/v1/products/featured/          — Featured products
GET    /api/v1/products/trending/          — Trending products
GET    /api/v1/products/new-arrivals/      — New arrivals
GET    /api/v1/products/best-sellers/      — Best sellers
GET    /api/v1/products/flash-deals/       — Flash deals
GET    /api/v1/products/budget-deals/      — Budget deals
GET    /api/v1/products/top-rated/         — Top rated products
GET    /api/v1/products/{id}/variants/     — Product variants
GET    /api/v1/products/{id}/images/       — Product images
GET    /api/v1/products/{id}/reviews/      — Product reviews
```

### Cart
```
GET    /api/v1/cart/                       — Get current cart
POST   /api/v1/cart/items/                 — Add item to cart
PATCH  /api/v1/cart/items/{id}/            — Update cart item quantity
DELETE /api/v1/cart/items/{id}/            — Remove cart item
DELETE /api/v1/cart/clear/                 — Clear entire cart
POST   /api/v1/cart/validate/              — Validate cart before checkout
```

### Checkout
```
POST   /api/v1/checkout/                   — Initiate checkout
GET    /api/v1/checkout/{id}/              — Checkout session details
POST   /api/v1/checkout/{id}/confirm/      — Confirm checkout and create order
```

### Orders
```
GET    /api/v1/orders/                     — List buyer orders
GET    /api/v1/orders/{ref}/               — Order detail
POST   /api/v1/orders/{ref}/cancel/        — Cancel order (if eligible)
POST   /api/v1/orders/{ref}/confirm-receipt/ — Buyer confirms delivery
GET    /api/v1/orders/{ref}/tracking/      — Order tracking info
```

### Payments
```
POST   /api/v1/payments/initialize/        — Initialize payment
GET    /api/v1/payments/{ref}/verify/      — Verify payment
POST   /api/v1/payments/{ref}/retry/       — Retry failed payment
GET    /api/v1/payments/methods/           — Available payment providers
```

### Refunds
```
POST   /api/v1/refunds/                    — Create refund request
GET    /api/v1/refunds/                    — List buyer refund requests
GET    /api/v1/refunds/{id}/               — Refund detail
POST   /api/v1/refunds/{id}/evidence/      — Upload evidence
```

### Reviews
```
POST   /api/v1/reviews/                    — Submit review
GET    /api/v1/reviews/                    — List buyer's reviews
GET    /api/v1/reviews/eligibility/{order_ref}/ — Check review eligibility
PATCH  /api/v1/reviews/{id}/               — Edit review
DELETE /api/v1/reviews/{id}/               — Delete review
```

### Wishlist
```
GET    /api/v1/wishlist/                   — Get wishlist
POST   /api/v1/wishlist/                   — Add to wishlist
DELETE /api/v1/wishlist/{id}/              — Remove from wishlist
```

### Recently Viewed
```
POST   /api/v1/recently-viewed/            — Record product view
GET    /api/v1/recently-viewed/            — Get recently viewed products
```

### Notifications
```
GET    /api/v1/notifications/              — List notifications
PATCH  /api/v1/notifications/{id}/read/    — Mark as read
POST   /api/v1/notifications/read-all/     — Mark all as read
GET    /api/v1/notifications/unread-count/ — Unread count
```

### Homepage
```
GET    /api/v1/homepage/                   — Full homepage data
GET    /api/v1/homepage/banners/           — Hero banners
GET    /api/v1/homepage/sections/          — Homepage sections + content
```

### Save2Own
```
GET    /api/v1/save2own/goals/             — List buyer goals
POST   /api/v1/save2own/goals/             — Create goal
GET    /api/v1/save2own/goals/{id}/        — Goal detail
PATCH  /api/v1/save2own/goals/{id}/        — Update goal (product/quantity)
POST   /api/v1/save2own/goals/{id}/pause/  — Pause goal
POST   /api/v1/save2own/goals/{id}/resume/ — Resume goal
POST   /api/v1/save2own/goals/{id}/cancel/ — Cancel goal
POST   /api/v1/save2own/goals/{id}/contribute/ — Make contribution
GET    /api/v1/save2own/goals/{id}/contributions/ — Contribution history
POST   /api/v1/save2own/goals/{id}/checkout/ — Complete goal checkout
GET    /api/v1/save2own/goals/{id}/refund/ — Refund status
```

### Dovi Auto
```
GET    /api/v1/auto/listings/              — Car listings (paginated)
GET    /api/v1/auto/listings/{id}/         — Car listing detail
GET    /api/v1/auto/parts/                 — Car parts (paginated)
GET    /api/v1/auto/parts/{id}/            — Car part detail
GET    /api/v1/auto/accessories/           — Accessories
GET    /api/v1/auto/accessories/{id}/      — Accessory detail
GET    /api/v1/auto/rentals/               — Rental listings
GET    /api/v1/auto/rentals/{id}/          — Rental detail
POST   /api/v1/auto/rentals/{id}/book/     — Book rental
GET    /api/v1/auto/rentals/bookings/      — Buyer rental bookings
POST   /api/v1/auto/rentals/bookings/{id}/cancel/ — Cancel booking
POST   /api/v1/auto/favorites/             — Add auto listing to favorites
DELETE /api/v1/auto/favorites/{id}/        — Remove from favorites
GET    /api/v1/auto/favorites/             — List favorites
```

### Admin Endpoints (Person 3 only)
```
--- User Management ---
GET    /api/v1/admin/users/                — List all users
GET    /api/v1/admin/users/{id}/           — User detail
PATCH  /api/v1/admin/users/{id}/suspend/   — Suspend user
PATCH  /api/v1/admin/users/{id}/activate/  — Activate user

--- Vendor Management ---
GET    /api/v1/admin/vendors/              — List all vendors
GET    /api/v1/admin/vendors/{id}/         — Vendor detail
POST   /api/v1/admin/vendors/{id}/approve/ — Approve vendor
POST   /api/v1/admin/vendors/{id}/reject/  — Reject vendor
POST   /api/v1/admin/vendors/{id}/suspend/ — Suspend vendor

--- Product Management ---
GET    /api/v1/admin/products/             — All products
PATCH  /api/v1/admin/products/{id}/        — Edit product
POST   /api/v1/admin/products/{id}/archive/ — Archive product

--- Category Management ---
GET    /api/v1/admin/categories/           — All categories
POST   /api/v1/admin/categories/           — Create category
PATCH  /api/v1/admin/categories/{id}/      — Edit category
DELETE /api/v1/admin/categories/{id}/      — Delete category

--- Order Management ---
GET    /api/v1/admin/orders/               — All orders
GET    /api/v1/admin/orders/{ref}/         — Order detail
PATCH  /api/v1/admin/orders/{ref}/status/  — Update order status

--- Payment Monitoring ---
GET    /api/v1/admin/payments/             — All payment records
GET    /api/v1/admin/payments/{ref}/       — Payment detail

--- Refund Management ---
GET    /api/v1/admin/refunds/              — All refund requests
GET    /api/v1/admin/refunds/{id}/         — Refund detail
POST   /api/v1/admin/refunds/{id}/approve/ — Approve refund
POST   /api/v1/admin/refunds/{id}/reject/  — Reject refund

--- Review Moderation ---
GET    /api/v1/admin/reviews/              — All reviews
DELETE /api/v1/admin/reviews/{id}/         — Remove review

--- Homepage Management ---
GET    /api/v1/admin/homepage/banners/           — All banners
POST   /api/v1/admin/homepage/banners/           — Create banner
PATCH  /api/v1/admin/homepage/banners/{id}/      — Edit banner
DELETE /api/v1/admin/homepage/banners/{id}/      — Delete banner
POST   /api/v1/admin/homepage/banners/{id}/activate/   — Activate
POST   /api/v1/admin/homepage/banners/{id}/deactivate/ — Deactivate
POST   /api/v1/admin/homepage/banners/reorder/   — Reorder banners

GET    /api/v1/admin/homepage/sections/          — All sections
PATCH  /api/v1/admin/homepage/sections/{id}/     — Edit section config
POST   /api/v1/admin/homepage/sections/reorder/  — Reorder sections

--- Save2Own Admin ---
GET    /api/v1/admin/save2own/             — All S2O goals
GET    /api/v1/admin/save2own/{id}/        — Goal detail
POST   /api/v1/admin/save2own/{id}/suspend/ — Suspend goal

--- Dovi Auto Admin ---
GET    /api/v1/admin/auto/listings/        — All auto listings
PATCH  /api/v1/admin/auto/listings/{id}/   — Edit listing
DELETE /api/v1/admin/auto/listings/{id}/   — Remove listing

--- Audit Logs ---
GET    /api/v1/admin/audit-logs/           — All audit logs
GET    /api/v1/admin/audit-logs/?user={id} — Logs filtered by user

--- Analytics ---
GET    /api/v1/admin/analytics/overview/   — Dashboard summary stats
GET    /api/v1/admin/analytics/sales/      — Sales analytics
GET    /api/v1/admin/analytics/orders/     — Order analytics
GET    /api/v1/admin/analytics/vendors/    — Vendor analytics
```

---

## PROJECT STRUCTURE

```
DOVI-2.0/
├── backend/                    (Person 1 owns this)
│   └── ...
│
├── frontend/                   (Person 2 owns this)
│   ├── src/
│   │   ├── api/                — Axios client + all API call functions
│   │   ├── assets/             — Static assets (icons, logos, fonts)
│   │   ├── components/         — Shared reusable components
│   │   │   ├── ui/             — Buttons, inputs, modals, badges, etc.
│   │   │   ├── layout/         — Header, Footer, Sidebar, NavBar
│   │   │   ├── product/        — ProductCard, ProductGallery, etc.
│   │   │   ├── cart/           — CartItem, CartSummary, etc.
│   │   │   └── common/         — Loading, Error, Empty, Pagination
│   │   ├── contexts/           — React Contexts (Auth, Cart, Notifications)
│   │   ├── hooks/              — Custom React hooks
│   │   ├── pages/              — One file per route/page
│   │   │   ├── Home/
│   │   │   ├── Auth/
│   │   │   ├── Products/
│   │   │   ├── Cart/
│   │   │   ├── Checkout/
│   │   │   ├── Orders/
│   │   │   ├── Dashboard/
│   │   │   ├── Save2Own/
│   │   │   └── Auto/
│   │   ├── router/             — Route definitions + guards
│   │   ├── stores/             — Zustand stores (if used)
│   │   ├── types/              — TypeScript interfaces + types
│   │   └── utils/              — Formatting, validation helpers
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── admin/                      (Person 3 owns this)
    ├── src/
    │   ├── api/                — Admin-scoped API calls
    │   ├── components/
    │   │   ├── ui/
    │   │   ├── layout/         — AdminSidebar, AdminHeader, etc.
    │   │   ├── tables/         — DataTable, SortableTable
    │   │   └── charts/         — Analytics charts
    │   ├── contexts/           — Admin Auth context
    │   ├── hooks/
    │   ├── pages/
    │   │   ├── Dashboard/
    │   │   ├── Users/
    │   │   ├── Vendors/
    │   │   ├── Products/
    │   │   ├── Categories/
    │   │   ├── Orders/
    │   │   ├── Payments/
    │   │   ├── Refunds/
    │   │   ├── Reviews/
    │   │   ├── Homepage/
    │   │   ├── Save2Own/
    │   │   ├── Auto/
    │   │   ├── Notifications/
    │   │   └── AuditLogs/
    │   ├── router/
    │   ├── types/
    │   └── utils/
    ├── index.html
    ├── vite.config.ts
    └── tsconfig.json
```

---

## PERSON 2 — FRONTEND FOUNDATION

### Week 1 Deliverables

#### Vite + React + TypeScript Setup
```
- [ ] npx create vite@latest frontend -- --template react-ts
- [ ] Configure path aliases (@/components, @/api, @/hooks, etc.)
- [ ] Configure environment variables (VITE_API_BASE_URL)
- [ ] Set up ESLint + Prettier
- [ ] Set up React Router v6 with route structure
- [ ] Set up Axios client with base URL + token interceptors
- [ ] Set up global error boundary
- [ ] Set up loading + skeleton components
- [ ] Set up empty state components
- [ ] Set up toast/notification system (react-hot-toast or similar)
- [ ] Set up responsive design system (breakpoints, typography, spacing)
- [ ] Set up mobile-first CSS baseline
```

#### Authentication Integration
```
- [ ] AuthContext — stores user, token, login, logout, isAuthenticated
- [ ] Token storage — httpOnly cookie (preferred) or memory. NOT localStorage for tokens.
- [ ] Access token refresh — automatic on 401 via Axios interceptor
- [ ] Session persistence — survive browser refresh
- [ ] Protected route wrapper — redirects unauthenticated users
- [ ] Buyer-only route protection — role check from /api/v1/users/me/
- [ ] Login page — POST /api/v1/auth/login/
- [ ] Register page — POST /api/v1/auth/register/
- [ ] Logout — POST /api/v1/auth/logout/ then clear local state
- [ ] Password reset flow — /api/v1/auth/password/reset/
- [ ] Email verification handling
```

#### API Client Pattern
```typescript
// src/api/client.ts
// Axios instance with:
// - baseURL: import.meta.env.VITE_API_BASE_URL
// - Authorization header injection from token
// - 401 interceptor → trigger token refresh
// - 403 interceptor → redirect to login or show access denied
// - Request ID header forwarding
// - Centralized error shape normalization

// src/api/auth.ts       — auth endpoints
// src/api/products.ts   — product endpoints
// src/api/cart.ts       — cart endpoints
// src/api/orders.ts     — order endpoints
// src/api/payments.ts   — payment endpoints
// src/api/reviews.ts    — review endpoints
// src/api/save2own.ts   — save2own endpoints
// src/api/auto.ts       — auto endpoints
// src/api/notifications.ts
// src/api/homepage.ts
// src/api/wishlist.ts
// src/api/admin.ts      — (for Person 3 use in admin app)
```

#### Error Handling Standards
```
Every API call must handle:
- Loading state   → show skeleton / spinner
- Success state   → render data
- Error state     → show error message from API response
- Empty state     → show empty state UI (no data found)

API error response shape (from Person 1):
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { ... }   // field-level validation errors
}

Display field-level errors beside their form inputs.
Display general errors in a toast or inline error banner.
Never swallow errors silently.
```

---

## PERSON 2 — HOMEPAGE & MARKETPLACE

### API Calls Used
```
GET /api/v1/homepage/              — Full homepage config
GET /api/v1/homepage/banners/      — Hero banners
GET /api/v1/homepage/sections/     — Sections + their content
GET /api/v1/products/flash-deals/
GET /api/v1/products/trending/
GET /api/v1/products/featured/
GET /api/v1/products/best-sellers/
GET /api/v1/products/new-arrivals/
GET /api/v1/products/top-rated/
GET /api/v1/products/budget-deals/
GET /api/v1/categories/
GET /api/v1/vendors/               — Featured vendors
```

### Homepage Sections (ALL database-driven, NO hardcoding)
```
- [ ] Hero Banner Carousel
        - Fetch from GET /api/v1/homepage/banners/
        - Auto-slide every N seconds (interval from API config)
        - Manual left/right navigation
        - Dot indicators
        - Mobile banner vs desktop banner (API returns separate URLs)
        - Lazy load images
        - Skeleton while loading

- [ ] Search Bar
        - Calls GET /api/v1/products/search/?q=...
        - Debounced input (300ms)
        - Shows suggestions dropdown
        - Navigates to /search?q=... on submit

- [ ] Popular Categories
        - Fetch from GET /api/v1/categories/
        - Horizontal scroll on mobile
        - Grid on desktop
        - Category icon + name

- [ ] Flash Deals       → GET /api/v1/products/flash-deals/
- [ ] Marketplace Feed  → GET /api/v1/products/ (general feed)
- [ ] Trending Now      → GET /api/v1/products/trending/
- [ ] Recommended       → GET /api/v1/products/ (with user context)
- [ ] Best Sellers      → GET /api/v1/products/best-sellers/
- [ ] Student Essentials → Section from /api/v1/homepage/sections/
- [ ] Featured Products → GET /api/v1/products/featured/
- [ ] Featured Vendors  → GET /api/v1/vendors/ (featured flag)
- [ ] New Arrivals      → GET /api/v1/products/new-arrivals/
- [ ] Top Rated         → GET /api/v1/products/top-rated/
- [ ] Budget Deals      → GET /api/v1/products/budget-deals/
- [ ] Recently Viewed   → GET /api/v1/recently-viewed/
- [ ] Buy With Confidence section (trust badges from API)
- [ ] Save2Own section (teaser/CTA)
- [ ] Dovi Auto section (teaser/CTA)

Section visibility, order, and title are all controlled by Admin (Person 3).
Sections disabled in admin must NOT render on homepage.
```

### Product Listing Page
```
Route:  /products
        /categories/:slug
        /search?q=...

API:
  GET /api/v1/products/
  GET /api/v1/categories/:slug/products/
  GET /api/v1/products/search/?q=...

Query params supported:
  ?page=1
  ?page_size=24
  ?category=slug
  ?q=search term
  ?sort=price_asc|price_desc|newest|rating
  ?min_price=...
  ?max_price=...
  ?vendor=id
  ?in_stock=true

UI Requirements:
  - [ ] Paginated product grid
  - [ ] Filter sidebar (desktop) / Filter drawer (mobile)
  - [ ] Sort dropdown
  - [ ] Price range filter
  - [ ] Category breadcrumb
  - [ ] Result count
  - [ ] Skeleton while loading
  - [ ] Empty state when no results
  - [ ] ProductCard component
        - Product image (from S3 URL in API response)
        - Product name
        - Price
        - Vendor name
        - Rating (stars + count)
        - Stock badge
        - Add to Cart button (calls POST /api/v1/cart/items/)
        - Wishlist toggle (calls POST/DELETE /api/v1/wishlist/)
```

---

## PERSON 2 — PRODUCT DISCOVERY

### Product Detail Page
```
Route:  /products/:id

API Calls:
  GET /api/v1/products/:id/
  GET /api/v1/products/:id/variants/
  GET /api/v1/products/:id/images/
  GET /api/v1/products/:id/reviews/
  GET /api/v1/vendors/:vendorId/          — vendor info section
  POST /api/v1/recently-viewed/           — record view

UI Requirements:
  - [ ] Image gallery
        - Thumbnail strip
        - Main image zoom on hover (desktop)
        - Swipe on mobile
        - Lazy load
        - Fallback image if URL fails

  - [ ] Product info
        - Full product name
        - Price (from API — do NOT add frontend discounts)
        - Stock status (from API)
        - SKU
        - Variant selector (size, color, etc.)
          → On variant change, call GET /api/v1/products/:id/variants/
          → Price updates from API response only
        - Add to Cart → POST /api/v1/cart/items/
        - Buy Now → add to cart then redirect to checkout
        - Wishlist toggle

  - [ ] Vendor section
        - Vendor name + logo
        - Vendor rating
        - Vendor location
        - Link to vendor store → /vendors/:id

  - [ ] Product ratings summary
        - Average rating
        - Rating breakdown (5★ → 1★ counts)

  - [ ] Reviews section
        - GET /api/v1/products/:id/reviews/
        - Review card: rating, text, verified badge, date
        - Pagination or load more
        - Submit review (if eligible — check GET /api/v1/reviews/eligibility/:order_ref/)

  - [ ] Related products
        - From API response (related_products field)

  - [ ] Recently viewed (horizontal scroll strip)
```

---

## PERSON 2 — CART & CHECKOUT

### Cart
```
Route:  /cart

State:  CartContext — synced with backend on every change

API Calls:
  GET    /api/v1/cart/                   — Load cart on mount
  POST   /api/v1/cart/items/             — Add item
  PATCH  /api/v1/cart/items/:id/         — Update quantity
  DELETE /api/v1/cart/items/:id/         — Remove item
  DELETE /api/v1/cart/clear/             — Clear cart
  POST   /api/v1/cart/validate/          — Validate before checkout

UI Requirements:
  - [ ] Cart item list
        - Product image + name + variant
        - Quantity stepper (PATCH on change)
        - Unit price (from API)
        - Line total (from API — NOT calculated on frontend)
        - Remove button
  - [ ] Cart summary (all figures from API)
        - Subtotal
        - Delivery estimate (if available)
        - Total
  - [ ] Stock warning if item qty exceeds available stock (from API validation)
  - [ ] Out-of-stock badge + disable checkout for out-of-stock items
  - [ ] Empty cart state
  - [ ] "Continue shopping" link
  - [ ] Proceed to checkout button → POST /api/v1/cart/validate/ first
```

### Checkout
```
Route:  /checkout

Flow:
  Step 1: Delivery address
    - Select saved address (GET /api/v1/users/me/addresses/)
    - Add new address (POST /api/v1/users/me/addresses/)
    - Address form with validation

  Step 2: Delivery method
    - Options returned from API (with prices)
    - Select delivery method

  Step 3: Payment method
    - GET /api/v1/payments/methods/
    - Options: Flutterwave, OPay
    - Render appropriate payment UI

  Step 4: Order review + confirm
    - Display full order summary (ALL amounts from API)
    - DO NOT calculate any total on frontend
    - Confirm button → POST /api/v1/checkout/:id/confirm/

Payment flow (Flutterwave):
  1. POST /api/v1/payments/initialize/
  2. Backend returns payment link / reference
  3. Open Flutterwave SDK/redirect
  4. User completes payment
  5. Flutterwave calls backend webhook (BACKEND handles this)
  6. Frontend polls GET /api/v1/payments/:ref/verify/ (or uses redirect callback)
  7. On success → redirect to /orders/:ref?status=success
  8. On failure → show failure UI with retry option

Payment flow (OPay):
  Same pattern as Flutterwave — backend abstraction layer handles differences.

Payment failure UI:
  - Clear failure message (from API)
  - "Retry payment" → POST /api/v1/payments/:ref/retry/
  - "Choose different method"
  - "Contact support"

NEVER:
  - Show payment as successful before backend confirms
  - Modify payment status from frontend
  - Trust frontend redirect params as authoritative payment proof
```

---

## PERSON 2 — ORDERS & TRACKING

### Order History
```
Route:  /dashboard/orders

API:    GET /api/v1/orders/
        GET /api/v1/orders/:ref/
        GET /api/v1/orders/:ref/tracking/

UI Requirements:
  - [ ] Order list
        - Order reference (DOV-ORD-XXXXX)
        - Order date
        - Order status badge
        - Order total (from API)
        - Number of items
        - Link to order detail

  - [ ] Order detail page
        - All order items (image, name, qty, price from API)
        - Order status timeline
        - Delivery address
        - Payment method used
        - Payment status
        - Tracking info (from GET /api/v1/orders/:ref/tracking/)
        - "Confirm receipt" button (when status = DELIVERED)
          → POST /api/v1/orders/:ref/confirm-receipt/
        - "Cancel order" button (when cancellable per API response)
          → POST /api/v1/orders/:ref/cancel/
        - "Request refund" link (when eligible per API)
        - "Leave a review" (when eligible per API)

Order Status States (from API):
  PENDING_PAYMENT
  PAID
  PROCESSING
  SHIPPED
  IN_TRANSIT
  DELIVERED
  RECEIVED
  COMPLETED
  CANCELLED
  REFUND_REQUESTED
  REFUND_REVIEW
  REFUNDED

Display each state clearly with color-coded badge and timeline.
```

### Refund Flow (Buyer)
```
Route:  /dashboard/refunds
        /dashboard/refunds/new/:order_ref

API:
  POST   /api/v1/refunds/               — Create refund request
  GET    /api/v1/refunds/               — List refunds
  GET    /api/v1/refunds/:id/           — Refund status
  POST   /api/v1/refunds/:id/evidence/  — Upload evidence

UI:
  - [ ] Select order to refund
  - [ ] Select reason (options from API)
  - [ ] Written explanation
  - [ ] Evidence upload (images)
  - [ ] Submit → POST /api/v1/refunds/
  - [ ] View refund status (PENDING / APPROVED / REJECTED / PROCESSED)
  - [ ] Display approval / rejection reason from API
  - [ ] Display completed refund confirmation
```

---

## PERSON 2 — BUYER DASHBOARD

```
Route:  /dashboard

Layout: Jumia-style sidebar navigation + main content area
        On mobile: bottom nav or hamburger drawer

Dashboard Pages:
  /dashboard                    — Overview (recent orders, notifications)
  /dashboard/profile            — Profile + avatar
  /dashboard/orders             — Order history
  /dashboard/orders/:ref        — Order detail
  /dashboard/wishlist           — Saved products
  /dashboard/recently-viewed    — Recent product views
  /dashboard/cart               — Cart (or redirect to /cart)
  /dashboard/save2own           — Save2Own goals
  /dashboard/reviews            — My reviews
  /dashboard/refunds            — Refund requests
  /dashboard/notifications      — All notifications
  /dashboard/addresses          — Saved addresses
  /dashboard/payment-methods    — Saved payment methods
  /dashboard/settings           — Account settings
  /dashboard/security           — Password, 2FA

All dashboard routes → protected (require authentication).
All data from API — zero hardcoded content.
```

---

## PERSON 2 — REVIEWS & TRUST

```
Review Submission:
  - [ ] Check eligibility: GET /api/v1/reviews/eligibility/:order_ref/
  - [ ] Only allow review if API says eligible (verified purchase)
  - [ ] Product rating (1–5 stars)
  - [ ] Vendor rating (1–5 stars)
  - [ ] Delivery rating (1–5 stars)
  - [ ] Written review text
  - [ ] Submit → POST /api/v1/reviews/
  - [ ] "Verified Purchase" badge on eligible reviews (from API field)
  - [ ] Edit review → PATCH /api/v1/reviews/:id/
  - [ ] Delete review → DELETE /api/v1/reviews/:id/
  - [ ] Review history in dashboard

Trust Indicators:
  - Verified Purchase badge (from API boolean field)
  - Vendor overall rating (from API)
  - Number of orders fulfilled (from API)
  - Response rate (from API)
```

---

## PERSON 2 — SAVE2OWN (BUYER UI)

```
Route:  /save2own
        /save2own/goals/:id
        /dashboard/save2own

API Calls:
  GET  /api/v1/save2own/goals/
  POST /api/v1/save2own/goals/
  GET  /api/v1/save2own/goals/:id/
  PATCH /api/v1/save2own/goals/:id/
  POST /api/v1/save2own/goals/:id/pause/
  POST /api/v1/save2own/goals/:id/resume/
  POST /api/v1/save2own/goals/:id/cancel/
  POST /api/v1/save2own/goals/:id/contribute/
  GET  /api/v1/save2own/goals/:id/contributions/
  POST /api/v1/save2own/goals/:id/checkout/
  GET  /api/v1/save2own/goals/:id/refund/

Create Goal flow:
  - [ ] Browse and select product
  - [ ] Select variant
  - [ ] Set contribution plan (amount or frequency — from API options)
  - [ ] Review target amount (from API — backend calculates)
  - [ ] Confirm and create → POST /api/v1/save2own/goals/

Goal Dashboard:
  - [ ] Goal card
        - Product image + name
        - Target amount (from API)
        - Total contributed (from API)
        - Remaining amount (from API)
        - Progress percentage (from API — do NOT calculate on frontend)
        - Target date (from API)
        - Goal status badge
        - Contribution history link
  - [ ] Actions
        - Make contribution → POST /api/v1/save2own/goals/:id/contribute/
          → Opens payment flow same as orders
        - Pause → POST /api/v1/save2own/goals/:id/pause/
        - Resume → POST /api/v1/save2own/goals/:id/resume/
        - Change product/variant → PATCH /api/v1/save2own/goals/:id/
        - Change quantity → PATCH /api/v1/save2own/goals/:id/
        - Cancel → POST /api/v1/save2own/goals/:id/cancel/
        - Checkout (goal complete) → POST /api/v1/save2own/goals/:id/checkout/

  - [ ] Contribution history
        - List of contributions: date, amount, payment status
        - All amounts from API — NEVER calculated on frontend

  - [ ] Goal state handling
        DRAFT              → Show "Activate" CTA
        ACTIVE             → Show contribute + progress
        PAUSED             → Show resume + progress
        COMPLETED          → Show checkout CTA
        CANCELLED          → Show history read-only
        PRODUCT_UNAVAILABLE → Show warning, prompt product change
        PRICE_CHANGED       → Show old target vs new target (from API)
        PAYMENT_REVIEW      → Show pending message
        REFUND_PENDING      → Show refund status
        SUSPENDED           → Show suspension message

IMPORTANT:
  Every financial figure shown is from the API.
  If the product price changes, the frontend shows BOTH old and new from API.
  Contribution history is never rewritten — API returns full immutable history.
```

---

## PERSON 2 — DELIVERY ROADMAP

### Week 1 — Foundation
```
- [ ] React + TypeScript + Vite project setup
- [ ] Routing structure (React Router v6)
- [ ] Axios API client with token interceptors
- [ ] AuthContext + session persistence
- [ ] Protected route wrapper
- [ ] Buyer-only route guard
- [ ] Error boundary
- [ ] Loading skeleton components
- [ ] Empty state components
- [ ] Toast notification system
- [ ] Responsive design system (mobile-first)
- [ ] Environment variable setup
```

### Week 2 — Homepage & Marketplace
```
- [ ] Homepage layout
- [ ] Hero banner carousel (from API)
- [ ] All homepage sections (from API — no hardcoding)
- [ ] Category grid
- [ ] Product listing page
- [ ] Search page
- [ ] Filters + sorting
- [ ] ProductCard component
- [ ] Pagination component
```

### Week 3 — Product Discovery
```
- [ ] Product detail page
- [ ] Image gallery
- [ ] Variant selector (price updates from API)
- [ ] Stock status display
- [ ] Add to Cart
- [ ] Wishlist toggle
- [ ] Vendor profile section
- [ ] Product reviews
- [ ] Recently viewed
- [ ] Related products
```

### Week 4 — Cart, Checkout, Orders
```
- [ ] Cart page (synced with backend)
- [ ] CartContext
- [ ] Checkout flow (multi-step)
- [ ] Address selection + form
- [ ] Delivery method selection
- [ ] Payment method selection
- [ ] Flutterwave integration
- [ ] OPay integration
- [ ] Payment success page
- [ ] Payment failure + retry
- [ ] Order confirmation page
- [ ] Order history page
- [ ] Order detail page
- [ ] Order tracking
- [ ] Confirm receipt
- [ ] Cancel order
```

### Week 5 — Buyer Dashboard & Trust
```
- [ ] Buyer dashboard layout (Jumia-style)
- [ ] Profile page
- [ ] Addresses management
- [ ] Payment methods
- [ ] Notification centre
- [ ] Wishlist
- [ ] Recently viewed
- [ ] Review submission
- [ ] Review history
- [ ] Refund request flow
- [ ] Refund status tracking
- [ ] Account settings
- [ ] Security settings
```

### Week 6 — Save2Own + Final Quality
```
- [ ] Save2Own goal creation
- [ ] Goal dashboard
- [ ] Contribution flow (payment integration)
- [ ] Progress display (all from API)
- [ ] Product change flow
- [ ] Pause / resume / cancel
- [ ] Goal completion + checkout
- [ ] Refund status in Save2Own
- [ ] Mobile testing all pages
- [ ] Desktop testing all pages
- [ ] Tablet testing all pages
- [ ] Browser refresh / session persistence test
- [ ] Slow network / API failure simulation
- [ ] Failed payment flow test
- [ ] Failed image loading fallback
- [ ] All loading + error + empty states verified
- [ ] No mock data in any page
```

---

## PERSON 3 — ADMIN SYSTEM

### Admin App Setup
```
- Separate Vite app in /admin directory
- Admin routes completely separate from buyer frontend
- Admin authentication: POST /api/v1/auth/login/ with admin role check
- Admin role verified on every request via /api/v1/users/me/
- If role is not ADMIN → redirect to login or show access denied
- All admin pages protected by AdminAuthGuard
```

### Admin Dashboard Overview
```
Route:  /admin
API:    GET /api/v1/admin/analytics/overview/

Widgets (all data from API):
  - [ ] Total users (count + new today)
  - [ ] Total vendors (count + pending approval)
  - [ ] Total orders (count + today's revenue)
  - [ ] Total payments (successful amount today/week/month)
  - [ ] Pending refunds (count)
  - [ ] Pending vendor approvals (count)
  - [ ] Active Save2Own goals (count)
  - [ ] Sales chart (from /api/v1/admin/analytics/sales/)
  - [ ] Recent orders list
  - [ ] Recent user registrations

Zero hardcoded figures. Every number from API.
```

### User Management
```
Route:  /admin/users

API:
  GET   /api/v1/admin/users/            — paginated list
  GET   /api/v1/admin/users/:id/        — user detail
  PATCH /api/v1/admin/users/:id/suspend/ — suspend
  PATCH /api/v1/admin/users/:id/activate/ — activate

UI:
  - [ ] Searchable, filterable user table
  - [ ] Columns: ID, name, email, role, status, joined, last login
  - [ ] View user detail
  - [ ] Suspend user (with confirmation modal)
  - [ ] Activate suspended user
  - [ ] View user's orders
  - [ ] View user's Save2Own goals
```

### Vendor Management
```
Route:  /admin/vendors

API:
  GET  /api/v1/admin/vendors/
  GET  /api/v1/admin/vendors/:id/
  POST /api/v1/admin/vendors/:id/approve/
  POST /api/v1/admin/vendors/:id/reject/
  POST /api/v1/admin/vendors/:id/suspend/

UI:
  - [ ] Vendor table with filters (status: pending/active/suspended)
  - [ ] Vendor detail page
        - Business name, registration docs
        - Verification documents (images from API)
        - Status history
  - [ ] Approve vendor → POST /api/v1/admin/vendors/:id/approve/
  - [ ] Reject vendor (reason required) → POST /api/v1/admin/vendors/:id/reject/
  - [ ] Suspend vendor → POST /api/v1/admin/vendors/:id/suspend/
  - [ ] View vendor products
  - [ ] View vendor orders
  - [ ] View vendor revenue (from analytics API)
```

### Product Management
```
Route:  /admin/products

API:
  GET   /api/v1/admin/products/
  PATCH /api/v1/admin/products/:id/
  POST  /api/v1/admin/products/:id/archive/

UI:
  - [ ] Product table (searchable, filterable by vendor/category/status)
  - [ ] Product detail view
  - [ ] Archive product
  - [ ] Edit product (limited admin edits — price, status)
```

### Category Management
```
Route:  /admin/categories

API:
  GET    /api/v1/admin/categories/
  POST   /api/v1/admin/categories/
  PATCH  /api/v1/admin/categories/:id/
  DELETE /api/v1/admin/categories/:id/

UI:
  - [ ] Category tree view
  - [ ] Create category (name, slug, parent, icon)
  - [ ] Edit category
  - [ ] Delete category (confirm if has products)
  - [ ] Reorder categories
```

### Order Management
```
Route:  /admin/orders

API:
  GET   /api/v1/admin/orders/
  GET   /api/v1/admin/orders/:ref/
  PATCH /api/v1/admin/orders/:ref/status/

UI:
  - [ ] Order table with search + status filter + date range filter
  - [ ] Order detail view
  - [ ] Manual status update (restricted transitions from API)
  - [ ] View associated payment
  - [ ] View associated refunds
```

### Payment Monitoring
```
Route:  /admin/payments

API:
  GET /api/v1/admin/payments/
  GET /api/v1/admin/payments/:ref/

UI:
  - [ ] Payment table (filter by provider/status/date)
  - [ ] Payment detail (full event log from API)
  - [ ] No manual payment manipulation — view only
```

### Refund Management
```
Route:  /admin/refunds

API:
  GET  /api/v1/admin/refunds/
  GET  /api/v1/admin/refunds/:id/
  POST /api/v1/admin/refunds/:id/approve/
  POST /api/v1/admin/refunds/:id/reject/

UI:
  - [ ] Refund queue (filter: PENDING / APPROVED / REJECTED)
  - [ ] Refund detail
        - Original order
        - Reason
        - Evidence images (from API URLs)
        - Timeline
  - [ ] Approve refund (with confirmation)
  - [ ] Reject refund (reason required)
  - [ ] After approval, backend processes via Payment Service
```

### Review Moderation
```
Route:  /admin/reviews

API:
  GET    /api/v1/admin/reviews/
  DELETE /api/v1/admin/reviews/:id/

UI:
  - [ ] Review table
  - [ ] Filter by product / vendor / rating
  - [ ] Read review
  - [ ] Remove review (with reason)
```

### Save2Own Monitoring (Admin)
```
Route:  /admin/save2own

API:
  GET  /api/v1/admin/save2own/
  GET  /api/v1/admin/save2own/:id/
  POST /api/v1/admin/save2own/:id/suspend/

UI:
  - [ ] All goals table (filterable by status)
  - [ ] Goal detail
        - Buyer info
        - Product info
        - All contributions (immutable history from API)
        - Current status
        - Timeline
  - [ ] Suspend goal (with reason)
  - [ ] View contribution payment history
```

### Audit Log Viewer
```
Route:  /admin/audit-logs

API:    GET /api/v1/admin/audit-logs/
        GET /api/v1/admin/audit-logs/?user=:id

UI:
  - [ ] Searchable / filterable log table
  - [ ] Columns: timestamp, actor, action, entity type, entity ID, IP, result
  - [ ] View-only — no edit capability
  - [ ] Filter by user, date range, action type
```

---

## PERSON 3 — HOMEPAGE MANAGEMENT

```
Route:  /admin/homepage

This is the ONLY place where homepage content is configured.
Frontend code for the buyer homepage must NOT be modified to change content.

--- BANNERS ---

API:
  GET    /api/v1/admin/homepage/banners/
  POST   /api/v1/admin/homepage/banners/
  PATCH  /api/v1/admin/homepage/banners/:id/
  DELETE /api/v1/admin/homepage/banners/:id/
  POST   /api/v1/admin/homepage/banners/:id/activate/
  POST   /api/v1/admin/homepage/banners/:id/deactivate/
  POST   /api/v1/admin/homepage/banners/reorder/

Banner fields:
  - Title
  - Subtitle
  - CTA text + link
  - Desktop image URL
  - Mobile image URL
  - Start date / end date (scheduled banners)
  - Active / inactive toggle
  - Sort order (drag-and-drop reorder)
  - Target URL

UI:
  - [ ] Banner list with drag-and-drop reorder
  - [ ] Create banner form
  - [ ] Edit banner form
  - [ ] Delete banner (confirm)
  - [ ] Activate / deactivate toggle
  - [ ] Scheduled activation (start/end date picker)
  - [ ] Preview (desktop + mobile)

--- HOMEPAGE SECTIONS ---

API:
  GET   /api/v1/admin/homepage/sections/
  PATCH /api/v1/admin/homepage/sections/:id/
  POST  /api/v1/admin/homepage/sections/reorder/

Section fields:
  - Section key (e.g., "flash_deals", "trending_now")
  - Display title (editable)
  - Visible (boolean toggle)
  - Sort order
  - Configuration (JSON from API — section-specific settings)

Sections managed:
  flash_deals
  marketplace_feed
  trending_now
  recommended
  best_sellers
  student_essentials
  featured_products
  featured_vendors
  new_arrivals
  top_rated
  budget_deals
  recently_viewed
  buy_with_confidence
  save2own
  dovi_auto

UI:
  - [ ] Section list with drag-and-drop reorder
  - [ ] Toggle visibility (show/hide section on homepage)
  - [ ] Edit section title
  - [ ] Save configuration → PATCH /api/v1/admin/homepage/sections/:id/
  - [ ] Changes reflect on buyer homepage immediately (no code change)
```

---

## PERSON 3 — SAVE2OWN (FULL MODULE)

Person 3 builds the Save2Own backend integration and admin monitoring.  
Person 2 builds the buyer-facing Save2Own UI (see Person 2 section above).

### Save2Own State Machine (displayed in admin)
```
States:
  DRAFT              — Goal created, not yet active
  ACTIVE             — Contributions being made
  PAUSED             — Buyer paused contributions
  COMPLETED          — Full target reached
  CANCELLED          — Buyer cancelled
  PRODUCT_UNAVAILABLE — Product pulled by vendor / admin
  PRICE_CHANGED       — Product price changed after goal creation
  PAYMENT_REVIEW      — Contribution payment under review
  REFUND_PENDING      — Refund in progress
  SUSPENDED           — Admin suspended goal

Valid transitions (enforced by backend):
  DRAFT        → ACTIVE
  ACTIVE       → PAUSED, CANCELLED, COMPLETED, PRODUCT_UNAVAILABLE, PRICE_CHANGED
  PAUSED       → ACTIVE, CANCELLED
  COMPLETED    → (checkout creates order)
  PRICE_CHANGED → ACTIVE (buyer acknowledges new price)
  PRODUCT_UNAVAILABLE → CANCELLED or new product selected
  PAYMENT_REVIEW → ACTIVE, REFUND_PENDING
  REFUND_PENDING → CANCELLED
  SUSPENDED    → admin can reactivate or cancel

CRITICAL RULE:
  Financial history is NEVER overwritten.
  When a product changes:
    - Old product remains in contribution history
    - New product recorded as a change event
    - Old target remains in history
    - New target recorded
    - All contributions remain immutable
  The API returns full, immutable contribution history.
  Admin can read the complete timeline of every goal.
```

---

## PERSON 3 — DOVI AUTO

Dovi Auto is a DEDICATED section of Dovi — NOT another marketplace category.  
It has its own navigation, pages, and domain structure.

### Auto Landing Page
```
Route:  /auto
        /auto/cars
        /auto/parts
        /auto/accessories
        /auto/rentals
        /auto/services

Navigation:
  - Dedicated "Dovi Auto" nav entry at top level
  - Sub-navigation: Cars | Parts | Accessories | Rentals | Services
  - Auto-branded header / colour scheme (distinct from main marketplace)
```

### Cars for Sale
```
Route:  /auto/cars
        /auto/cars/:id

API:
  GET /api/v1/auto/listings/
  GET /api/v1/auto/listings/:id/
  POST /api/v1/auto/favorites/
  DELETE /api/v1/auto/favorites/:id/

Search & Filter:
  - ?make=Toyota&model=Camry&year_from=2018&year_to=2024
  - ?fuel_type=petrol|diesel|electric|hybrid
  - ?transmission=automatic|manual
  - ?condition=new|used
  - ?min_price=&max_price=
  - ?location=

Listing Card:
  - [ ] Primary image
  - [ ] Make + Model + Year
  - [ ] Price
  - [ ] Mileage
  - [ ] Transmission
  - [ ] Fuel type
  - [ ] Location
  - [ ] Seller name
  - [ ] Favorite toggle

Listing Detail:
  - [ ] Image gallery (swipe on mobile)
  - [ ] Full vehicle specifications
        - Make, Model, Year
        - Mileage
        - Transmission
        - Fuel type
        - Condition
        - Colour
        - Engine size
        - Body type
        - VIN (if provided)
  - [ ] Price
  - [ ] Location
  - [ ] Seller profile + rating
  - [ ] Contact / Inquiry (API endpoint for inquiry)
  - [ ] Favorite toggle
  - [ ] Reviews section (GET /api/v1/auto/listings/:id/reviews/)
  - [ ] Similar listings
```

### Car Parts
```
Route:  /auto/parts
        /auto/parts/:id

API:
  GET /api/v1/auto/parts/
  GET /api/v1/auto/parts/:id/

Search & Filter:
  - ?q=search term
  - ?make=Toyota&model=Camry&year=2020
  - ?type=oem|aftermarket
  - ?condition=new|used
  - ?in_stock=true
  - ?min_price=&max_price=

Part Detail:
  - [ ] Part images
  - [ ] Part name + part number
  - [ ] OEM or Aftermarket badge
  - [ ] Vehicle compatibility list (make/model/year from API)
  - [ ] Condition
  - [ ] Stock quantity
  - [ ] Price (from API)
  - [ ] Vendor info
  - [ ] Add to Cart → POST /api/v1/cart/items/  (reuses core cart)
  - [ ] Compatibility check (buyer enters their vehicle → API verifies)
```

### Car Accessories
```
Route:  /auto/accessories
        /auto/accessories/:id

API:
  GET /api/v1/auto/accessories/
  GET /api/v1/auto/accessories/:id/

Categories:
  - Car electronics
  - Dashcams
  - Floor mats
  - Seat covers
  - Lighting
  - Interior accessories
  - Exterior accessories
  - Other

Accessories reuse standard product detail + cart flow.
```

### Auto Rentals
```
Route:  /auto/rentals
        /auto/rentals/:id
        /auto/rentals/bookings

API:
  GET  /api/v1/auto/rentals/
  GET  /api/v1/auto/rentals/:id/
  POST /api/v1/auto/rentals/:id/book/
  GET  /api/v1/auto/rentals/bookings/
  POST /api/v1/auto/rentals/bookings/:id/cancel/

Rental Listing Detail:
  - [ ] Vehicle images
  - [ ] Make + Model + Year
  - [ ] Rental rate (daily/weekly from API)
  - [ ] Availability calendar (from API)
  - [ ] Pickup location
  - [ ] Return location
  - [ ] Security deposit amount (from API)
  - [ ] Terms and conditions

Booking Flow:
  Step 1: Select dates + duration
  Step 2: Pickup/return location confirm
  Step 3: Review total (from API — never frontend-calculated)
  Step 4: Payment (same payment abstraction as orders)
  Step 5: Booking confirmation + reference

Booking Management:
  - [ ] View active bookings
  - [ ] View booking detail
  - [ ] Cancel booking (eligibility from API)
  - [ ] Cancellation refund status

Auto Checkout Rule:
  Auto purchases/rentals reuse the core Dovi payment and order infrastructure.
  No separate payment system for Auto.
  Auto-specific logic stays inside the Auto domain (backend).
```

### Auto Checkout Flow
```
Browse listing
  ↓
View detail + compatibility check
  ↓
Add to Cart OR Book (for rentals)
  ↓
Checkout (reuses core checkout flow)
  ↓
Payment (Flutterwave / OPay — same abstraction)
  ↓
Order / Booking created (backend)
  ↓
Delivery or Pickup arrangement
  ↓
Confirmation + tracking
  ↓
Confirm receipt / Return (rental)
  ↓
Review
```

### Admin — Dovi Auto Management
```
Route:  /admin/auto

API:
  GET    /api/v1/admin/auto/listings/
  PATCH  /api/v1/admin/auto/listings/:id/
  DELETE /api/v1/admin/auto/listings/:id/

UI:
  - [ ] All vehicle listings table
  - [ ] All parts listings table
  - [ ] All rental listings table
  - [ ] Edit / remove listing
  - [ ] View associated orders
  - [ ] View rental bookings
  - [ ] Manage auto vendors
```

---

## PERSON 3 — NOTIFICATIONS

### Notification Centre (Buyer)
```
Displayed in buyer dashboard at /dashboard/notifications

API:
  GET  /api/v1/notifications/              — All notifications (paginated)
  PATCH /api/v1/notifications/:id/read/    — Mark one as read
  POST /api/v1/notifications/read-all/     — Mark all as read
  GET  /api/v1/notifications/unread-count/ — Badge count

Notification types and their UI treatment:
  ORDER_CREATED          → "Your order DOV-ORD-XXXXX has been placed"
  PAYMENT_SUCCESSFUL     → "Payment confirmed for order DOV-ORD-XXXXX"
  PAYMENT_FAILED         → "Payment failed — retry now" [action button]
  ORDER_SHIPPED          → "Your order is on its way"
  ORDER_DELIVERED        → "Order delivered — confirm receipt" [action button]
  REFUND_REQUESTED       → "Refund request received"
  REFUND_APPROVED        → "Your refund has been approved"
  REFUND_REJECTED        → "Refund request rejected — see reason"
  SAVE2OWN_CONTRIBUTION  → "Contribution of ₦X recorded"
  SAVE2OWN_REMINDER      → "Don't forget your Save2Own goal"
  SAVE2OWN_TARGET_REACHED → "Goal complete! Checkout now" [action button]
  PRICE_CHANGED          → "Product price changed on your Save2Own goal"
  PRODUCT_UNAVAILABLE    → "A product in your Save2Own goal is unavailable"
  VENDOR_APPROVED        → (admin notification only)
  VENDOR_REJECTED        → (admin notification only)
  AUTO_BOOKING_CONFIRMED → "Your rental booking is confirmed"
  AUTO_BOOKING_CANCELLED → "Your rental booking has been cancelled"

Header bell icon:
  - Shows unread badge count (from /api/v1/notifications/unread-count/)
  - Dropdown preview of last 5 notifications
  - "View all" link to /dashboard/notifications
  - Clicking a notification marks it read and navigates to relevant page
  - Mark all read button
```

### Real-time Notifications (future)
```
Initial implementation: polling /api/v1/notifications/unread-count/ every 30s
Future: WebSocket or Server-Sent Events (when Person 1 implements)
```

---

## PERSON 3 — DELIVERY ROADMAP

### Week 1 — Admin Foundation
```
- [ ] Admin Vite app setup
- [ ] Admin routing
- [ ] Admin AuthContext + admin role guard
- [ ] Admin layout (sidebar + header)
- [ ] Admin dashboard overview (analytics widgets)
- [ ] User management page
- [ ] Vendor management + approval flow
- [ ] Product management page
- [ ] Category management page
```

### Week 2 — Homepage Management
```
- [ ] Hero banner CRUD
- [ ] Banner drag-and-drop reorder
- [ ] Banner schedule (start/end date)
- [ ] Banner activate/deactivate toggle
- [ ] Banner preview (desktop + mobile)
- [ ] Homepage sections list
- [ ] Section visibility toggle
- [ ] Section drag-and-drop reorder
- [ ] Section title edit
- [ ] Save configuration → API
```

### Week 3 — Save2Own Module
```
- [ ] Save2Own admin monitoring page
- [ ] Goal detail view (full history)
- [ ] Goal suspend action
- [ ] All states displayed and labeled clearly
- [ ] Contribution history (immutable, full timeline)
- [ ] Product change history (old and new recorded)
- [ ] Price change history (old and new recorded)
```

### Week 4 — Dovi Auto Foundation
```
- [ ] Auto landing page + navigation
- [ ] Car listings page
- [ ] Car listing detail page
- [ ] Image gallery
- [ ] Full vehicle specs display
- [ ] Search + advanced filters
- [ ] Favorites
- [ ] Reviews on listings
- [ ] Admin: auto listings management
```

### Week 5 — Parts, Accessories, Auto Checkout
```
- [ ] Car parts listing + detail
- [ ] Compatibility check UI
- [ ] Accessories listing + detail
- [ ] Parts + accessories add to cart (reuses core cart)
- [ ] Auto checkout (reuses core checkout flow)
- [ ] Auto delivery/pickup selection
- [ ] Admin: parts + accessories management
```

### Week 6 — Rentals, Notifications, Final Integration
```
- [ ] Rental listings + detail
- [ ] Availability calendar
- [ ] Booking flow
- [ ] Booking confirmation
- [ ] Cancellation flow
- [ ] Rental bookings dashboard
- [ ] Admin: rental + booking management
- [ ] Notification centre (buyer)
- [ ] Notification bell + badge in header
- [ ] Real-time count polling
- [ ] All notification types wired
- [ ] Admin: audit log viewer
- [ ] Admin: refund management
- [ ] Admin: review moderation
- [ ] End-to-end integration test checklist
```

### Final Integration Checklist (Person 3)
```
- [ ] Save2Own connected to payment APIs
- [ ] Save2Own connected to orders
- [ ] Save2Own connected to notifications
- [ ] Dovi Auto connected to payments
- [ ] Dovi Auto connected to orders
- [ ] Dovi Auto connected to delivery
- [ ] Admin connected to all management APIs
- [ ] Homepage connected to database
- [ ] Notifications connected to backend
- [ ] Audit logs verified
- [ ] End-to-end testing completed
```

---

## SHARED FRONTEND PATTERNS

### TypeScript Types Strategy
```typescript
// All API response types defined in src/types/
// Never use `any` for API responses
// Define exact shapes matching Person 1's API response

// Example:
interface Product {
  id: string;                    // UUID
  name: string;
  price: string;                 // Decimal from API — display as-is
  stock_quantity: number;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  vendor: VendorSummary;
  category: CategorySummary;
  images: ProductImage[];
  variants: ProductVariant[];
  average_rating: number;
  review_count: number;
}

interface APIError {
  error: true;
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

### Route Protection Pattern
```typescript
// Protected route for any authenticated user
<AuthGuard>
  <DashboardPage />
</AuthGuard>

// Protected route for buyers only
<RoleGuard role="BUYER">
  <CheckoutPage />
</RoleGuard>

// Protected route for admins only
<RoleGuard role="ADMIN">
  <AdminDashboard />
</RoleGuard>

// Role verified from GET /api/v1/users/me/ — not from localStorage
```

### Loading / Error / Empty States
```
Every data-fetching component must implement:

1. Skeleton state  — while API call is in-flight
2. Error state     — when API returns error (show message from API)
3. Empty state     — when API returns empty results
4. Success state   — when data is available

Never show stale data without indicating it is loading.
Never crash silently on API error.
```

### Financial Display Rules
```
NEVER:    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
ALWAYS:   Display the `total` field from the API response

NEVER:    const remaining = goal.target - goal.contributed
ALWAYS:   Display the `remaining_amount` field from the API response

NEVER:    const progress = (contributed / target) * 100
ALWAYS:   Display the `progress_percentage` field from the API response

All currency formatting:
  Format the number received from API.
  Example: "5000.00" → "₦5,000.00"
  Use Intl.NumberFormat with NGN locale.
  Do NOT invent totals, discounts, or balances.
```

### Media Handling
```
All product/vendor images come from S3-compatible object storage.
API returns full URLs in the response.
Never construct image URLs manually.
Always include:
  - alt text
  - fallback image on error (onError handler)
  - lazy loading (loading="lazy")
  - responsive sizes where appropriate
```

---

## DEFINITION OF DONE

A feature is COMPLETE only when ALL of the following are true:

```
Frontend:
  [ ] UI implemented and matches design
  [ ] Connected to real backend API (no mocks)
  [ ] All API calls use correct endpoint from contract
  [ ] Loading state implemented
  [ ] Error state implemented (shows API error message)
  [ ] Empty state implemented
  [ ] Mobile layout tested and working
  [ ] Desktop layout tested and working
  [ ] Tablet layout tested and working
  [ ] Browser refresh tested (session persists)

Data:
  [ ] No hardcoded products, users, prices, or orders
  [ ] No mock data in any production code path
  [ ] All financial figures come from API
  [ ] All permissions enforced by backend

Authentication & Authorization:
  [ ] Protected routes redirect unauthenticated users
  [ ] Role-based access enforced
  [ ] Auth state persists through refresh

Payments:
  [ ] Payment status only set by backend webhook
  [ ] Payment failure handled with retry option
  [ ] No payment secrets in frontend code

Testing:
  [ ] Slow network simulated (add 3G throttle in DevTools)
  [ ] API failure simulated (network offline)
  [ ] Failed payment flow tested
  [ ] Failed image load fallback tested

Code Quality:
  [ ] No TypeScript `any` for API data
  [ ] API types match Person 1's response contract
  [ ] No console.log left in production code
  [ ] No TODO comments that hide incomplete features

QA Sign-off:
  [ ] Tester 1 (backend/API) approved
  [ ] Tester 2 (frontend/UX) approved
  [ ] No open bugs blocking this feature
```

---

*This document is the authoritative reference for Person 2 and Person 3 on DOVI 2.0.*  
*Architecture decisions are NOT made by Antigravity. Antigravity implements the approved architecture.*  
*All API endpoints listed here are owned by Person 1. If an endpoint changes, Person 1 communicates the change and this document is updated.*
