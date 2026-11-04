# DOVI — Complete Resend Email Infrastructure & Design System

> **Brand Tagline:** *Dovi — Shop Smart. Feel Good.*  
> **Brand Primary Colour:** Dovi Orange (`#ff7a00`)  
> **Text Colour:** Sophisticated Dark Charcoal (`#1f2937`)  
> **Container Background:** Subtle Warm Grey (`#f8f9fa`)  
> **Email Shell:** Clean White Surface (`#ffffff`) with 1px border (`#e5e7eb`) and 12px border radius.

---

## 1. Architecture Overview

The Dovi email infrastructure is a centralized, production-grade delivery system built using the official **Resend Python SDK** and REST API, paired with a React 19 + TypeScript Admin Management Dashboard.

```
                    ┌────────────────────────────┐
                    │    Application Triggers    │
                    │   (Auth, Orders, Escrow,   │
                    │      Refunds, Disputes)    │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │   EmailService (Central)   │
                    │  - Idempotency Deduplication│
                    │  - Dedicated Senders       │
                    │  - HTML & Text Rendering   │
                    └─────────────┬──────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       ┌──────────────────────┐        ┌──────────────────────┐
       │   EmailLog & Attempt │        │ Async Delivery Thread│
       │   SQLite / PostgreSQL│        │ Exponential Backoff  │
       └──────────────────────┘        └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │   Resend API / SDK   │
                                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │ Recipient's Inbox    │
                                       └──────────────────────┘
                                                  │
                                      (Webhook: Delivered/Bounced)
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │ Svix Signature Check │
                                       │  /webhooks/resend/   │
                                       └──────────────────────┘
```

---

## 2. Dedicated Senders & Visual Identity

To maintain sender reputation and organize inboxes for students and vendors, Dovi uses dedicated sender identities based on the event category:

| Category | Sender Identity | Address Format |
|---|---|---|
| **Account & Welcome** | Dovi | `hello@<domain>` |
| **Security & Auth** | Dovi Security | `security@<domain>` |
| **Orders & Delivery** | Dovi Orders | `notifications@<domain>` |
| **Escrow & Financial** | Dovi Orders | `notifications@<domain>` |
| **Support & Disputes** | Dovi Support | `support@<domain>` |

---

## 3. The 33 Implemented Transactional Email Templates

All 33 templates are implemented in [`backend/emails/templates.py`](backend/emails/templates.py) with dual-mode rendering: responsive inline-styled HTML and a plain-text MIME alternative. All monetary values are automatically formatted with the Nigerian Naira symbol (`₦`).

### A. Account Emails (5)
1. **Welcome Email** (`ACCOUNT_WELCOME`): Welcomes student buyers/vendors, introduces Dovi core perks, and links to explore deals.
2. **Email Verification** (`ACCOUNT_EMAIL_VERIFICATION`): Secure verification code/link with 24-hour expiration notice.
3. **Password Reset** (`ACCOUNT_PASSWORD_RESET`): One-click password reset token button with security alert.
4. **Password Changed** (`ACCOUNT_PASSWORD_CHANGED`): Immediate security notification when account password is updated.
5. **Security Login Alert** (`ACCOUNT_SECURITY_LOGIN_ALERT`): Notifies user of new sign-in with IP, device, and timestamp.

### B. Buyer Emails (9)
6. **Order Confirmation** (`BUYER_ORDER_CONFIRMATION`): Itemized order receipt with SKU, prices, shipping address, and tracking link.
7. **Payment Successful** (`BUYER_PAYMENT_SUCCESSFUL`): Payment confirmation with transaction reference and payment provider details.
8. **Payment Failed** (`BUYER_PAYMENT_FAILED`): Actionable notification with failure reason and 1-click retry payment link.
9. **Order Processing** (`BUYER_ORDER_PROCESSING`): Notifies buyer that vendor has acknowledged and is packing the order.
10. **Order Dispatched** (`BUYER_ORDER_DISPATCHED`): Out-for-delivery notification with courier name, tracking ID, and expected delivery.
11. **Order Delivered** (`BUYER_ORDER_DELIVERED`): Delivery confirmation asking buyer to confirm package receipt to release escrow.
12. **Order Cancelled** (`BUYER_ORDER_CANCELLED`): Notifies buyer of order cancellation and automated refund status.
13. **Refund Initiated** (`BUYER_REFUND_INITIATED`): Acknowledges refund request approval and expected bank processing timeline.
14. **Refund Completed** (`BUYER_REFUND_COMPLETED`): Notifies buyer that funds have arrived back in their bank account.

