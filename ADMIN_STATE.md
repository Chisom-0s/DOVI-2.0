# DOVI 2.0 Admin Dashboard — State of the Codebase Audit

**Document Date:** August 31, 2026  
**Auditor:** Antigravity AI  
**Scope:** Admin Dashboard Application (`/home/victor/Desktop/DOVI-2.0/admin`) & Backend Alignment  
**Tone:** Unfiltered, empirical, zero assumptions, completely candid.

---

## 1. Project Overview

### Tech Stack
| Layer | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `^19.2.8` | Same major version as the main marketplace frontend. |
| **Language** | TypeScript | `~6.0.2` | Strict typing with project reference configs (`tsconfig.app.json`, `tsconfig.node.json`). |
| **Bundler & Dev Server** | Vite | `^8.2.0` | Fast dev server and Rolldown-backed build tool. |
| **Routing** | React Router DOM | `^7.18.2` | Declarative JSX `<BrowserRouter>` and `<Routes>` tree. |
| **HTTP Client** | Axios | `^1.19.0` | Dedicated client instance with automatic JWT 401 token refresh interceptor. |
| **Notifications** | React Hot Toast | `^2.6.0` | Global toaster rendered at root. |
| **Linter** | Oxlint | `^1.75.0` | High-performance Rust-based linter. |
| **CSS & Styling** | Vanilla CSS + Inline Style Tokens | N/A | No Tailwind CSS; uses custom design tokens in `index.css` and scoped inline React styles. |

### Physical Location on Disk
* **Absolute Path:** `/home/victor/Desktop/DOVI-2.0/admin`
* **Architecture Relationship:** It is a standalone Single Page Application (SPA) living as a dedicated subdirectory inside the main `DOVI-2.0` multi-app monorepo alongside `/home/victor/Desktop/DOVI-2.0/frontend`. It maintains its own independent `package.json`, `node_modules`, `tsconfig.json`, and `vite.config.ts`.

### Local Execution & Port Configuration
* **Clean Build & Startup:** `npm install && npm run dev` runs cleanly with **0 TypeScript and 0 bundler errors** (`tsc -b && vite build` completes in ~600ms).
* **Port:** Runs on **`http://localhost:5174`**.
* **Why Port 5174:** Configured explicitly in `admin/vite.config.ts` (`server: { port: 5174, open: true }`) to prevent port collision with the main marketplace frontend, which occupies `http://localhost:5173`.

---

## 2. Backend Integration — Actual State

### Configured API Base URL
* Configured in `admin/.env`:
  ```env
  VITE_API_BASE_URL=https://dovi-2-0-backend.onrender.com
  ```

### Complete Endpoint Inventory Called by Admin App
The following table details every single network call initiated by the admin dashboard codebase, the calling file/line, and its status against the live backend (`https://dovi-2-0-backend.onrender.com`):

