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
* **Architecture Relationship:** Standalone Single Page Application (SPA) living as a dedicated subdirectory inside the main `DOVI-2.0` multi-app monorepo alongside `/home/victor/Desktop/DOVI-2.0/frontend`. It maintains its own independent `package.json`, `node_modules`, `tsconfig.json`, and `vite.config.ts`.

### Local Execution & Port Configuration
* **Clean Build & Startup:** `npm install && npm run dev` runs cleanly with **0 TypeScript and 0 bundler errors** (`tsc -b && vite build` completes in ~660ms).
* **Port:** Runs on **`http://localhost:5174`**.
* **Why Port 5174:** Configured explicitly in `admin/vite.config.ts` (`server: { port: 5174, open: true }`) to prevent port collision with the main marketplace frontend on `http://localhost:5173`.

---

## 2. Backend Integration — Live Endpoint Status

### Configured API Base URL
* Configured in `admin/.env`:
  ```env
  VITE_API_BASE_URL=https://dovi-2-0-backend.onrender.com
  ```

### Live Endpoint Inventory & Verification Status

| Feature / Resource | Method & Route | Backend Status | Live Verified Data | Actions Verified |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Login** | `POST /api/v1/auth/login/` | **LIVE (200)** | Authenticates admin | Login with JWT cookie |
| **Auth Refresh** | `POST /api/v1/auth/token/refresh/` | **LIVE (200)** | In-memory token rotation | Automatic on 401 |
| **Current User** | `GET /api/v1/users/me/` | **LIVE (200)** | Admin user profile | RBAC admin check |
| **Products List** | `GET /api/v1/products/` | **LIVE (200)** | *iPhone 15 Pro Max* | Table renders with image & variants |
| **Product Archive** | `DELETE /api/v1/products/<uuid>/` | **LIVE (204)** | Soft-delete to ARCHIVED | Archive button |
| **Categories List** | `GET /api/v1/categories/` | **LIVE (200)** | *Smartphones* category | Table & subcategory nesting |
| **Category Create** | `POST /api/v1/categories/` | **LIVE (201)** | CategorySerializer | Create form modal |
| **Category Update** | `PUT /api/v1/categories/<uuid>/` | **LIVE (200)** | CategorySerializer | Edit category form |
| **Category Delete** | `DELETE /api/v1/categories/<uuid>/`| **LIVE (204)** | Deletion supported | Delete action |
| **Orders List** | `GET /api/v1/orders/` | **LIVE (200)** | *DOV-ORD-TEST01* (₦1,555,000) | Table & Inspect modal |
| **Order Transition**| `POST /api/v1/orders/<id>/transition/` | **LIVE (200)** | Status machine pipeline | Transitioned `PAID` ➔ `PROCESSING` |
| **Refunds List** | `GET /api/v1/refunds/` | **LIVE (200)** | *RFD-TEST-001* (₦1,555,000) | Table & Claim verification modal |
| **Refund Review** | `POST /api/v1/refunds/<id>/review/` | **LIVE (200)** | `{"action": "reject", "notes": "..."}` | Verified rejection with reviewer notes |
| **Reviews List** | `GET /api/v1/reviews/` | **LIVE (200)** | 5-star verified review | Table renders comment & rating |
| **Review Delete** | `DELETE /api/v1/reviews/<id>/` | **MISSING (404)**| `apps/reviews/urls.py` lacks detail route | Needs `DestroyAPIView` on backend |
| **Save2Own List** | `GET /api/v1/save2own/goals/` | **LIVE (200)** | *S2O-TEST-001* (25.0% progress) | Table with progress bar & target amount |
| **Save2Own Detail** | `GET /api/v1/save2own/goals/<id>/` | **LIVE (200)** | Target specs, timeline, history | Detail view `/save2own/<id>` |
| **Users List** | `GET /api/v1/admin/users/` | **LIVE (200)** | Registered users & roles | Search, Filter, Suspend/Activate |
| **Vendors List** | `GET /api/v1/admin/vendors/` | **LIVE (200)** | *Apple Authorized Store* | Approve, Reject, Suspend |
| **Overview Analytics**| `GET /api/v1/admin/analytics/overview/` | **MISSING (404)**| No Django analytics app/view | Dashboard Overview error card |
| **Homepage CMS** | `GET /api/v1/admin/homepage/sections/` | **MISSING (404)**| Silent fallback to `localStorage` | `apps/homepage` is empty placeholder |
| **Payments List** | `GET /api/v1/admin/payments/` | **MISSING (404)**| Backend only has init/verify | Needs admin payment listing view |
| **Audit Logs** | `GET /api/v1/admin/audit-logs/` | **MISSING (404)**| `apps/audit/urls.py` is empty | Needs audit log ViewSet |
| **Auto Listings** | `GET /api/v1/admin/auto/listings/` | **MISSING (404)**| `apps/auto/urls.py` is empty | Needs auto vehicle ViewSet |
