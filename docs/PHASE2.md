# Phase 2 Guide

## Overview

Phase 2 turns Delta Mill Store from a catalogue-first application into a commerce flow with customer accounts, persistent carts, checkout, payments, order tracking, and role-gated admin order operations.

What shipped:

- Customer identity: registration, login, saved profile data, addresses, forgot-password, and reset-password.
- Commerce core: cart, checkout, order creation, payment records, order timelines, and public tracking.
- Payment abstraction: Razorpay when gateway credentials are configured, otherwise a local simulator for development.
- Admin isolation and RBAC: staff-only auth, middleware protection for `/admin/*` and `/api/admin/*`, role-aware navigation, and protected order-management actions.

## Architecture At A Glance

### Stack

- Next.js App Router with TypeScript
- Prisma ORM against SQLite
- NextAuth v4 with JWT session strategy
- Zod validation for request payloads
- Razorpay SDK integration behind a provider interface

### Dual auth model

- Staff and customers both authenticate through NextAuth, but with separate credentials providers.
- `admin` provider authenticates against `prisma.adminUser` by `username`.
- `customer` provider authenticates against `prisma.user` by `email`.
- Sessions carry a `userType` discriminator:
  - `admin` sessions include `role: SUPER_ADMIN | ADMIN | MANAGER | EMPLOYEE`
  - `customer` sessions include `role: "customer"`

### Admin isolation

- `middleware.ts` protects `/admin/*` and `/api/admin/*` with `getToken()` from `next-auth/jwt`.
- Only tokens with `userType === "admin"` are allowed through.
- Page requests redirect to `/admin/login`.
- Admin API requests return `401` JSON.
- The public storefront header does not expose admin links.

### Payment abstraction

- `lib/payments/provider.ts` defines a provider interface for create, verify, and webhook handling.
- `lib/payments/select.ts` chooses the active provider:
  - `razorpay` when both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are present
  - otherwise `simulator`
  - `PAYMENT_PROVIDER` can override selection explicitly
- Payment APIs under `app/api/payments/*` run on `runtime = "nodejs"` so they can use raw body handling and crypto primitives.

### Order state machine

Allowed transitions:

```text
PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
   |            |             |
   +---------> CANCELLED <----+
```

Role notes:

- `SUPER_ADMIN` and `ADMIN` may perform any valid transition.
- `MANAGER` may perform valid transitions except cancelling after `SHIPPED`.
- `EMPLOYEE` cannot change order state.
- Customers may only cancel their own `PENDING` orders.

Timestamp fields are set during transitions:

- `confirmedAt`
- `shippedAt`
- `deliveredAt`
- `cancelledAt`

## Data Model

Monetary values are stored as integer paise. Order currency defaults to `INR`.

| Model | Status | Key fields |
|---|---|---|
| `AdminUser` | Updated | `username`, `passwordHash`, `role`, `name`, `email`, `createdAt`, `updatedAt` |
| `User` | New | `name`, `email`, `passwordHash`, `phone`, `createdAt`, `updatedAt`; owns addresses, cart, orders, reset tokens |
| `Address` | New | `userId`, `label`, `fullName`, `phone`, `line1`, `line2`, `city`, `state`, `pincode`, `isDefault` |
| `PasswordResetToken` | New | `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt` |
| `Cart` | New | `userId`, `createdAt`, `updatedAt`; one cart per customer |
| `CartItem` | New | `cartId`, `productId`, `quantity`, `createdAt`, `updatedAt`; unique on `cartId + productId` |
| `Order` | New | `orderNumber`, `userId`, `guestEmail`, `status`, `subtotalInPaise`, `shippingInPaise`, `taxInPaise`, `totalInPaise`, `currency`, `paymentStatus`, `shippingAddressJson`, `notes`, `assignedAdminId`, lifecycle timestamps |
| `OrderItem` | New | `orderId`, `productId`, `productNameSnapshot`, `productSlugSnapshot`, `unitPriceInPaise`, `quantity`, `lineTotalInPaise` |
| `Payment` | New | `orderId`, `provider`, `providerOrderId`, `providerPaymentId`, `providerSignature`, `amountInPaise`, `currency`, `status`, `methodDetailsJson`, `errorMessage` |