### C. Seller Emails (7)
15. **New Order Received** (`SELLER_NEW_ORDER`): Urgent notification to vendor with item details, delivery method, and fulfillment instructions.
16. **Seller Payment Confirmed** (`SELLER_PAYMENT_CONFIRMED`): Confirms buyer funds are secured in Dovi Escrow.
17. **Order Cancelled** (`SELLER_ORDER_CANCELLED`): Alerts vendor that an order was cancelled before dispatch so items can be restocked.
18. **Fulfillment Reminder** (`SELLER_FULFILLMENT_REMINDER`): 24h reminder to dispatch pending order before automated SLA cancellation.
19. **Payout Initiated** (`SELLER_PAYOUT_INITIATED`): Notification that escrow settlement payout has been queued to vendor bank.
20. **Payout Successful** (`SELLER_PAYOUT_SUCCESSFUL`): Settlement complete with bank name, last 4 digits of account, and reference.
21. **Payout Failed** (`SELLER_PAYOUT_FAILED`): Alerts vendor of payout rejection due to invalid bank details, with fix link.

### D. Escrow & Dispute Emails (7)
22. **Payment Secured in Escrow** (`ESCROW_PAYMENT_SECURED`): Reassures buyer that money is safely held in escrow until receipt.
23. **Order Awaiting Fulfillment** (`ESCROW_AWAITING_FULFILLMENT`): Escrow status holding notice awaiting seller handoff.
24. **Order Awaiting Confirmation** (`ESCROW_AWAITING_CONFIRMATION`): Prompting buyer to confirm delivery within the 48h confirmation window.
25. **Escrow Release Notification** (`ESCROW_RELEASED`): Confirms funds have been released to the vendor following successful delivery.
26. **Dispute Opened** (`DISPUTE_OPENED`): Notifies buyer and seller that a formal escrow dispute case has been opened.
27. **Dispute Update** (`DISPUTE_UPDATE`): Communication notification regarding dispute investigation and required evidence.
28. **Dispute Resolved** (`DISPUTE_RESOLVED`): Official resolution outcome (full refund, partial settlement, or release to seller).

### E. Platform & Support Emails (5)
29. **Platform Announcement** (`PLATFORM_ANNOUNCEMENT`): Broadcast message for service updates, holiday campus schedules, or maintenance.
30. **Support Ticket Received** (`SUPPORT_TICKET_RECEIVED`): Confirmation of ticket creation with reference number and SLA time.
31. **Support Response** (`SUPPORT_RESPONSE`): Dovi customer support agent response to open customer inquiry.
32. **Account Restriction / Suspension** (`ACCOUNT_SUSPENDED`): Formal compliance notice regarding terms of service violations.
33. **Important Policy Updates** (`POLICY_UPDATE`): Notice of updated buyer protection, vendor terms, or campus delivery guidelines.

---

## 4. Production Delivery Infrastructure

### Central Service: `EmailService`
Located in [`backend/emails/services.py`](backend/emails/services.py):
- **Idempotency Protection:** Each transactional email can specify an `idempotency_key` (e.g. `buyer-order-confirm-{order_reference}`). If Resend webhooks or payment callbacks fire repeatedly, duplicate sends are rejected instantly.
- **Asynchronous Execution:** Background worker thread handles API transmission so checkout and payment response times are unaffected (<15ms).
- **Exponential Backoff:** If Resend returns transient network errors (HTTP 429, 500, 502, 503, 504, or socket timeouts), the worker retries with exponential backoff:
  $$\text{delay} = 2^{\text{attempt}} \text{ seconds (2s, 4s, 8s)}$$
- **Permanent Failure Shield:** HTTP 401 (bad credentials) or 422 (malformed address) are logged immediately as `FAILED` without burning retry quotas.
- **Delivery Logging:** Every attempt is recorded in `EmailDeliveryAttempt` with latency in ms, HTTP response code, and error trace.
- **Webhook Synchronization:** Integrated Svix signature verification handles Resend webhooks to transition emails from `ACCEPTED` to `DELIVERED`, `BOUNCED`, or `COMPLAINED`.

---

## 5. Admin Dashboard Email Management

