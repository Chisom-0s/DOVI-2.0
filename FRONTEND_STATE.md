# DOVI 2.0 Frontend — Comprehensive Codebase Audit & State Document

> **Document Version:** 1.0.0  
> **Date:** August 31, 2026  
> **Auditor/Maintainer Role:** Sole Full-Stack & DevOps Engineer  
> **Scope:** Complete analysis of the `frontend/` application (with contextual references to `admin/` and backend APIs).

---

## 1. Project Overview

### Actual Tech Stack in Use
* **React:** `19.2.8` (React 19)
* **React DOM:** `19.2.8`
* **TypeScript:** `~6.0.2` (Strict mode configured in `tsconfig.json`)
* **Build Tool & Bundler:** Vite `^8.2.0` (with `@vitejs/plugin-react` `^6.0.5`)
* **Routing Library:** `react-router-dom` `^7.18.2` (using `createBrowserRouter` & `RouterProvider` data API)
* **State Management:**
  * **Global / Shared:** React Context API (`AuthContext`, `CartContext`, `WishlistContext`, `RecentlyViewedContext`)
  * **Session Tokens:** Access token stored exclusively in-memory (`tokenStore` singleton in `src/api/client.ts`), Refresh token handled via HTTP-only cookie set by Django.
  * **Local State:** React `useState`, `useReducer`, and `useEffect` hooks.
* **HTTP Client:** Axios `^1.19.0` (with interceptors for Bearer token injection, automated 401 refresh rotation, and 403 handling). *Note:* 4 component files make direct browser `fetch()` calls instead of using Axios.
* **Toast / Notifications:** `react-hot-toast` `^2.6.0`
* **CSS & Styling Approach:** Vanilla CSS using CSS Custom Properties (Design tokens defined in `src/index.css`) coupled with scoped inline style objects (`React.CSSProperties`) per component. No Tailwind CSS, no CSS Modules, no CSS-in-JS libraries (like styled-components or emotion).
* **UI Component Library:** **None.** 100% bespoke components with handcrafted inline SVGs.