Supporting enums:

- `AdminRole`: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE`
- `OrderStatus`: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- `PaymentStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

Implementation notes:

- `Order.shippingAddressJson` stores a JSON-stringified snapshot of the selected address at checkout time.
- Order numbers are generated in `DMS-YYYYMMDD-XXXXX` format.
- Customer carts and order items keep product references plus snapshots needed for history views.

## Setup

### Environment variables

Reference values live in `.env.example`.

| Var | Purpose | Required? | Default |
|---|---|---|---|
| `DATABASE_URL` | Prisma database connection string | Yes | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Signs JWT sessions and auth tokens | Yes | None |
| `NEXTAUTH_URL` | Base URL for callbacks and reset-link generation | Yes | `http://localhost:3000` |
| `RAZORPAY_KEY_ID` | Razorpay key id for gateway checkout | Only when using Razorpay | None |
| `RAZORPAY_KEY_SECRET` | Razorpay secret for order creation and signature verification | Only when using Razorpay | None |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies `/api/payments/webhook` payloads | Only when using Razorpay webhooks | None |
| `PAYMENT_PROVIDER` | Explicit provider override: `simulator` or `razorpay` | No | Auto-select: `razorpay` when keys exist, else `simulator` |
| `SIMULATOR_SECRET` | Optional HMAC secret for simulator signatures | No | Derived from `NEXTAUTH_SECRET` when unset |
| `SHIPPING_FLAT_PAISE` | Flat shipping charge in paise | No | `0` |

### Local development quickstart

```powershell
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Seed credentials

- Admin: `admin1` / `pwd1` at `/admin/login`
- Customer: `demo@deltamill.local` / `Password123!` at `/login`

## Feature Walkthroughs

### Customer signup, login, and reset

Customer entry points:

- `/register`
- `/login`
- `/forgot-password`
- `/reset-password`

Flow summary:

1. Registration writes a new `User` with a bcrypt password hash.
2. Customer login uses the `customer` NextAuth credentials provider.
3. Forgot-password invalidates prior unused reset tokens for that user, creates a new SHA-256 token hash, and sets a 60-minute expiry.
4. Reset-password accepts the raw token plus a new password, hashes the password, and marks the token as used.

Local-development note:

- In non-production environments the reset URL is logged to the server console.
- No email sender is wired in this phase.

### Cart: guest vs signed-in

Guest behavior:

- Guest cart state is stored in browser `localStorage` under `dms.cart`.
- Quantities are clamped to `1..99`.

Signed-in behavior:

- Customer cart state is persisted in Prisma through `Cart` and `CartItem`.
- `/api/cart` returns product snapshots needed for the drawer and cart page.

Merge on login:

- After a customer session becomes active, `CartProvider` posts guest items to `/api/cart/merge`.
- Quantities are summed and capped at `99`.
- Unknown or unavailable products are ignored during merge.
- Guest cart storage is cleared after a successful merge attempt.

Customer UI routes and components:

- Product pages expose an `Add to cart` action.
- Cart drawer and `/cart` show quantities, pricing, and remove/clear controls.
- Reusable helpers: `<Price>`, `<QuantityStepper>`, and upgraded `components/ui/sheet.tsx`.

### Checkout stepper flow

Route: `/checkout`

The checkout page is a three-step client flow:

1. `Address` - load saved addresses or add a new one inline.
2. `Review` - inspect items, shipping, and optional notes.
3. `Payment` - create the order, create the initial payment record, then launch the selected payment provider.

Important behavior:

- Checkout requires a customer session and redirects guests to `/login?callbackUrl=/checkout`.
- If the cart is empty, the customer is sent back to `/cart`.
- Order creation happens when step 3 initializes.
- The selected address is snapshotted into `Order.shippingAddressJson`.
- Cart items are moved into `OrderItem` rows and then removed from the live cart.

Related customer pages on disk:

- `/order/confirmation/[orderNumber]`
- `/account`
- `/account/addresses`
- `/account/orders`
- `/account/orders/[orderNumber]`
- `/orders/track/[orderNumber]`

### Payments: Razorpay test mode vs simulator

Provider selection:

- Set `PAYMENT_PROVIDER="razorpay"` to force Razorpay.
- Set `PAYMENT_PROVIDER="simulator"` to force the built-in simulator.
- If `PAYMENT_PROVIDER` is unset, provider selection is automatic.

Razorpay mode:

- `/api/payments/create` creates a Razorpay order through the SDK.
- The client loads `https://checkout.razorpay.com/v1/checkout.js`.
- Payment verification checks the HMAC signature using `providerOrderId|providerPaymentId`.
- Webhooks use the `X-Razorpay-Signature` header and raw request body.