Located in [`admin/src/pages/EmailManagementPage.tsx`](admin/src/pages/EmailManagementPage.tsx) accessible via `/emails`:

1. **KPI Metric Cards:**
   - Total Emails Sent
   - Delivery Success Rate (%)
   - Accepted / In Transit
   - Bounced / Failed Deliveries
2. **Search & Filtration:**
   - Real-time search across recipients, subjects, and Resend Message IDs.
   - Category filtering (`ACCOUNT`, `BUYER`, `SELLER`, `ESCROW`, `SUPPORT`).
   - Delivery Status filtering (`QUEUED`, `ACCEPTED`, `DELIVERED`, `BOUNCED`, `FAILED`).
3. **Email Delivery Log Table:**
   - Recipient with avatar & badge.
   - Subject & Type label.
   - Status badge with color coding (Green: Delivered, Blue: Accepted, Yellow: Queued, Red: Failed/Bounced).
   - Monospace truncated Resend Message ID.
   - Timestamp and attempt counter.
4. **Email Inspector Modal:**
   - Complete technical details (Sender, Reply-To, Idempotency Key, Created/Sent/Delivered timestamps).
   - Tabbed view: **Rendered HTML** in sandboxed responsive iframe, **Plain Text** alternative, and **Delivery Attempt Logs** with latency and error messages.
5. **Manual Retry Action:**
   - 1-click retry button for any failed or bounced email directly from the admin dashboard.
6. **Send Test Email Modal:**
   - Allows administrators to select any of the 33 templates, input a test recipient address, and dispatch an immediate test email with realistic sample data.
7. **Platform Announcement Broadcaster:**
   - Broadcast platform announcements to customers with custom title, body message, and optional CTA button URL.
8. **Configuration Drawer:**
   - Non-secret overview of configured sending addresses, base application URL, webhook endpoint, and masked Resend API key (`re_xxxx...xxxx`). Never reveals secret tokens.

---

## 6. Required Environment Variables

Add the following environment variables to your production environment (Render, Railway, Heroku, or `.env`):

```bash
# ============================================================
# RESEND EMAIL CONFIGURATION
# ============================================================

# Your live Resend API Key (starts with re_)
RESEND_API_KEY=your_resend_api_key_here

# Verified Sending Domain and Addresses
# NOTE: Replace with your actual verified domain registered in Resend
MAIL_FROM_ADDRESS=hello@dovishop.com
MAIL_FROM_NAME="Dovi"
MAIL_REPLY_TO=support@dovishop.com

# Base Application URL (used in email CTA buttons)
APP_URL=https://dovishop.com

# Resend Webhook Signing Secret (starts with whsec_)
RESEND_WEBHOOK_SECRET=whsec_your_resend_webhook_signing_secret
```

---

## 7. Resend Webhook Configuration

To receive real-time delivery confirmations and bounce tracking:

1. Log in to your [Resend Dashboard](https://resend.com/webhooks).
2. Navigate to **Webhooks** and click **Add Webhook**.
3. Set the **Endpoint URL** to:
   ```
   https://<your-backend-domain>/api/v1/emails/webhooks/resend/
   ```
4. Select the following events:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
5. Click **Create Webhook**.
6. Copy the **Signing Secret** (starts with `whsec_`) and set it as `RESEND_WEBHOOK_SECRET` in your backend environment variables.

---

## 8. Automated Testing & Verification

### Run the Backend Email Test Suite
```powershell
.\backend\.venv\Scripts\python.exe backend\manage.py test emails
```
*Expected Output:*
```
Ran 8 tests in 0.085s
OK
```

### Build Frontend and Admin
```powershell
npm --prefix frontend run build
npm --prefix admin run build
```
*Both builds complete with exit code 0.*

### Programmatic Python Usage
To send an email from any view or model in Django:

```python
from emails.services import EmailService

# High-Level Trigger Example
EmailService.trigger_welcome(
    user_email="student@unilag.edu.ng",
    user_name="Emeka",
    login_url="https://dovishop.com/login"
)

EmailService.trigger_order_confirmation(
    buyer_email="student@unilag.edu.ng",
    buyer_name="Emeka",
    order_reference="DOV-ORD-8821",
    order_items=[{"name": "Dovi Scientific Calculator", "quantity": 1, "price": 18500}],
    total_amount="18500",
    delivery_address="Hall 4, Room 210, UNILAG Main Campus"
)
```