### Project Structure (Actual Layout on Disk)
```
frontend/
├── .env                              # Active env variables (VITE_API_BASE_URL)
├── .env.example                      # Template env variables
├── .prettierrc                       # Prettier configuration
├── eslint.config.js                  # ESLint 9 configuration
├── index.html                        # Single-page application entry HTML & PWA manifest link
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript compiler options
├── vite.config.ts                    # Vite config with path aliases (@, @/api, @/components, etc.)
├── public/                           # Static assets, favicon, manifest
└── src/
    ├── main.tsx                      # App entry point (mounts AuthProvider, CartContext, AppRouter)
    ├── App.tsx                       # App component wrapper
    ├── global.d.ts                   # Ambient type definitions & Vite env declarations
    ├── react-env.d.ts                # Additional React 19 ambient declarations
    ├── styles/
    │   └── global.css                # Supplementary CSS rules
    ├── types/
    │   └── index.ts                  # Centralized TypeScript interface repository (680+ lines)
    ├── api/                          # Domain-driven API client modules
    │   ├── client.ts                 # Axios instance, interceptors, error normalizer
    │   ├── auth.ts                   # Authentication, registration, password recovery, me
    │   ├── products.ts               # Catalog, filters, search, variants, reviews
    │   ├── cart.ts                   # Cart operations (add, update, delete, validate)
    │   ├── checkout.ts               # Checkout sessions & delivery methods
    │   ├── orders.ts                 # Order history, detail, cancel, tracking
    │   ├── payments.ts               # Payment initiation, verification, retry
    │   ├── refunds.ts                # Refund dispute submission & evidence upload
    │   ├── reviews.ts                # Review submission & eligibility checks
    │   ├── save2own.ts               # Save2Own goal lifecycle & installment contributions
    │   ├── wishlist.ts               # Buyer wishlist CRUD
    │   ├── recently-viewed.ts        # Buyer recently viewed products
    │   ├── notifications.ts          # In-app notifications & unread counts
    │   ├── homepage.ts               # Homepage sections, banners & extensive mock fallback db
    │   └── auto.ts                   # Dovi Auto cars, parts, accessories & rentals
    ├── contexts/
    │   ├── AuthContext.tsx           # Authentication session & user state provider
    │   └── CartContext.tsx           # Real-time cart state, badge counter, drawer state
    ├── hooks/
    │   ├── useCookieConsent.ts       # GDPR cookie consent state & localStorage persistence
    │   └── usePWAInstall.ts          # PWA installation prompt trigger & analytics
    ├── components/
    │   ├── guards/
    │   │   ├── AuthGuard.tsx         # Route wrapper requiring valid authenticated session
    │   │   └── RoleGuard.tsx         # Role-based route gate (BUYER, VENDOR, ADMIN)
    │   ├── common/
    │   │   ├── ApiErrorMessage.tsx  # Consistent API failure presentation
    │   │   ├── CookieConsentBanner.tsx# Bottom banner for cookie acceptance
    │   │   ├── DoviSplashScreen.tsx  # Startup splash animation
    │   │   ├── EmptyState.tsx        # Standard zero-data placeholder
    │   │   ├── ErrorBoundary.tsx     # React component tree crash boundary
    │   │   ├── LoadingSpinner.tsx    # Branded SVG loader (inline & fullscreen)
    │   │   ├── PWAInstallPrompt.tsx  # Floating/banner PWA install prompt
    │   │   └── Skeleton.tsx          # Shimmer placeholder skeleton loaders
    │   ├── layout/
    │   │   ├── Header.tsx            # Sticky desktop/mobile header, search, user dropdown, cart badge
    │   │   ├── Footer.tsx            # Full site footer with marketplace links and policies
    │   │   └── MainLayout.tsx        # Shared app shell with header, footer, and mobile bottom nav
    │   ├── home/
    │   │   ├── HeroBannerCarousel.tsx# Auto-playing hero carousel
    │   │   ├── CategoryGrid.tsx      # Visual circular/card category grid
    │   │   └── SearchBar.tsx         # Live search input with category dropdown & history
    │   ├── product/
    │   │   ├── ProductCard.tsx       # Standard product card with wishlist & cart actions
    │   │   ├── ProductRow.tsx        # Horizontal scrolling container for product rows
    │   │   ├── ProductImageGallery.tsx# Detail image viewer with thumbnails & zoom
    │   │   ├── VariantSelector.tsx   # Color/size/attribute swatch selector
    │   │   ├── ProductSpecs.tsx      # Technical attribute table
    │   │   ├── ProductDescription.tsx# Formatted rich text description
    │   │   ├── CustomerReviews.tsx   # Rating breakdown & paginated review list
    │   │   ├── ReviewForm.tsx        # Modal/form for submitting ratings & photos
    │   │   ├── VendorSection.tsx     # Merchant card on product detail page
    │   │   └── ShareButtons.tsx      # Native & web social sharing links
    │   └── auto/
    │       └── AutoSubNav.tsx        # Sub-navigation bar for Dovi Auto marketplace
    ├── pages/
    │   ├── Auth/                     # Login, Register, Forgot Password, Reset Password, Email Verify
    │   ├── Home/                     # Dynamic homepage builder consumer
    │   ├── Products/                 # ProductListingPage, CategoryPage, SearchResultsPage, Detail/
    │   ├── Cart/                     # Full shopping cart page
    │   ├── Checkout/                 # Multi-step checkout & payment initialization
    │   ├── Payment/                  # Payment success & failure result handlers
    │   ├── Orders/                   # Order confirmation, order list, order tracking detail
    │   ├── Refunds/                  # Refund dispute request form & evidence timeline
    │   ├── Dashboard/                # Buyer account dashboard (Overview, Profile, Addresses, etc.)
    │   ├── Save2Own/                 # Save2Own marketplace, goal creation & milestone tracking
    │   ├── VendorDashboard/          # Merchant Hub (Overview, Products, Orders, Store Setup)
    │   └── Auto/                     # Dovi Auto (Cars, Parts, Accessories, Rentals, Bookings)
    └── router/
        └── index.tsx                 # Centralized React Router configuration
```

### Local Build & Execution Confirmation
* **Build Verification:** `npm run build` (`tsc && vite build`) executes **successfully with zero TypeScript or bundling errors**.
* **Local Run Verification:** `npm run dev` starts Vite instantly on port `5173`.
* **Prerequisites:** All npm dependencies are fully resolved in `package-lock.json`. Node.js 18+ or 20+ is required.

---

## 2. Backend Integration — Actual State

### API Client Configuration
* **Config File:** `frontend/src/api/client.ts`
* **Base URL Source:** `import.meta.env.VITE_API_BASE_URL`
* **Active Environment Setting:** `https://dovi-2-0-backend.onrender.com` (configured in `frontend/.env`)
* **Local Option:** Can be toggled to `http://localhost:8000` or `http://localhost:8001` for local Django testing.

### Complete Inventory of Called Endpoints