| Calling File & Function | Frontend Endpoint Called | Actual Backend Route | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `src/api/client.ts:84` | `POST /api/v1/auth/token/refresh/` | `/api/v1/auth/token/refresh/` | **LIVE (200)** | Uses Django httpOnly refresh cookie. |
| `src/api/auth.ts:7` | `POST /api/v1/auth/login/` | `/api/v1/auth/login/` | **LIVE (200)** | Authenticates admin credentials. |
| `src/api/auth.ts:17` | `POST /api/v1/auth/logout/` | `/api/v1/auth/logout/` | **LIVE (200)** | Clears session cookie and access token. |
| `src/api/auth.ts:27` | `GET /api/v1/users/me/` | `/api/v1/users/me/` | **LIVE (200)** | Retrieves current user profile & role. |
| `src/api/admin.ts:218` | `GET /api/v1/admin/analytics/overview/` | *None* | **BROKEN (404)** | Backend has no analytics app or endpoint. |
| `src/api/admin.ts:228` | `GET /api/v1/admin/users/` | `/api/v1/admin/users/` | **LIVE (200)** | Lists all users with pagination and search. |
| `src/api/admin.ts:237` | `GET /api/v1/admin/users/{id}/` | `/api/v1/admin/users/<uuid>/` | **LIVE (200)** | Retrieves user details. |
| `src/api/admin.ts:246` | `PATCH /api/v1/admin/users/{id}/suspend/` | `/api/v1/admin/users/<uuid>/suspend/` | **LIVE (200)** | Suspends user account. |
| `src/api/admin.ts:255` | `PATCH /api/v1/admin/users/{id}/activate/` | `/api/v1/admin/users/<uuid>/activate/` | **LIVE (200)** | Activates user account. |
| `src/api/admin.ts:265` | `GET /api/v1/admin/vendors/` | `/api/v1/admin/vendors/` | **LIVE (200)** | Lists vendor store profiles. |
| `src/api/admin.ts:274` | `GET /api/v1/admin/vendors/{id}/` | `/api/v1/admin/vendors/<uuid>/` | **LIVE (200)** | Retrieves vendor profile details. |
| `src/api/admin.ts:283` | `POST /api/v1/admin/vendors/{id}/approve/` | `/api/v1/admin/vendors/<uuid>/approve/` | **LIVE (200)** | Approves pending merchant store. |
| `src/api/admin.ts:292` | `POST /api/v1/admin/vendors/{id}/reject/` | `/api/v1/admin/vendors/<uuid>/reject/` | **LIVE (200)** | Rejects store application. |
| `src/api/admin.ts:301` | `POST /api/v1/admin/vendors/{id}/suspend/` | `/api/v1/admin/vendors/<uuid>/suspend/` | **LIVE (200)** | Suspends vendor store. |
| `src/api/admin.ts:311` | `GET /api/v1/admin/products/` | `/api/v1/products/` | **BROKEN (404)** | Prefix mismatch (`admin/products/` vs `products/`). |
| `src/api/admin.ts:320` | `POST /api/v1/admin/products/{id}/archive/`| `DELETE /api/v1/products/<uuid>/` | **BROKEN (404)** | Backend uses soft delete on `/products/<id>/`. |
| `src/api/admin.ts:330` | `GET /api/v1/admin/categories/` | `/api/v1/categories/` | **BROKEN (404)** | Prefix mismatch (`admin/categories/` vs `categories/`). |
| `src/api/admin.ts:339` | `POST /api/v1/admin/categories/` | `/api/v1/categories/` | **BROKEN (404)** | Prefix mismatch (`admin/categories/` vs `categories/`). |
| `src/api/admin.ts:348` | `PATCH /api/v1/admin/categories/{id}/` | `PUT /api/v1/categories/<uuid>/` | **BROKEN (404)** | Prefix mismatch + HTTP method mismatch. |
| `src/api/admin.ts:357` | `DELETE /api/v1/admin/categories/{id}/` | `DELETE /api/v1/categories/<uuid>/` | **BROKEN (404)** | Prefix mismatch (`admin/categories/` vs `categories/`). |
| `src/api/admin.ts:367` | `GET /api/v1/admin/orders/` | `/api/v1/orders/` | **BROKEN (404)** | Prefix mismatch (`admin/orders/` vs `orders/`). |
| `src/api/admin.ts:376` | `GET /api/v1/admin/orders/{ref}/` | `/api/v1/orders/<uuid>/` | **BROKEN (404)** | Prefix mismatch + UUID vs Reference param. |
| `src/api/admin.ts:385` | `PATCH /api/v1/admin/orders/{ref}/status/`| `POST /api/v1/orders/<id>/transition/` | **BROKEN (404)** | Route and method mismatch. |
| `src/api/admin.ts:395` | `GET /api/v1/admin/payments/` | *None* | **BROKEN (404)** | Backend only has `/payments/initialize/` & `/verify/`. |
| `src/api/admin.ts:404` | `GET /api/v1/admin/payments/{ref}/` | *None* | **BROKEN (404)** | Backend has no payment retrieval endpoint. |
| `src/api/admin.ts:414` | `GET /api/v1/admin/refunds/` | `/api/v1/refunds/` | **BROKEN (404)** | Prefix mismatch (`admin/refunds/` vs `refunds/`). |
| `src/api/admin.ts:423` | `GET /api/v1/admin/refunds/{id}/` | `/api/v1/refunds/<uuid>/` | **BROKEN (404)** | Prefix mismatch (`admin/refunds/` vs `refunds/`). |
| `src/api/admin.ts:432` | `POST /api/v1/admin/refunds/{id}/approve/`| `POST /api/v1/refunds/<id>/review/` | **BROKEN (404)** | Backend uses review endpoint with `{action: 'APPROVE'}`. |
| `src/api/admin.ts:441` | `POST /api/v1/admin/refunds/{id}/reject/` | `POST /api/v1/refunds/<id>/review/` | **BROKEN (404)** | Backend uses review endpoint with `{action: 'REJECT'}`. |
| `src/api/admin.ts:451` | `GET /api/v1/admin/reviews/` | `/api/v1/reviews/` | **BROKEN (404)** | Prefix mismatch (`admin/reviews/` vs `reviews/`). |
| `src/api/admin.ts:460` | `DELETE /api/v1/admin/reviews/{id}/` | `DELETE /api/v1/reviews/<uuid>/` | **BROKEN (404)** | Prefix mismatch (`admin/reviews/` vs `reviews/`). |
| `src/api/admin.ts:470` | `GET /api/v1/admin/audit-logs/` | *None* | **BROKEN (404)** | `apps/audit/urls.py` is empty placeholder. |
| `src/api/admin.ts:480` | `GET /api/v1/admin/homepage/banners/` | *None* | **BROKEN (404)** | `apps/homepage/urls.py` is empty placeholder. |
| `src/api/admin.ts:569` | `GET /api/v1/admin/homepage/sections/` | *None* | **MOCK FALLBACK** | Fails 404, catches error, reads `localStorage`. |
| `src/api/admin.ts:693` | `GET /api/v1/admin/save2own/` | `/api/v1/save2own/goals/` | **BROKEN (404)** | Prefix mismatch (`admin/save2own/` vs `save2own/goals/`). |
| `src/api/admin.ts:721` | `GET /api/v1/admin/auto/listings/` | *None* | **BROKEN (404)** | `apps/auto/urls.py` is empty placeholder. |

