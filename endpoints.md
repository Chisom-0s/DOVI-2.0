[8/21/2026 8:33 AM] Dovi-Group LTD: # Dovi 2.0 — API Endpoints Reference

This document lists every single API endpoint exposed by the backend on Render, along with required methods, parameters, and example response formats.

- Base URL: https://dovi-2-0-backend.onrender.com
- Interactive Documentation (Swagger): https://dovi-2-0-backend.onrender.com/api/docs/
- ReDoc: https://dovi-2-0-backend.onrender.com/api/redoc/
- Schema File (JSON): https://dovi-2-0-backend.onrender.com/api/schema/

---

## Table of Contents
1. [Authentication & User Accounts](#1-authentication--user-accounts)
2. [User Profiles](#2-user-profiles)
3. [Vendor Stores](#3-vendor-stores)
4. [Categories](#4-categories)
5. [Products & Inventory](#5-products--inventory)
6. [Shopping Cart](#6-shopping-cart)
7. [Checkout Preview](#7-checkout-preview)
8. [Orders](#8-orders)
9. [Payments](#9-payments)
10. [Refunds](#10-refunds)
11. [Reviews](#11-reviews)
12. [Save2Own (Goal Saving)](#12-save2own-goal-saving)
13. [Delivery tracking](#13-delivery-tracking)
14. [Notifications](#14-notifications)
15. [Admin Actions](#15-admin-actions)
16. [Common & Health](#16-common--health)

---

## 1. Authentication & User Accounts
All paths prefixed with /api/v1/auth/

### 1.1 User Registration
* Endpoint: POST /api/v1/auth/register/
* Auth Required: No
* Request Body:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "role": "BUYER"  // Either "BUYER" or "VENDOR"
  }
  ```
* Response 211 Created:
  ```json
  {
    "id": "e44d326f-d1ef-4bfd-a128-d89006cc732a",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "BUYER"
  }
  ```

### 1.2 Verify Email
* Endpoint: POST /api/v1/auth/verify-email/
* Auth Required: No
* Request Body:
  ```json
  {
    "uid": "MTI",
    "token": "anvjfd-38fhdb-38fhdb"
  }
  ```
* Response 200 OK:
  ```json
  {
    "detail": "Email has been verified successfully."
  }
  ```

### 1.3 User Login
* Endpoint: POST /api/v1/auth/login/
* Auth Required: No (Generates Audit Log)
* Request Body:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
* Response 200 OK:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

### 1.4 Refresh Token
* Endpoint: POST /api/v1/auth/token/refresh/
* Auth Required: No (Rotates refresh token)
* Request Body:
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
* Response 200 OK:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

### 1.5 User Logout
* Endpoint: POST /api/v1/auth/logout/
* Auth Required: Yes
* Request Body:
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
* Response 205 Reset Content: Empty response.

### 1.6 Password Reset Request
* Endpoint: POST /api/v1/auth/password-reset/
* Auth Required: No
* Request Body:
  ```json
  {
    "email": "user@example.com"
  }
  ```
* Response 200 OK:
  ```json
  {
    "detail": "Password reset link has been sent to your email."
  }
  ```

### 1.7 Password Reset Confirm
* Endpoint: POST /api/v1/auth/password-reset/confirm/
* Auth Required: No
* Request Body:
  ```json
  {
    "uid": "MTI",
    "token": "anvjfd-38fhdb-38fhdb",
    "password": "NewSecurePassword123!"
  }
  ```
* Response 200 OK:
  ```json
  {
    "detail": "Password has been reset successfully."
  }
  ```

---

## 2. User Profiles
All paths prefixed with /api/v1/users/
[8/21/2026 8:33 AM] Dovi-Group LTD: ### 2.1 Get Current Profile Details
* Endpoint: GET /api/v1/users/me/
* Auth Required: Yes
* Response 200 OK:
  ```json
  {
    "id": "e44d326f-d1ef-4bfd-a128-d89006cc732a",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "BUYER",
    "is_email_verified": true,
    "profile": {
      "phone_number": "+2348012345678",
      "avatar_url": null,
      "address_line_1": "123 Victory Lane",
      "address_line_2": "Suite 4",
      "city": "Lagos",
      "state": "Lagos",
      "postal_code": "100001",
      "country": "Nigeria",
      "vendor_status": "N/A"  // "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "N/A"
    }
  }
  ```

### 2.2 Update Current Profile
* Endpoint: PUT /api/v1/users/me/ (or PATCH /api/v1/users/me/)
* Auth Required: Yes
* Request Body:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "profile": {
      "phone_number": "+2348012345678",
      "address_line_1": "Updated Address 123",
      "city": "Ibadan",
      "state": "Oyo"
    }
  }
  ```
* Response 200 OK: Returns updated profile payload (same schema as 2.1).

---

## 3. Vendor Stores
All paths prefixed with /api/v1/vendors/

### 3.1 List Vendors
* Endpoint: GET /api/v1/vendors/
* Auth Required: Yes
* Response 200 OK:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "18f972b2-f19d-4c31-9876-00cc3f8d8b9e",
        "email": "vendor@example.com",
        "name": "Super Tech Stores",
        "description": "Authorized Electronics Dealer",
        "reference_code": "VND-HGT29B",
        "business_registration_number": "RC1234567"
      }
    ]
  }
  ```

### 3.2 Register Vendor Store
* Endpoint: POST /api/v1/vendors/
* Auth Required: Yes (Role must be VENDOR)
* Request Body:
  ```json
  {
    "name": "Super Tech Stores",
    "description": "Authorized Electronics Dealer",
    "business_registration_number": "RC1234567"
  }
  ```
* Response 201 Created: Returns registered vendor payload (same schema as 3.1).

### 3.3 Get Vendor Store details
* Endpoint: GET /api/v1/vendors/{vendor_uuid}/
* Auth Required: Yes
* Response 200 OK: Returns vendor payload.

### 3.4 Update Vendor Store details
* Endpoint: PUT /api/v1/vendors/{vendor_uuid}/ (or PATCH)
* Auth Required: Yes (Vendor store owner only)
* Response 200 OK: Returns updated vendor payload.

### 3.5 Delete Vendor Store
* Endpoint: DELETE /api/v1/vendors/{vendor_uuid}/
* Auth Required: Yes (Vendor store owner only)
* Response 204 No Content: Empty response.

### 3.6 Submit/Update Vendor Verification Status (Admin Only)
* Endpoint: POST /api/v1/vendors/{vendor_uuid}/verify/
* Auth Required: Yes (Staff/Admin only)
* Request Body:
  ```json
  {
    "status": "APPROVED",  // "APPROVED" | "REJECTED" | "SUSPENDED"
    "reviewer_notes": "All registration credentials verified."
  }
  ```
* Response 200 OK:
  ```json
  {
    "id": "787bbcc9-02ea-44a6-89d1-d249aa01828a",
    "vendor": "18f972b2-f19d-4c31-9876-00cc3f8d8b9e",
    "vendor_name": "Super Tech Stores",
    "reviewer": "e44d326f-d1ef-4bfd-a128-d89006cc732a",
    "reviewer_email": "admin@dovi.com",
    "status": "APPROVED",
    "reviewer_notes": "All registration credentials verified.",
    "created_at": "2026-08-21T13:42:00Z",
    "updated_at": "2026-08-21T13:42:00Z"
  }
  ```

---

## 4. Categories
All paths prefixed with /api/v1/categories/
[8/21/2026 8:33 AM] Dovi-Group LTD: ### 4.1 List Categories (Recursively Nested Tree)
* Endpoint: GET /api/v1/categories/
* Auth Required: No (Cached, Order by name)
* Response 200 OK:
  ```json
  [
    {
      "id": "31f316b2-6012-4fb3-bb12-9c8dfb21efb1",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Gadgets, parts and systems",
      "parent": null,
      "subcategories": [
        {
          "id": "e0e29b23-28f1-46da-b011-002bf89c8a9e",
          "name": "Phones & Accessories",
          "slug": "phones-accessories",
          "description": "Mobile phones and peripherals",
          "parent": "31f316b2-6012-4fb3-bb12-9c8dfb21efb1",
          "subcategories": []
        }
      ]
    }
  ]
  ```

### 4.2 Create Category (Admin Only)
* Endpoint: POST /api/v1/categories/
* Auth Required: Yes (Staff/Admin only)
* Request Body:
  ```json
  {
    "name": "Smartwatches",
    "description": "Wearable smart technology",
    "parent": "e0e29b23-28f1-46da-b011-002bf89c8a9e" // Optional parent UUID
  }
  ```
* Response 201 Created: Returns category payload.

### 4.3 Get Category Details
* Endpoint: GET /api/v1/categories/{category_uuid}/
* Auth Required: No

### 4.4 Update Category (Admin Only)
* Endpoint: PUT /api/v1/categories/{category_uuid}/ (or PATCH)
* Auth Required: Yes (Staff/Admin only)

### 4.5 Delete Category (Admin Only)
* Endpoint: DELETE /api/v1/categories/{category_uuid}/
* Auth Required: Yes (Staff/Admin only)

---

## 5. Products & Inventory
All paths prefixed with /api/v1/products/

### 5.1 List/Search/Filter Products
* Endpoint: GET /api/v1/products/
* Auth Required: No
* Query Parameters:
  - search: Searches product name & description
  - category: Category UUID to filter by
  - vendor: Vendor UUID to filter by
  - status: Product status filter
  - ordering: Fields to order by (base_price, -base_price, etc.)
* Response 200 OK:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "e22a7f8e-d912-45bb-b312-d81b9ee7f6ea",
        "vendor": "18f972b2-f19d-4c31-9876-00cc3f8d8b9e",
        "vendor_name": "Super Tech Stores",
        "category": "e0e29b23-28f1-46da-b011-002bf89c8a9e",
        "category_name": "Phones & Accessories",
        "name": "Samsung Galaxy S24 Ultra",
        "slug": "samsung-galaxy-s24-ultra",
        "description": "512GB Titanium Black",
        "base_price": "1450000.00",
        "reference_code": "PRD-2X3H9K",
        "status": "PUBLISHED", // "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED"
        "variants": [
          {
            "id": "f8a7e3d1-b0e1-4c12-9c12-32b1ff90989f",
            "name": "Titanium Black 12GB RAM",
            "sku": "S24U-512-BLK",
            "price_override": null, // If not null, overrides base_price
            "stock": 10,
            "reserved": 0
          }
        ]
      }
    ]
  }
  ```

### 5.2 Create Product & Initial Variant/Inventory
* Endpoint: POST /api/v1/products/
* Auth Required: Yes (Verified Vendor only)
* Request Body:
  ```json
  {
    "category": "e0e29b23-28f1-46da-b011-002bf89c8a9e",
    "name": "Samsung Galaxy S24 Ultra",
    "description": "512GB Titanium Black",
    "base_price": "1450000.00",
    "status": "PUBLISHED",
    "variants": [
      {
        "name": "Titanium Black 12GB RAM",
        "sku": "S24U-512-BLK",
        "price_override": null,
        "quantity": 10 // Sets initial stock inventory
      }
    ]
  }
  ```
* Response 201 Created: Returns product payload (same schema as 5.1).

### 5.3 Retrieve Product Details (by UUID or slug)
* Endpoint: GET /api/v1/products/{product_uuid}/
* Endpoint: GET /api/v1/products/{product-slug}/
* Auth Required: No

### 5.4 Update Product Core parameters
* Endpoint: PUT /api/v1/products/{product_uuid}/ (or PATCH)
* Auth Required: Yes (Owner vendor only)
* Note: Updating product parameters through this endpoint does not modify variants. Use dedicated variant endpoints.

### 5.5 Delete Product
* Endpoint: DELETE /api/v1/products/{product_uuid}/
* Auth Required: Yes (Owner vendor only)
* Response 204 No Content: Empty response.
[8/21/2026 8:33 AM] Dovi-Group LTD: ### 5.6 Create Product Variant
* Endpoint: POST /api/v1/products/{product_uuid}/variants/
* Auth Required: Yes (Owner vendor only)
* Request Body:
  ```json
  {
    "name": "Titanium Gray 12GB RAM",
    "sku": "S24U-512-GRY",
    "price_override": "1480000.00",
    "quantity": 5 // Sets initial stock inventory
  }
  ```
* Response 201 Created: Returns variant payload.

### 5.7 Update Product Variant & Price/Inventory (Atomic Transaction)
* Endpoint: PUT /api/v1/products/{product_uuid}/variants/{variant_uuid}/ (or PATCH)
* Auth Required: Yes (Owner vendor only)
* Request Body:
  ```json
  {
    "name": "Titanium Gray 12GB RAM Updated",
    "price_override": "1460000.00",
    "quantity": 15 // Absolute value to set inventory stock to
  }
  ```
* Response 200 OK: Returns updated variant payload.
* Note: Changes to the variant price trigger pre_save price-change logic. Any active Save2Own goals locked to this variant are frozen and updated to PRICE_CHANGED status.

### 5.8 Upload Product Image
* Endpoint: POST /api/v1/products/{product_uuid}/images/
* Auth Required: Yes (Owner vendor only)
* Request Body (Multipart/form-data):
  - image: Image file
  - is_primary: Boolean
* Response 201 Created:
  ```json
  {
    "id": "e38a2e12-4fb3-82a1-cc01-9a998bb1bc9d",
    "image_url": "https://dovi-media.s3.amazonaws.com/...",
    "is_primary": true
  }
  ```

### 5.9 Delete Product Image
* Endpoint: DELETE /api/v1/products/{product_uuid}/images/{image_uuid}/
* Auth Required: Yes (Owner vendor only)
* Response 204 No Content: Empty response.

---

## 6. Shopping Cart
All paths prefixed with /api/v1/cart/

### 6.1 View User Cart
* Endpoint: GET /api/v1/cart/
* Auth Required: Yes
* Response 200 OK:
  ```json
  {
    "id": "bc337fde-6fb2-4a01-9bce-089aa73cd8f1",
    "user": "e44d326f-d1ef-4bfd-a128-d89006cc732a",
    "session_id": null,
    "items": [
      {
        "id": "67f891b2-10f2-43bb-a29f-399bbcd86b9e",
        "variant": "f8a7e3d1-b0e1-4c12-9c12-32b1ff90989f",
        "variant_name": "Titanium Black 12GB RAM",
        "variant_sku": "S24U-512-BLK",
        "product_name": "Samsung Galaxy S24 Ultra",
        "price": "1450000.00",
        "quantity": 1,
        "available_stock": 10
      }
    ],
    "subtotal": "1450000.00"
  }
  ```

### 6.2 Add Item to Cart
* Endpoint: POST /api/v1/cart/items/
* Auth Required: Yes
* Request Body:
  ```json
  {
    "variant": "f8a7e3d1-b0e1-4c12-9c12-32b1ff90989f",
    "quantity": 1
  }
  ```
* Response 201 Created: Returns the added cart item details.

### 6.3 Update Cart Item Quantity
* Endpoint: PUT /api/v1/cart/items/{cart_item_uuid}/ (or PATCH)
* Auth Required: Yes
* Request Body:
  ```json
  {
    "quantity": 3
  }
  ```
* Response 200 OK: Returns updated cart item details.

### 6.4 Remove Item from Cart
* Endpoint: DELETE /api/v1/cart/items/{cart_item_uuid}/
* Auth Required: Yes
* Response 204 No Content: Empty response.

---

## 7. Checkout Preview
All paths prefixed with /api/v1/checkout/

### 7.1 Authoritatively Recalculate Checkout Totals
* Endpoint: POST /api/v1/checkout/
* Auth Required: Yes
* Request Body:
  ```json
  {
    "shipping_address_line_1": "123 Victory Lane",
    "shipping_address_line_2": "",
    "shipping_city": "Lagos",
    "shipping_state": "Lagos",
    "shipping_postal_code": "100001",
    "shipping_country": "Nigeria"
  }
  ```
* Response 200 OK:
  ```json
  {
    "items": [
      {
        "variant_id": "f8a7e3d1-b0e1-4c12-9c12-32b1ff90989f",
        "variant_sku": "S24U-512-BLK",
        "product_name": "Samsung Galaxy S24 Ultra",
        "variant_name": "Titanium Black 12GB RAM",
        "quantity": 1,
        "unit_price": "1450000.00",
        "item_total": "1450000.00"
      }
    ],
    "subtotal": "1450000.00",
    "delivery_fee": "1500.00",
    "discount": "0.00",
    "total_amount": "1451500.00"
  }
  ```

---

## 8. Orders
All paths prefixed with /api/v1/orders/
[8/21/2026 8:33 AM] Dovi-Group LTD: ### 8.1 Place Order from Cart (Atomic Transaction)
* Endpoint: POST /api/v1/orders/
* Auth Required: Yes
* Request Body:
  ```json
  {
    "shipping_address_line_1": "123 Victory Lane",
    "shipping_address_line_2": "",
    "shipping_city": "Lagos",
    "shipping_state": "Lagos",
    "shipping_postal_code": "100001",
    "shipping_country": "Nigeria"
  }
  ```
* Response 201 Created:
  ```json
  {
    "id": "a9bc99c2-20fb-4890-a291-002bfb8d8b9e",
    "reference_code": "ORD-GT29BHX",
    "buyer": "e44d326f-d1ef-4bfd-a128-d89006cc732a",
    "buyer_email": "user@example.com",
    "subtotal": "1450000.00",
    "delivery_fee": "1500.00",
    "discount": "0.00",
    "total_amount": "1451500.00",
    "status": "PENDING_PAYMENT",
    "expires_at": "2026-08-21T14:42:00Z", // 60 minutes expiry window
    "items": [
      {
        "id": "e2f891b2-10f2-43bb-a29f-399bbcd86b9e",
        "variant": "f8a7e3d1-b0e1-4c12-9c12-32b1ff90989f",
        "variant_sku": "S24U-512-BLK",
        "product_name": "Samsung Galaxy S24 Ultra",
        "quantity": 1,
        "unit_price": "1450000.00"
      }
    ],
    "shipping_address_line_1": "123 Victory Lane",
    "shipping_address_line_2": "",
    "shipping_city": "Lagos",
    "shipping_state": "Lagos",
    "shipping_postal_code": "100001",
    "shipping_country": "Nigeria",
    "created_at": "2026-08-21T13:42:00Z"
  }
  ```
* Note: During checkout, the item stock is reserved (reserved_quantity += quantity). If the order is not paid before expires_at, a Celery cron job cancels the order and releases the reservation.

### 8.2 List Orders
* Endpoint: GET /api/v1/orders/
* Auth Required: Yes
* Query Parameters:
  - status: Filter by order status (PENDING_PAYMENT, PAID, CANCELLED, etc.)
* Response 200 OK: Returns a paginated list of orders.

### 8.3 Get Order details
* Endpoint: GET /api/v1/orders/{order_uuid}/
* Auth Required: Yes (Order buyer, or related product vendor, or admin)
* Response 200 OK: Returns complete order details.

### 8.4 Transition Order Status
* Endpoint: POST /api/v1/orders/{order_uuid}/transition/
* Auth Required: Yes (Admin, or Vendor associated with products in order)
* Request Body:
  ```json
  {
    "status": "PROCESSING" // "PROCESSING" | "SHIPPED" | "DELIVERED" | "RECEIVED" | "COMPLETED"
  }
  ```
* Response 200 OK: Returns updated order details.

---

## 9. Payments
All paths prefixed with /api/v1/payments/

### 9.1 Initialize Payment Session
* Endpoint: POST /api/v1/payments/initialize/
* Auth Required: Yes
* Request Body:
  ```json
  {
    "order_id": "a9bc99c2-20fb-4890-a291-002bfb8d8b9e",
    "provider": "FLUTTERWAVE", // "FLUTTERWAVE" | "OPAY"
    "return_url": "https://dovi.market/checkout/success" // Frontend landing url
  }
  ```
* Response 201 Created:
  ```json
  {
    "checkout_url": "https://checkout.flutterwave.com/v3/hosted/...", // Redirect buyer here
    "payment_reference": "PAY-T9H29BK"
  }
  ```

### 9.2 Verify Payment (After checkout redirect)
* Endpoint: GET /api/v1/payments/verify/?reference=PAY-T9H29BK
* Auth Required: Yes
* Response 200 OK:
  ```json
  {
    "status": "COMPLETED", // "PENDING" | "COMPLETED" | "FAILED"
    "payment_reference": "PAY-T9H29BK"
  }
  ```

### 9.3 Payment Provider Webhook Callback
* Endpoint: POST /api/v1/payments/webhook/
* Auth Required: No (Exempted from API Throttling. Uses secure header signatures)
* Request Body: Standard Webhook schema from Flutterwave/OPay.

---

## 10. Refunds
All paths prefixed with /api/v1/refunds/

### 10.1 List Refunds
* Endpoint: GET /api/v1/refunds/
* Auth Required: Yes (Buyers see own, admins see all)
[8/21/2026 8:33 AM] Dovi-Group LTD: ### 10.2 Request Refund for paid Order
* Endpoint: POST /api/v1/refunds/request/
* Auth Required: Yes (Order buyer only)
* Request Body:
  ```json
  {
    "order": "a9bc99c2-20fb-4890-a291-002bfb8d8b9e",
    "reason": "Merchant sent wrong device variant color."
  }
  ```
* Response 201 Created:
  ```json
  {
    "id": "52ac81ff-a0e2-411a-8bb1-ee00cd878c9e",
    "order": "a9bc99c2-20fb-4890-a291-002bfb8d8b9e",
    "order_reference": "ORD-GT29BHX",
    "payment": "981bbcc9-02ea-44a6-89d1-d249aa01828a",
    "payment_reference": "PAY-T9H29BK",
    "reference_code": "REF-LGT89H",
    "amount": "1451500.00", // Authoritatively resolved from order payment
    "status": "PENDING",
    "reason": "Merchant sent wrong device variant color.",
    "reviewer": null,
    "reviewer_email": null,
    "reviewer_notes": "",
    "created_at": "2026-08-21T14:02:00Z"
  }
  ```

### 10.3 Retrieve Refund Details
* Endpoint: GET /api/v1/refunds/{refund_uuid}/
* Auth Required: Yes (Owner buyer, or admin)

### 10.4 Process/Review Refund Request (Admin Only)
* Endpoint: POST /api/v1/refunds/{refund_uuid}/review/
* Auth Required: Yes (Staff/Admin only)
* Request Body:
  ```json
  {
    "action": "approve", // "approve" | "reject"
    "notes": "Verified return package arrived."
  }
  ```
* Response 200 OK: Returns updated refund details payload.

---

## 11. Reviews
All paths prefixed with /api/v1/reviews/

### 11.1 List Reviews
* Endpoint: GET /api/v1/reviews/
* Auth Required: No
* Query Parameters:
  - product: Product UUID to get reviews for
* Response 200 OK:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "bc89dfb3-2812-4fbc-b112-90abf829ec9d",
        "buyer": "e44d326f-d1ef-4bfd-a128-d89006cc732a",
        "buyer_email": "user@example.com",
        "product": "e22a7f8e-d912-45bb-b312-d81b9ee7f6ea",
        "rating": 5, // 1 to 5
        "comment": "Incredible screen and battery life!",
        "is_verified_purchase": true, // Automatically set true if order exists in PAID+ state
        "created_at": "2026-08-21T14:10:00Z"
      }
    ]
  }
  ```

### 11.2 Create Review
* Endpoint: POST /api/v1/reviews/
* Auth Required: Yes
* Request Body:
  ```json
  {
    "product": "e22a7f8e-d912-45bb-b312-d81b9ee7f6ea",
    "rating": 5,
    "comment": "Incredible screen and battery life!"
  }
  ```
* Response 201 Created: Returns review payload (same schema as 11.1).

---

## 12. Save2Own (Goal Saving)
All paths prefixed with /api/v1/save2own/goals/
[8/21/2026 8:33 AM] Dovi-Group LTD: ### 12.1 Create Save2Own Saving Goal
* Endpoint: POST /api/v1/save2own/goals/
* Auth Required: Yes
* Request Body:
  ```json
  {
    "variant": "f8a7e3d1-b0e1-4c12-9c12-32b1ff90989f",
    "quantity": 1,
    "shipping_address_line_1": "123 Victory Lane",
    "shipping_address_line_2": "",
    "shipping_city": "Lagos",
    "shipping_state": "Lagos",
    "shipping_postal_code": "100001",
    "shipping_country": "Nigeria"
  }
  ```
* Response 201 Created:
  ```json
  {
    "id": "31bc992a-fa12-48a1-b81c-00cc3f8902be",
    "reference_code": "S2O-892HKJ",
    "buyer": "e44d326f-d1ef-4bfd-a128-d89006cc732a",
    "variant": "f8a7e3d1-b0e1-4c12-9c12-32b1ff90989f",
    "target_amount": "1450000.00", // Computed from variant.price * quantity
    "saved_amount": "0.00",
    "quantity": 1,
    "status": "DRAFT", // GoalStatus: DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED, PRODUCT_UNAVAILABLE, PRICE_CHANGED, PAYMENT_REVIEW, REFUND_PENDING
    "progress_percent": 0.0,
    "shipping_address_line_1": "123 Victory Lane",
    "shipping_address_line_2": "",
    "shipping_city": "Lagos",
    "shipping_state": "Lagos",
    "shipping_postal_code": "100001",
    "shipping_country": "Nigeria",
    "contributions": [],
    "history": [
      {
        "id": "c1f8b22a-fb12-4819-bb1c-09abf2820be1",
        "event_type": "GOAL_CREATED",
        "previous_value": null,
        "new_value": {
          "variant_sku": "S24U-512-BLK",
          "quantity": 1,
          "target_amount": "1450000.00",
          "variant_price": "1450000.00"
        },
        "reason": "",
        "created_at": "2026-08-21T14:15:00Z"
      }
    ],
    "created_at": "2026-08-21T14:15:00Z",
    "updated_at": "2026-08-21T14:15:00Z"
  }
  ```

### 12.2 List Goals
* Endpoint: GET /api/v1/save2own/goals/
* Auth Required: Yes
* Response 200 OK: Returns paginated list of goals (same schema as 12.1).

### 12.3 Get Goal Details
* Endpoint: GET /api/v1/save2own/goals/{goal_uuid}/
* Auth Required: Yes
* Response 200 OK: Returns goal payload.

### 12.4 Activate Goal (DRAFT -> ACTIVE)
* Endpoint: POST /api/v1/save2own/goals/{goal_uuid}/activate/
* Auth Required: Yes
* Response 200 OK: Returns updated goal details.

### 12.5 Pause Goal (ACTIVE -> PAUSED)
* Endpoint: POST /api/v1/save2own/goals/{goal_uuid}/pause/
* Auth Required: Yes
* Response 200 OK: Returns updated goal details.

### 12.6 Resume Goal (PAUSED -> ACTIVE)
* Endpoint: POST /api/v1/save2own/goals/{goal_uuid}/resume/
* Auth Required: Yes
* Response 200 OK: Returns updated goal details.

### 12.7 Initialize Goal Contribution Payment
* Endpoint: POST /api/v1/save2own/goals/{goal_uuid}/contribute/
* Auth Required: Yes
* Request Body:
  ```json
  {
    "amount": "500000.00",
    "provider": "FLUTTERWAVE",
    "return_url": "https://dovi.market/save2own/success"
  }
  ```
* Response 201 Created:
  ```json
  {
    "checkout_url": "https://checkout.flutterwave.com/v3/hosted/...", // Redirect buyer here
    "payment_reference": "PAY-S2O89HK"
  }
  ```
* Note: Verifying contribution payment follows the same /api/v1/payments/verify/ path. When payment completes, goal saved_amount increments. If target is met, order is placed in PAID status, and stock is permanently deducted. If stock is unavailable, status changes to PRODUCT_UNAVAILABLE.

### 12.8 Cancel Goal (Triggers Refund if funded)
* Endpoint: POST /api/v1/save2own/goals/{goal_uuid}/cancel/
* Auth Required: Yes
* Response 200 OK: Returns updated goal details.
* Note: If any completed contributions exist, status changes to REFUND_PENDING and standard Refund objects are generated for admin review.

### 12.9 Accept Price Change (PRICE_CHANGED -> ACTIVE)
* Endpoint: POST /api/v1/save2own/goals/{goal_uuid}/accept-price/
* Auth Required: Yes
* Response 200 OK:
* Note: Buyer accepts updated target amount calculated from new variant price. Transitions status back to ACTIVE.

---

## 13. Delivery Tracking
All paths prefixed with /api/v1/delivery/
[8/21/2026 8:33 AM] Dovi-Group LTD: ### 13.1 List Deliveries
* Endpoint: GET /api/v1/delivery/
* Auth Required: Yes
* Response 200 OK:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "781abcf1-6fb2-421b-bbce-192aacc7cd9b",
        "order": "a9bc99c2-20fb-4890-a291-002bfb8d8b9e",
        "status": "PENDING", // DeliveryStatus: PENDING, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED
        "carrier_details": null,
        "estimated_delivery": null,
        "created_at": "2026-08-21T13:42:00Z",
        "updated_at": "2026-08-21T13:42:00Z"
      }
    ]
  }
  ```

### 13.2 Get Delivery details
* Endpoint: GET /api/v1/delivery/{delivery_uuid}/
* Auth Required: Yes

### 13.3 Update Delivery carrier/tracking parameters (Admin/Vendor Only)
* Endpoint: PUT /api/v1/delivery/{delivery_uuid}/ (or PATCH)
* Auth Required: Yes (Staff/Admin, or Vendor associated with products)
* Request Body:
  ```json
  {
    "status": "IN_TRANSIT",
    "carrier_details": "GIG Logistics - Tracking ID: GIG-8902HK",
    "estimated_delivery": "2026-08-23T18:00:00Z"
  }
  ```
* Response 200 OK: Returns updated delivery payload.

---

## 14. Notifications
All paths prefixed with /api/v1/notifications/

### 14.1 List User Notifications
* Endpoint: GET /api/v1/notifications/
* Auth Required: Yes
* Response 200 OK:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "e9a0cc81-1bf3-4fb3-bb11-098ad819bcda",
        "user": "e44d326f-d1ef-4bfd-a128-d89006cc732a",
        "title": "Goal Completed",
        "message": "Your Save2Own goal S2O-892HKJ is fully funded! Paid order ORD-GT29BHX has been placed.",
        "is_read": false,
        "notification_type": "SAVE2OWN", // "SYSTEM" | "ORDER" | "REFUND" | "SAVE2OWN" | "CATALOG"
        "created_at": "2026-08-21T14:30:00Z"
      }
    ]
  }
  ```

### 14.2 Mark Notification as Read
* Endpoint: POST /api/v1/notifications/{notification_uuid}/read/
* Auth Required: Yes
* Response 200 OK: Returns notification payload with "is_read": true.

---

## 15. Admin Actions
All paths prefixed with /api/v1/admin/

### 15.1 Register a new Admin User
* Endpoint: POST /api/v1/admin/users/create-admin/
* Auth Required: Yes (Staff/Admin only)
* Request Body:
  ```json
  {
    "email": "newadmin@dovi.com",
    "password": "SecurePassword123!",
    "first_name": "Jane",
    "last_name": "Smith"
  }
  ```
* Response 201 Created: Returns user profile detail (Role will be ADMIN).

---

## 16. Common & Health

### 16.1 System Health check
* Endpoint: GET /health/
* Auth Required: No (Exempted from API Throttling)
* Response 200 OK:
  ```json
  {
    "status": "healthy",
    "database": "ok",
    "redis": "ok",
    "environment": "production"
  }
  ```

---

## Rate Limit Details & Limits
1. Anonymous / Unauthenticated Requests: Throttled at 100 requests per hour per IP address.
2. Authenticated Requests (Bearer Token): Throttled at 1,000 requests per hour per user account.
3. Exemptions: /health/ and /api/v1/payments/webhook/ are entirely exempt from rate-limiting to protect callbacks and uptime checks.

## Common Error Response shape
If validation or general errors occur, HTTP status code 400 or 403 will return:
{
  "non_field_errors": [
    "Your cart is empty."
  ]
}
Field-specific validation failures will be mapped by field name:
{
  "email": [
    "A user with this email already exists."
  ]
}