| # | Endpoint Called | HTTP Method | Frontend Caller File | Backend Status / Integration Type |
|---|---|---|---|---|
| 1 | `/api/v1/auth/login/` | `POST` | `src/api/auth.ts` | **Real Backend Fetch** — Sets access token in memory and refresh cookie |
| 2 | `/api/v1/auth/register/` | `POST` | `src/api/auth.ts` | **Real Backend Fetch** — Provisions `accounts.User` record |
| 3 | `/api/v1/auth/logout/` | `POST` | `src/api/auth.ts` | **Real Backend Fetch** — Clears server cookie & blacklists refresh token |
| 4 | `/api/v1/auth/token/refresh/` | `POST` | `src/api/auth.ts` | **Real Backend Fetch** — Cookie-based refresh rotation on app reload |
| 5 | `/api/v1/auth/password/reset/` | `POST` | `src/api/auth.ts` | **Real Backend Fetch** — Generates reset email token |
| 6 | `/api/v1/auth/password/reset/confirm/` | `POST` | `src/api/auth.ts` | **Real Backend Fetch** — Validates token and resets password |
| 7 | `/api/v1/auth/email/verify/` | `POST` | `src/api/auth.ts` | **Real Backend Fetch** — Validates email verification key |
| 8 | `/api/v1/users/me/` | `GET`, `PATCH`, `DELETE` | `src/api/auth.ts` | **Real Backend Fetch** — Retrieves & updates authenticated profile |
| 9 | `/api/v1/users/me/addresses/` | `GET`, `POST`, `PATCH`, `DELETE` | `src/api/auth.ts` | **Real Backend Fetch** |
| 10 | `/api/v1/users/me/change-password/` | `POST` | `src/api/auth.ts` | **Real Backend Fetch** |
| 11 | `/api/v1/users/me/payment-methods/` | `GET`, `DELETE` | `src/api/payments.ts` | **Real Backend Fetch** |
| 12 | `/api/v1/categories/` | `GET` | `src/components/home/CategoryGrid.tsx`, `src/pages/Products/ProductListingPage.tsx`, `src/pages/VendorDashboard/VendorProductManager.tsx` | **Real Backend Fetch** via direct browser `fetch()` |
| 13 | `/api/v1/categories/${slug}/` | `GET` | `src/pages/Products/CategoryPage.tsx` | **Real Backend Fetch** via direct browser `fetch()` |
| 14 | `/api/v1/products/` | `GET`, `POST` | `src/api/products.ts`, `src/pages/VendorDashboard/VendorProductManager.tsx` | **Real Backend Fetch** — Supports filtering, pagination & vendor creation |
| 15 | `/api/v1/products/my-products/` | `GET` | `src/pages/VendorDashboard/VendorProductManager.tsx` | **Real Backend Fetch** — Returns vendor's products |
| 16 | `/api/v1/products/${id}/` | `GET`, `PATCH`, `DELETE` | `src/api/products.ts`, `src/pages/VendorDashboard/VendorProductManager.tsx` | **Real Backend Fetch** |
| 17 | `/api/v1/products/${id}/variants/` | `GET` | `src/api/products.ts` | **Real Backend Fetch** |
| 18 | `/api/v1/products/${id}/reviews/` | `GET`, `POST` | `src/api/products.ts` | **Real Backend Fetch** |
| 19 | `/api/v1/products/${id}/related/` | `GET` | `src/api/products.ts` | **Real Backend Fetch** *(Endpoint returns 404 on backend; frontend warns & degrades)* |
| 20 | `/api/v1/products/search/` | `GET` | `src/api/products.ts` | **Broken Integration** — Backend lacks `/search/` route; expects `GET /api/v1/products/?search=query` |
| 21 | `/api/v1/products/featured/` | `GET` | `src/api/products.ts` | **Broken Integration** — Backend lacks specific named sub-route; evaluates `featured` as slug |
| 22 | `/api/v1/products/trending/` | `GET` | `src/api/products.ts` | **Broken Integration** — Backend lacks specific named sub-route |
| 23 | `/api/v1/products/new-arrivals/` | `GET` | `src/api/products.ts` | **Broken Integration** — Backend lacks specific named sub-route |
| 24 | `/api/v1/products/best-sellers/` | `GET` | `src/api/products.ts` | **Broken Integration** — Backend lacks specific named sub-route |
| 25 | `/api/v1/products/flash-deals/` | `GET` | `src/api/products.ts` | **Broken Integration** — Backend lacks specific named sub-route |
| 26 | `/api/v1/homepage/` | `GET` | `src/api/homepage.ts` | **Hybrid / Mock Fallback** — When 404 occurs, falls back to 500-line client mock database |
| 27 | `/api/v1/homepage/banners/` | `GET` | `src/api/homepage.ts` | **Hybrid / Mock Fallback** — When 404 occurs, falls back to empty list |
| 28 | `/api/v1/homepage/sections/` | `GET` | `src/api/homepage.ts` | **Hybrid / Mock Fallback** — When 404 occurs, falls back to mock sections |
| 29 | `/api/v1/cart/` | `GET` | `src/api/cart.ts` | **Real Backend Fetch** |
| 30 | `/api/v1/cart/items/` | `POST` | `src/api/cart.ts` | **Real Backend Fetch** |
| 31 | `/api/v1/cart/items/${id}/` | `PATCH`, `DELETE` | `src/api/cart.ts` | **Real Backend Fetch** |
| 32 | `/api/v1/cart/clear/` | `DELETE` | `src/api/cart.ts` | **Real Backend Fetch** |
| 33 | `/api/v1/cart/validate/` | `POST` | `src/api/cart.ts` | **Real Backend Fetch** |
| 34 | `/api/v1/checkout/` | `POST` | `src/api/checkout.ts` | **Real Backend Fetch** — Initializes checkout session |
| 35 | `/api/v1/checkout/${id}/` | `GET` | `src/api/checkout.ts` | **Real Backend Fetch** |
| 36 | `/api/v1/checkout/${id}/confirm/` | `POST` | `src/api/checkout.ts` | **Real Backend Fetch** |
| 37 | `/api/v1/checkout/delivery-methods/` | `GET` | `src/api/checkout.ts` | **Real Backend Fetch** |
| 38 | `/api/v1/orders/` | `GET` | `src/api/orders.ts` | **Real Backend Fetch** |
| 39 | `/api/v1/orders/${ref}/` | `GET` | `src/api/orders.ts` | **Real Backend Fetch** |
| 40 | `/api/v1/orders/${ref}/cancel/` | `POST` | `src/api/orders.ts` | **Real Backend Fetch** |
| 41 | `/api/v1/orders/${ref}/confirm-receipt/`| `POST` | `src/api/orders.ts` | **Real Backend Fetch** |
| 42 | `/api/v1/orders/${ref}/tracking/` | `GET` | `src/api/orders.ts` | **Real Backend Fetch** |
| 43 | `/api/v1/orders/vendor-orders/` | `GET` | `src/pages/VendorDashboard/VendorOrderManager.tsx` | **Real Backend Fetch** |
| 44 | `/api/v1/orders/vendor-orders/${id}/status/` | `PATCH` | `src/pages/VendorDashboard/VendorOrderManager.tsx` | **Real Backend Fetch** |
| 45 | `/api/v1/payments/methods/` | `GET` | `src/api/payments.ts` | **Real Backend Fetch** |
| 46 | `/api/v1/payments/initialize/` | `POST` | `src/api/payments.ts` | **Real Backend Fetch** |
| 47 | `/api/v1/payments/${ref}/verify/` | `GET` | `src/api/payments.ts` | **Real Backend Fetch** |
| 48 | `/api/v1/payments/${ref}/retry/` | `POST` | `src/api/payments.ts` | **Real Backend Fetch** |
| 49 | `/api/v1/refunds/` | `POST` | `src/api/refunds.ts` | **Real Backend Fetch** |
| 50 | `/api/v1/refunds/${id}/` | `GET` | `src/api/refunds.ts` | **Real Backend Fetch** |
| 51 | `/api/v1/refunds/${id}/evidence/` | `POST` | `src/api/refunds.ts` | **Real Backend Fetch** |
| 52 | `/api/v1/reviews/` | `GET`, `POST` | `src/api/reviews.ts` | **Real Backend Fetch** |
| 53 | `/api/v1/reviews/${id}/` | `PATCH`, `DELETE` | `src/api/reviews.ts` | **Real Backend Fetch** |
| 54 | `/api/v1/reviews/eligibility/${orderRef}/` | `GET` | `src/api/reviews.ts` | **Real Backend Fetch** |
| 55 | `/api/v1/save2own/goals/` | `GET`, `POST` | `src/api/save2own.ts` | **Real Backend Fetch** |
| 56 | `/api/v1/save2own/goals/${id}/` | `GET`, `PATCH` | `src/api/save2own.ts` | **Real Backend Fetch** |
| 57 | `/api/v1/save2own/goals/${id}/pause/` | `POST` | `src/api/save2own.ts` | **Real Backend Fetch** |
| 58 | `/api/v1/save2own/goals/${id}/resume/` | `POST` | `src/api/save2own.ts` | **Real Backend Fetch** |
| 59 | `/api/v1/save2own/goals/${id}/cancel/` | `POST` | `src/api/save2own.ts` | **Real Backend Fetch** |
| 60 | `/api/v1/save2own/goals/${id}/contribute/` | `POST` | `src/api/save2own.ts` | **Real Backend Fetch** |
| 61 | `/api/v1/save2own/goals/${id}/contributions/`| `GET` | `src/api/save2own.ts` | **Real Backend Fetch** |
| 62 | `/api/v1/save2own/goals/${id}/checkout/`| `POST` | `src/api/save2own.ts` | **Real Backend Fetch** |
| 63 | `/api/v1/wishlist/` | `GET`, `POST` | `src/api/wishlist.ts` | **Real Backend Fetch** |
| 64 | `/api/v1/wishlist/${id}/` | `DELETE` | `src/api/wishlist.ts` | **Real Backend Fetch** |
| 65 | `/api/v1/recently-viewed/` | `GET` | `src/api/recently-viewed.ts` | **Real Backend Fetch** |
| 66 | `/api/v1/notifications/` | `GET` | `src/api/notifications.ts` | **Real Backend Fetch** |
| 67 | `/api/v1/notifications/${id}/read/` | `PATCH` | `src/api/notifications.ts` | **Real Backend Fetch** |
| 68 | `/api/v1/notifications/read-all/` | `POST` | `src/api/notifications.ts` | **Real Backend Fetch** |
| 69 | `/api/v1/notifications/unread-count/`| `GET` | `src/api/notifications.ts` | **Real Backend Fetch** |
| 70 | `/api/v1/vendors/` | `POST` | `src/pages/VendorDashboard/VendorStoreSetup.tsx` | **Real Backend Fetch** — Submits merchant registration profile |
| 71 | `/api/v1/vendors/me/dashboard/` | `GET` | `src/pages/VendorDashboard/VendorDashboardOverview.tsx` | **Missing Backend Endpoint** — Backend has no vendor metrics aggregation endpoint |
| 72 | `/api/v1/auto/*` (all 9 endpoints) | `GET`, `POST` | `src/api/auto.ts` | **Missing Backend Module** — Backend has no `auto` models or views |