---

## 3. Immediate Bug: Dashboard Overview Crash

### Browser Stack Trace & Root Cause Analysis
* **Observed UI Behavior:** When loading `http://localhost:5174/`, the screen shows:
  ```
  Dashboard Overview
  An unexpected error occurred.
  ```
* **Network Call:** `GET https://dovi-2-0-backend.onrender.com/api/v1/admin/analytics/overview/` -> **HTTP 404 (Not Found)**
* **Root Cause Mechanism:**
  1. `DashboardOverviewPage.tsx:47` calls `adminApi.getAnalyticsOverview()`.
  2. The endpoint `/api/v1/admin/analytics/overview/` **does not exist anywhere on the backend** (there is no analytics router or view in Django).
  3. The request fails with HTTP 404 and returns standard HTML (`<!doctype html>...<h1>Not Found</h1>`).
  4. In `src/api/client.ts:117` (`normalizeApiError`), the function attempts to parse `error.response.data.message`. Because Django returned HTML, `data.message` is `undefined`.
  5. `normalizeApiError` falls back to the default string: `"An unexpected error occurred."`
  6. `DashboardOverviewPage.tsx:50` catches this error, stores it in state, and renders `<ApiErrorMessage error={error} />`.

---

## 4. Sidebar-by-Sidebar Status