Simulator mode:

- `/api/payments/create` prepares a local provider order id.
- The checkout widget opens a "Simulated Payment · Test Mode" modal with success and failure actions.
- `/api/payments/simulate-sign` returns a local HMAC signature so the client can complete the same verify round-trip.

Outcome handling:

- Successful verification marks `Payment.status = COMPLETED`.
- The owning order is moved from `PENDING` to `CONFIRMED`.
- Failed verification marks the payment `FAILED`.
- Webhook processing is idempotent when the payment is already in the target state.

### Order lifecycle and tracking

Internal lifecycle:

```text
PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
   |
   +-> CANCELLED
```

Order APIs support:

- Customer order list and detail
- Customer cancellation for `PENDING` orders only
- Public tracking via `/orders/track/[orderNumber]`
- Admin list, detail, assignment, and status updates

Tracking behavior:

- Public API route: `GET /api/track/[orderNumber]?email=`
- Public page route: `/orders/track/[orderNumber]`
- Tracking matches the provided email against `order.guestEmail` or `order.user.email`
- The public response intentionally strips full address data and exposes only destination city/state, status, payment status, and key timestamps

### Admin dashboard and staff operations

Admin entry points:

- `/admin/login`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/orders/mine`
- `/admin/users`

Role-aware navigation:

| Role | Sidebar items |
|---|---|
| `SUPER_ADMIN` | Dashboard, Orders, Products, Categories, Employees, Admin Users |
| `ADMIN` | Dashboard, Orders, Products, Categories, Employees |
| `MANAGER` | Dashboard, Orders, Employees |
| `EMPLOYEE` | My Orders |

Staff flow summary:

- Admin login uses `signIn("admin", ...)` and is visually marked as a staff portal.
- `/admin/orders` supports filtering, search, pagination, and assignment-aware views.
- `/admin/orders/[id]` shows items, payment history, address snapshot, timeline, and state actions constrained by role.
- `/admin/orders/mine` is the assigned-order view used by employees and also available to other staff.
- `/admin/users` is SUPER_ADMIN-only and guards against deleting or demoting the last SUPER_ADMIN.

Presentation helpers exported for reuse:

- `OrderStatusBadge`
- `PaymentStatusBadge`
- `OrderTimeline`

Color mapping:

- Order: `PENDING` amber, `CONFIRMED` blue, `PROCESSING` violet, `SHIPPED` indigo, `DELIVERED` green, `CANCELLED` red
- Payment: `PENDING` amber, `COMPLETED` green, `FAILED` red, `REFUNDED` slate

For the full permission matrix, see `docs/admin/ROLES.md`.

## Troubleshooting

- Missing auth setup: if `NEXTAUTH_SECRET` or `NEXTAUTH_URL` is missing, sign-in and token checks will fail.
- Wrong payment mode: if you expect Razorpay but keys are blank, the app falls back to the simulator unless `PAYMENT_PROVIDER` forces `razorpay`.
- Webhook signature failure: verify `RAZORPAY_WEBHOOK_SECRET` and make sure the handler receives the raw body before JSON parsing.
- Admin vs customer access: admin sessions cannot use customer-only protected APIs, and customer sessions cannot access `/admin/*` or `/api/admin/*`.
- Forgot-password debugging: reset links are only emitted to server logs outside production; there is no mail delivery in this phase.
- Empty checkout: `/api/checkout` returns `EMPTY_CART` when the customer reaches payment with no cart items.
- Address mismatch: `/api/checkout` returns `ADDRESS_NOT_FOUND` when the selected address does not belong to the signed-in customer.