### Authentication Architecture
* **Login Flow:** User submits credentials to `POST /api/v1/auth/login/`.
* **Access Token:** Stored exclusively in RAM (`tokenStore.set(access)`). Attached to all subsequent outgoing Axios requests via `Authorization: Bearer <access_token>`.
* **Refresh Token:** Handled via HTTP-only cookie set by Django backend (`SameSite=Lax` / `Secure`).
* **Session Restoration:** On initial app mount, `AuthProvider` triggers `POST /api/v1/auth/token/refresh/` using browser cookies. If valid, a new access token is returned and `GET /api/v1/users/me/` populates the user state.
* **Token Rotation & 401 Interception:** Axios response interceptor catches 401 responses, pauses queue, requests a new access token, and retries the original request seamlessly.
* **Logout Flow:** `authApi.logout()` sends `POST /api/v1/auth/logout/` to blacklist the refresh token on the server, clears `tokenStore`, clears `AuthContext` state, and fires the `auth:logout` event.

---

## 3. Pages / Screens — Complete Inventory

### Group A: Authentication & Security
| Route | Component | Purpose | Status |
|---|---|---|---|
| `/login` | `LoginPage.tsx` | Email/password sign-in, redirect routing | **Fully Built & Wired** |
| `/register` | `RegisterPage.tsx` | Buyer account registration form | **Fully Built & Wired** |
| `/forgot-password` | `ForgotPasswordPage.tsx`| Password recovery request | **Fully Built & Wired** |
| `/reset-password` | `ResetPasswordPage.tsx` | Password reset confirmation with UID & token | **Fully Built & Wired** |
| `/verify-email` | `EmailVerificationPage.tsx`| Email verification code confirmation | **Fully Built & Wired** |