| Sidebar Item | URL Path | Load State | Data Source | What Is Broken / Needs Work |
| :--- | :--- | :--- | :--- | :--- |
| **Overview** | `/` | **CRASHES** | None (404) | Endpoint `/api/v1/admin/analytics/overview/` does not exist on backend. |
| **Homepage CMS** | `/homepage` | **LOADS** | **LocalStorage Mock** | Banners 404; Sections fail API call and fall back to 10 hardcoded `localStorage` sections. Duplicating and reordering modify browser `localStorage` only. |
| **Save2Own Goals**| `/save2own` | **CRASHES** | None (404) | Calls `/api/v1/admin/save2own/` which 404s. Real endpoint is `/api/v1/save2own/goals/`. |
| **Users** | `/users` | **WORKS** | **Real Backend** | Connected to live `/api/v1/admin/users/`. Lists users, filters by role, search works, suspend/activate actions work. |
| **Vendors** | `/vendors` | **WORKS** | **Real Backend** | Connected to live `/api/v1/admin/vendors/`. View store details, Approve, Reject with reason, and Suspend all hit live Django views. |
| **Products** | `/products` | **CRASHES** | None (404) | Calls `/api/v1/admin/products/` which 404s. Real endpoint is `/api/v1/products/`. |
| **Auto Listings** | `/auto` | **CRASHES** | None (404) | Calls `/api/v1/admin/auto/listings/` which 404s. Backend `apps/auto` has no views or URLs yet. |
| **Categories** | `/categories` | **CRASHES** | None (404) | Calls `/api/v1/admin/categories/` which 404s. Real endpoints are `/api/v1/categories/`. |
| **Orders** | `/orders` | **CRASHES** | None (404) | Calls `/api/v1/admin/orders/` which 404s. Real endpoint is `/api/v1/orders/`. |
| **Payments** `[READ]` | `/payments` | **CRASHES** | None (404) | Calls `/api/v1/admin/payments/` which 404s. Backend has no payment listing view. |
| **Refunds** | `/refunds` | **CRASHES** | None (404) | Calls `/api/v1/admin/refunds/` which 404s. Real endpoint is `/api/v1/refunds/` and `/refunds/{id}/review/`. |
| **Reviews** | `/reviews` | **CRASHES** | None (404) | Calls `/api/v1/admin/reviews/` which 404s. Real endpoint is `/api/v1/reviews/`. |
| **Audit Logs** `[READ]` | `/audit-logs`| **CRASHES** | None (404) | Calls `/api/v1/admin/audit-logs/` which 404s. Backend `apps/audit` has no views or URLs yet. |

---

## 5. Authentication & Authorization

### Token Architecture
* **JWT Shared Architecture:** The admin app uses the exact same authentication mechanism as the main marketplace frontend.
* **Access Token:** Stored in-memory via `tokenStore` (never written to `localStorage` or `sessionStorage` for security).
* **Refresh Token:** Managed automatically by the backend via an `httpOnly` secure cookie (`refresh_token`).
* **Interceptors:** Axios interceptor catches 401s, calls `POST /api/v1/auth/token/refresh/`, updates the access token, and transparently replays queued requests.

### Role-Based Access Control (RBAC)
* **Protection Guard:** Protected routes are wrapped in `<AdminAuthGuard>` (`admin/src/components/guards/AdminAuthGuard.tsx`).
* **Strict Admin Enforcement:**
  * When `refreshUser()` runs, it calls `GET /api/v1/users/me/`.
  * If `user.role !== 'ADMIN'`, it immediately invokes `logout()`, clears the tokenStore, dispatches an `auth:forbidden` event, and throws:
    ```
    Access denied. Admin role required.
    ```
  * Unauthenticated or non-admin users are immediately redirected to `/login`.

### Login Flow
* **Real Login Screen:** `/login` (`admin/src/pages/LoginPage.tsx`) submits email & password to `POST /api/v1/auth/login/`.
* **No Hardcoded Bypass:** There are no mock login tokens or bypass flags; logging in requires a valid, active user with `role === 'ADMIN'` in the Neon PostgreSQL database.

---

## 6. Known Bugs and Gaps

### High Severity
1. **Wrong Route Prefixes on 8 Working Backend Features:**
   The admin API client assumed all admin operations live under `/api/v1/admin/<resource>/`. The backend only namespaces `users/` and `vendors/` under `admin/`. The other resources (`products/`, `categories/`, `orders/`, `refunds/`, `reviews/`, `save2own/goals/`) live at root `/api/v1/<resource>/` and enforce admin permissions inside their own ViewSets.
2. **Dashboard Overview Crashes Out-of-the-Box:**
   Because `/api/v1/admin/analytics/overview/` does not exist, any admin landing on the dashboard immediately sees an error banner.
3. **Refund Action Endpoint Mismatch:**
   Frontend calls `POST /api/v1/admin/refunds/{id}/approve/` and `POST /api/v1/admin/refunds/{id}/reject/`. The backend expects `POST /api/v1/refunds/{id}/review/` with `{ action: 'APPROVE' | 'REJECT', admin_note: string }`.
4. **Order Status Transition Mismatch:**
   Frontend calls `PATCH /api/v1/admin/orders/{ref}/status/`. The backend expects `POST /api/v1/orders/{id}/transition/` with `{ status: string }`.