### Group B: Homepage & Marketplace Discovery
| Route | Component | Purpose | Status |
|---|---|---|---|
| `/` | `HomePage.tsx` | Dynamic hero carousel, flash deals, featured categories, curated rows | **Built with Mock Fallback** *(degrades to mock when `/homepage/` 404s)* |
| `/products` | `ProductListingPage.tsx` | Catalog grid, price range slider, category facets, sorting | **Fully Built & Wired** *(Calls `/api/v1/products/`)* |
| `/categories/:slug` | `CategoryPage.tsx` | Products filtered by category | **Partially Built / Broken** *(Fails if slug is passed instead of UUID)* |
| `/search` | `SearchResultsPage.tsx` | Search results query view | **Partially Built / Broken** *(Calls `/products/search/` which 404s)* |
| `/products/:id` | `ProductDetailPage.tsx` | Full product view, gallery, variants, specs, reviews, add-to-cart | **Fully Built & Wired** |
| `/vendors/:id` | `Placeholder` | Public vendor storefront | **Not Started** *(Placeholder screen)* |
| `/faq`, `/contact`, `/terms`| `Placeholder` | Static informational pages | **Not Started** *(Placeholder screens)* |

### Group C: Cart, Checkout & Payments
| Route | Component | Purpose | Status |
|---|---|---|---|
| `/cart` | `CartPage.tsx` | Shopping cart drawer/table, item totals, stock validation, checkout button | **Fully Built & Wired** |
| `/checkout` | `CheckoutPage.tsx` | Step 1: Address selection, delivery method selection, session init | **Fully Built & Wired** |
| `/checkout/:id` | `CheckoutSessionPage.tsx` | Step 2: Order breakdown, gateway selection (Paystack / Flutterwave) | **Fully Built & Wired** |
| `/payment/success` | `PaymentSuccessPage.tsx` | Payment confirmation & verification status | **Fully Built & Wired** |
| `/payment/failed` | `PaymentFailedPage.tsx` | Payment failure alert with one-click retry | **Fully Built & Wired** |

### Group D: Orders & Disputes
| Route | Component | Purpose | Status |
|---|---|---|---|
| `/orders/:ref` | `OrderConfirmationPage.tsx`| Post-checkout summary with order reference number | **Fully Built & Wired** |
| `/dashboard/orders` | `OrderHistoryPage.tsx` | Paginated past orders list with status badges | **Fully Built & Wired** |
| `/dashboard/orders/:ref` | `OrderDetailPage.tsx` | Timeline tracker, itemized receipt, dispute & review buttons | **Fully Built & Wired** |
| `/dashboard/refunds` | `RefundRequestPage.tsx` | Form to request refund / return on eligible orders | **Fully Built & Wired** |
| `/dashboard/refunds/:id` | `RefundDetailPage.tsx` | Refund dispute timeline & image evidence uploader | **Fully Built & Wired** |

### Group E: Buyer Dashboard
| Route | Component | Purpose | Status |
|---|---|---|---|
| `/dashboard` | `DashboardOverviewPage.tsx`| Metrics summary, latest orders, notifications widget | **Fully Built & Wired** |
| `/dashboard/profile` | `ProfilePage.tsx` | Edit name, email, phone, addresses & avatar | **Fully Built & Wired** |
| `/dashboard/addresses` | `AddressesPage.tsx` | Manage multiple saved shipping addresses | **Fully Built & Wired** |
| `/dashboard/payment-methods`| `PaymentMethodsPage.tsx`| Manage saved debit cards & payment options | **Fully Built & Wired** |
| `/dashboard/wishlist` | `WishlistPage.tsx` | Saved products list with quick add-to-cart | **Fully Built & Wired** |
| `/dashboard/recently-viewed`| `RecentlyViewedPage.tsx`| Browsing history shelf | **Fully Built & Wired** |
| `/dashboard/reviews` | `MyReviewsPage.tsx` | Past reviews left by the user | **Fully Built & Wired** |
| `/dashboard/notifications` | `NotificationsPage.tsx` | In-app notification center | **Fully Built & Wired** |
| `/dashboard/settings` | `AccountSettingsPage.tsx`| Change password, preferences, deactivate account | **Fully Built & Wired** |
| `/dashboard/security` | `SecuritySettingsPage.tsx`| Two-factor authentication & active sessions | **Partially Built** *(2FA UI built; backend endpoints stubbed)* |

### Group F: Save2Own (Installment Savings)
| Route | Component | Purpose | Status |
|---|---|---|---|
| `/dashboard/save2own` | `Save2OwnGoalsPage.tsx` | Active savings targets, progress bars, milestones | **Fully Built & Wired** |
| `/save2own` | `Save2OwnCreateGoalPage.tsx`| Goal calculator, installment scheduler, product selector | **Fully Built & Wired** |
| `/save2own/goals/:id` | `Save2OwnGoalDetailPage.tsx`| Contribution logs, deposit modal, pause/cancel/checkout triggers | **Fully Built & Wired** |

### Group G: Vendor Dashboard (Merchant Hub)
| Route | Component | Purpose | Status |
|---|---|---|---|
| `/vendor/dashboard` (unregistered)| `VendorStoreSetup.tsx` | Store registration onboarding form | **Fully Built & Wired** |
| `/vendor/dashboard` (pending review)| `VendorDashboardLayout.tsx`| Verification pending holding screen | **Fully Built & Wired** |
| `/vendor/dashboard` (approved) | `VendorDashboardOverview.tsx`| Store analytics, revenue graph, orders summary | **Built with Mock Fallback** *(No backend `/vendors/me/dashboard/`)* |
| `/vendor/dashboard/products` | `VendorProductManager.tsx`| Vendor catalog manager, create/edit/delete products | **Fully Built & Wired** *(Calls `/products/my-products/`)* |
| `/vendor/dashboard/orders` | `VendorOrderManager.tsx` | Order fulfillment board (dispatch/ship status updates)| **Fully Built & Wired** |