### Medium Severity
5. **Homepage CMS Uses Silent LocalStorage Fallback:**
   In `admin/src/api/admin.ts:567-688`, when the backend returns 404 on homepage sections, it silently swallows the error and loads/saves mock data to `localStorage`. An admin editing sections believes they are saving to the live site when they are only mutating their local browser storage.
6. **Order & Payment Reference vs UUID Lookups:**
   Several admin detail pages attempt to query by `reference_code` instead of the database UUID `id`.

---

## 7. What This App Needs From the Backend That Doesn't Exist Yet

### Tier A: Missing Backend Endpoints (Must Be Built in Django)
1. **Analytics Overview Endpoint:**
   * **Required Route:** `GET /api/v1/admin/analytics/overview/`
   * **Expected Response Shape:**
     ```json
     {
       "total_users": 150,
       "new_users_today": 12,
       "total_vendors": 8,
       "pending_vendors_count": 2,
       "total_orders": 45,
       "revenue_today": "1550000.00",
       "payments_summary": { "today": "1550000.00", "week": "4500000.00", "month": "12000000.00" },
       "pending_refunds_count": 1,
       "active_s2o_goals_count": 14,
       "recent_orders": [...],
       "recent_users": [...]
     }
     ```
2. **Payments Global Listing & Detail Endpoint:**
   * **Required Routes:** `GET /api/v1/payments/` (Admin-only list), `GET /api/v1/payments/{id}/`
   * **Current State:** Backend only has `/payments/initialize/`, `/verify/`, and `/webhook/`.
3. **Homepage Banners & Dynamic Sections CMS:**
   * **Required Routes:** `GET/POST /api/v1/homepage/banners/`, `GET/POST/PATCH/DELETE /api/v1/homepage/sections/`
   * **Current State:** `apps/homepage/urls.py` is an empty file.
4. **Audit Logs Endpoint:**
   * **Required Route:** `GET /api/v1/audit/logs/` (or `/api/v1/admin/audit-logs/`)
   * **Current State:** `apps/audit/urls.py` is an empty file.
5. **Dovi Auto Listings Admin Endpoint:**
   * **Required Routes:** `GET/PATCH/DELETE /api/v1/auto/vehicles/`
   * **Current State:** `apps/auto/urls.py` is an empty file.

### Tier B: Existing Backend Endpoints (Frontend API Client Needs URL Fixes)
These features exist and are fully functional on the backend right now, but the admin frontend is calling the wrong path:

| Feature | Admin App Currently Calls | Change To Backend URL |
| :--- | :--- | :--- |
| **Products List** | `GET /api/v1/admin/products/` | `GET /api/v1/products/` |
| **Product Archive** | `POST /api/v1/admin/products/{id}/archive/` | `DELETE /api/v1/products/{id}/` |
| **Categories List** | `GET /api/v1/admin/categories/` | `GET /api/v1/categories/` |
| **Category Create** | `POST /api/v1/admin/categories/` | `POST /api/v1/categories/` |
| **Category Update** | `PATCH /api/v1/admin/categories/{id}/` | `PUT /api/v1/categories/{id}/` |
| **Category Delete** | `DELETE /api/v1/admin/categories/{id}/` | `DELETE /api/v1/categories/{id}/` |
| **Orders List** | `GET /api/v1/admin/orders/` | `GET /api/v1/orders/` |
| **Order Status** | `PATCH /api/v1/admin/orders/{ref}/status/` | `POST /api/v1/orders/{id}/transition/` |
| **Refunds List** | `GET /api/v1/admin/refunds/` | `GET /api/v1/refunds/` |
| **Refund Review** | `POST /api/v1/admin/refunds/{id}/approve/` | `POST /api/v1/refunds/{id}/review/` (`action: "APPROVE"`) |
| **Reviews List** | `GET /api/v1/admin/reviews/` | `GET /api/v1/reviews/` |
| **Review Delete** | `DELETE /api/v1/admin/reviews/{id}/` | `DELETE /api/v1/reviews/{id}/` |
| **Save2Own Goals** | `GET /api/v1/admin/save2own/` | `GET /api/v1/save2own/goals/` |