### Group H: Dovi Auto & Rentals
| Route | Component | Purpose | Status |
|---|---|---|---|
| `/auto` | `AutoLandingPage.tsx` | Automotive marketplace landing | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/cars` | `CarListingsPage.tsx` | Vehicle search & filtering | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/cars/:id` | `CarDetailPage.tsx` | Car specifications & dealer contact | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/parts` | `PartListingsPage.tsx` | Auto parts catalog | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/parts/:id` | `PartDetailPage.tsx` | Part specifications & fitment check | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/accessories` | `AccessoryListingsPage.tsx` | Car accessories catalog | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/accessories/:id` | `AccessoryDetailPage.tsx`| Accessory detail view | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/rentals` | `RentalListingsPage.tsx` | Car rental directory & date filters | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/rentals/:id` | `RentalDetailPage.tsx` | Rental booking pricing & terms | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/rentals/confirmation`| `RentalConfirmationPage.tsx`| Rental booking reservation voucher | **Built with Mock Data** *(Backend `/auto/` does not exist)* |
| `/auto/rentals/bookings` | `MyRentalsPage.tsx` | Buyer rental booking management | **Built with Mock Data** *(Backend `/auto/` does not exist)* |

---

## 4. What Is Fully Working End-to-End

The following flows have been tested and verified against the live PostgreSQL/Django backend:
1. **User Authentication Lifecycle:**
   - Registration (`POST /api/v1/auth/register/`)
   - Login (`POST /api/v1/auth/login/`)
   - Session Restoration via HTTP-Only Refresh Cookie (`POST /api/v1/auth/token/refresh/`)
   - Current user profile retrieval (`GET /api/v1/users/me/`)
   - Logout (`POST /api/v1/auth/logout/`)
2. **Product Catalog Listing & Detail:**
   - Browsing products with server-side pagination and sorting (`GET /api/v1/products/`)
   - Category tree retrieval (`GET /api/v1/categories/`)
   - Single product detail retrieval (`GET /api/v1/products/{id}/`)
3. **Cart Operations:**
   - Adding products/variants to the server-backed cart (`POST /api/v1/cart/items/`)
   - Updating quantities (`PATCH /api/v1/cart/items/{id}/`)
   - Deleting items & clearing cart (`DELETE /api/v1/cart/items/{id}/`)
4. **Checkout & Order Placement:**
   - Creating a checkout session with shipping address (`POST /api/v1/checkout/`)
   - Order confirmation and reference generation (`POST /api/v1/checkout/{id}/confirm/`)
   - Viewing past orders in the buyer dashboard (`GET /api/v1/orders/`)
5. **Save2Own Installments:**
   - Initializing a target savings goal (`POST /api/v1/save2own/goals/`)
   - Goal progress calculations and status viewing (`GET /api/v1/save2own/goals/`)
6. **Vendor Store Setup & Product Listing:**
   - Registering a new vendor profile (`POST /api/v1/vendors/`)
   - Creating products as an approved vendor (`POST /api/v1/products/`)
   - Listing vendor-specific products (`GET /api/v1/products/my-products/`)

---

## 5. What Is Built But Not Connected or Not Verified

1. **Dovi Auto & Rentals Module (11 pages):**
   - The complete user interface for cars, parts, accessories, rental date picker, and booking flow is built in `src/pages/Auto/`.
   - **Status:** Not connected because `/api/v1/auto/` has no backend counterpart in Django. All API requests return 404s.
2. **Dynamic Homepage Builder Backend Endpoint:**
   - The frontend `HomePage.tsx` is built to dynamically render sections based on `GET /api/v1/homepage/`.
   - **Status:** Because `/api/v1/homepage/` returns 404 on the backend, the frontend currently relies on its built-in fallback mock database (`src/api/homepage.ts`).
3. **Vendor Dashboard Analytics Metrics (`/api/v1/vendors/me/dashboard/`):**
   - `VendorDashboardOverview.tsx` has UI widgets for total revenue, daily earnings, and conversion rate.
   - **Status:** Unverified against live data; falls back to calculated values from local product/order queries.
4. **Security Settings 2FA / Session Termination:**
   - `SecuritySettingsPage.tsx` has UI for enabling Two-Factor Authentication and revoking active device sessions.
   - **Status:** Purely frontend presentation; backend does not yet support multi-factor auth tokens.
5. **Order Tracking Carrier Map:**
   - `OrderDetailPage.tsx` renders a step-by-step progress timeline. Real-time GPS/carrier integration is simulated based on order status (`PENDING -> SHIPPED -> DELIVERED`).

---

## 6. Known Bugs, Placeholders, and Technical Debt

### Broken Endpoints / Query Mismatches
1. **Search Endpoint Mismatch (`src/api/products.ts:39`):**
   - Frontend calls `GET /api/v1/products/search/?q=...`.
   - Django backend catalog URLs do not declare a `search/` sub-route; Django REST Framework uses `GET /api/v1/products/?search=...`. Django resolves `search` as a product slug and returns `404 Not Found`.
2. **Named Curated Product Collections (`src/api/products.ts:46-107`):**
   - `productsApi.featured()`, `trending()`, `newArrivals()`, `bestSellers()`, `flashDeals()`, `budgetDeals()`, `topRated()` attempt to call endpoints like `/api/v1/products/featured/`.
   - Backend has no such explicit routes; it expects query parameters like `?is_featured=true`. All these calls currently return 404.
3. **Category Slug vs UUID in `CategoryPage.tsx:30`:**
   - `CategoryPage` passes `category: slug` (e.g. `category: "sports-outdoors"`).
   - Backend `ProductViewSet` filter backend validates `category` strictly as a UUID primary key, returning `400 Bad Request: "sports-outdoors" is not a valid UUID.`
4. **Product Related Items (`src/api/products.ts:140`):**
   - Calls `GET /api/v1/products/{id}/related/` which is not mapped on backend `urls.py`.

### Direct `fetch()` Inconsistencies (Bypassing Axios)
Four components use raw browser `fetch()` rather than the configured `apiClient`:
* `src/pages/Products/ProductListingPage.tsx:28`
* `src/pages/Products/CategoryPage.tsx:21`
* `src/pages/VendorDashboard/VendorProductManager.tsx:52`
* `src/components/home/CategoryGrid.tsx:28`
* **Risk:** Direct `fetch()` calls do not pass the Authorization Bearer header, do not participate in automated 401 refresh token retry, and do not pass through standard error normalization.

### Logging Noise & Console Statements
* `src/api/client.ts` logs full raw Axios errors and JSON payloads on lines 117-120.
* 40+ component files contain direct `console.error` and `console.warn` statements.
* `src/hooks/usePWAInstall.ts` contains extensive `console.log` analytics statements.

### Placeholders in Route Tree
* In `src/router/index.tsx`, the following routes render an unstyled `<Placeholder name="..." />` component:
  * `/vendors/:id` (Vendor Public Profile)
  * `/faq` (Frequently Asked Questions)
  * `/contact` (Contact & Support)
  * `/terms` (Terms of Service)

### Unused Code & Bundler Warnings
* Vite build outputs a bundle size warning: `dist/assets/index-DkspJ4yA.js` is `842 kB` minified (`200 kB` gzip). Dynamic code splitting via React `lazy()` / `Suspense` has not been implemented for secondary routes.

---

## 7. Styling & Design System State

* **Design System Tokens:** Defined in `src/index.css` under the `:root` pseudo-class. Tokens include:
  * Colors: `--color-primary` (`#ff7a00`), `--color-primary-dark`, `--color-bg-dark` (`#0f172a`), `--color-surface` (`#1e293b`), `--color-border` (`#334155`), `--color-text` (`#f8fafc`).
  * Typography: `--font-sans` (`Inter, system-ui, sans-serif`), standard scale from `--text-xs` to `--text-4xl`.
  * Spacing & Borders: `--space-1` to `--space-16`, `--radius-sm` to `--radius-full`.
* **Implementation Uniformity:**
  * Styling is implemented via scoped `React.CSSProperties` object literals at the bottom of each TSX component file, consuming the CSS variables (e.g. `color: 'var(--color-text)'`).
  * Design aesthetics are cohesive (dark modern marketplace theme with orange brand accent and subtle glassmorphism).
* **Responsive / Mobile Behavior:**
  * Layout includes desktop/mobile breakpoint helpers (`.hide-mobile`, `.hide-desktop`, `@media (max-width: 768px)`).
  * Navigation shifts from a top horizontal bar on desktop to a bottom fixed tab bar (`MainLayout.tsx`) on mobile.
  * Mobile viewports (360px - 414px) are functional with horizontal scroll trays for categories and dashboard tabs.

---

## 8. Environment & Deployment State

* **Environment Configuration:**
  * Located at `frontend/.env`.
  * Contains `VITE_API_BASE_URL=https://dovi-2-0-backend.onrender.com`.
  * Sample template provided in `frontend/.env.example`.
* **Current Deployment Status:**
  * **Live Backend:** Hosted on Render at `https://dovi-2-0-backend.onrender.com` (PostgreSQL hosted on Neon, Redis hosted on Upstash).
  * **Frontend Production Deployment:** Currently **not deployed to production hosting** (e.g. Vercel, Netlify, Cloudflare Pages, or Render Static Sites). Runs locally via Vite development server on `http://localhost:5173`.

---

## 9. Testing Coverage

* **Unit Tests:** **None** (0% coverage).
* **Integration Tests:** **None** (0% coverage).
* **End-to-End (E2E) Tests:** **None** (0% coverage).
* **Test Runners / Infrastructure:** No testing libraries (`vitest`, `jest`, `@testing-library/react`, `playwright`, `cypress`) are installed in `package.json`.
* **Quality Assurance in Place:** TypeScript compiler check (`tsc --noEmit`), ESLint linting (`npm run lint`), and manual browser runtime validation.

---

## 10. Outstanding Items / Roadmap Gap Analysis

Cross-referencing the original buyer-facing marketplace and vendor scope:

| Roadmap Area | Original Specification | Current Codebase Status | Remaining Work Required |
|---|---|---|---|
| **Auth & Profiles** | Login, Registration, JWT, Profile Edit, Address Book | **100% Complete** | None |
| **Product Discovery** | Catalog Grid, Filters, Detail Page, Variants, Gallery | **85% Complete** | Fix `/search/` route mismatch and category UUID vs slug lookup |
| **Cart & Checkout** | Cart state, delivery methods, multi-step checkout, payment gateway hooks | **95% Complete** | Live webhook validation testing for Paystack/Flutterwave |
| **Buyer Dashboard** | Orders, Wishlist, Notifications, Reviews, Addresses | **95% Complete** | Connect real 2FA backend if required |
| **Save2Own UI** | Goal creation, installment calculation, deposits, milestone tracker | **90% Complete** | End-to-end payment gateway callback verification |
| **Merchant Hub** | Store onboarding, product manager, order status fulfillment | **85% Complete** | Build backend metrics endpoint for dashboard overview |
| **Public Storefronts** | Vendor profile page (`/vendors/:id`) | **0% Complete** | Replace placeholder with vendor store component |
| **Dovi Auto & Rentals** | Automotive marketplace & car rental bookings | **0% (Backend) / 100% (Frontend UI)** | Build `apps.auto` backend app or remove frontend routes if out of scope |
| **Information Pages** | FAQ, Terms of Service, Contact Support | **0% Complete** | Build static content pages |
| **Code Splitting** | Lazy loading route bundles | **0% Complete** | Wrap routes in `React.lazy()` and `Suspense` |
| **Automated Testing** | Unit and integration test suite | **0% Complete** | Set up Vitest + React Testing Library |

---

### Maintainer's Priority Action Plan
1. **Fix Products API Query Parameters:** Update `src/api/products.ts` so `search` calls `/api/v1/products/?search=...` and category filtering passes the category UUID rather than the slug.
2. **Replace Direct `fetch()` Calls:** Refactor the 4 raw `fetch()` calls in `CategoryGrid`, `CategoryPage`, `ProductListingPage`, and `VendorProductManager` to use `apiClient`.
3. **Decide Scope on Dovi Auto:** Either implement `apps/auto` on the Django backend or disable the `/auto` navigation links until the core marketplace is launched.
4. **Deploy Frontend:** Set up CI/CD pipeline deploying the `frontend/dist` build to Vercel, Netlify, or Cloudflare Pages with `VITE_API_BASE_URL` pointing to Render.
