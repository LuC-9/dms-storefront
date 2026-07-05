# Phase 2 API Reference

This document covers the Phase 2 APIs added for customer auth, cart and checkout flows, payments, tracking, and admin order operations.

## Conventions

- Protected customer routes require a NextAuth session with `userType: "customer"`.
- Protected admin routes require a NextAuth session with `userType: "admin"`.
- Most protected route errors use the envelope `{ error: { code, message } }`.
- Auth validation routes under `/api/auth/*` have a few special cases noted below.

## Auth

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `GET`, `POST` | `/api/auth/[...nextauth]` | Public | NextAuth-managed credentials flow. `provider=admin` expects `username` + `password`; `provider=customer` expects `email` + `password`. | NextAuth session, callback, CSRF, and sign-in responses | Framework-managed. Used internally by NextAuth and `signIn()`. |
| `POST` | `/api/auth/register` | Public | `{ name, email, password, phone? }` | `{ ok: true }` | `400 VALIDATION_ERROR` with `issues`; `409 EMAIL_EXISTS` |
| `POST` | `/api/auth/forgot-password` | Public | `{ email }` | `{ ok: true, message }` | Always returns the same neutral response, even for unknown or invalid email input |
| `POST` | `/api/auth/reset-password` | Public | `{ token, password }` | `{ ok: true }` | `400 VALIDATION_ERROR` with `issues`; `400 INVALID_TOKEN` |

## Account

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `GET` | `/api/account` | Customer | None | `{ id, name, email, phone }` | `401 UNAUTHORIZED`; `404 NOT_FOUND` |
| `PATCH` | `/api/account` | Customer | `{ name, phone? }` | Updated `{ id, name, email, phone }` | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR` |

## Addresses

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `GET` | `/api/addresses` | Customer | None | `{ items: Address[] }` ordered by default-first, newest-first | `401 UNAUTHORIZED` |
| `POST` | `/api/addresses` | Customer | `{ label?, fullName, phone, line1, line2?, city, state, pincode, isDefault? }` | Created `Address` | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR` |
| `PATCH` | `/api/addresses/[id]` | Customer | Partial address payload; same fields as create | Updated `Address` | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR`; `404 NOT_FOUND` |
| `DELETE` | `/api/addresses/[id]` | Customer | None | `{ ok: true }` | `401 UNAUTHORIZED`; `404 NOT_FOUND` |

## Cart

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `GET` | `/api/cart` | Customer | None | `{ id, userId, updatedAt, subtotalInPaise, items[] }` where each item includes product snapshot data | `401 UNAUTHORIZED` |
| `POST` | `/api/cart/items` | Customer | `{ productId, quantity }` | `{ cart }` with refreshed cart state | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR`; `400 INVALID_QUANTITY`; `404 PRODUCT_NOT_FOUND`; `409 PRODUCT_UNAVAILABLE` |
| `PATCH` | `/api/cart/items/[id]` | Customer | `{ quantity }` where `0` removes the item | `{ cart }` | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR`; `404 CART_ITEM_NOT_FOUND` |
| `DELETE` | `/api/cart/items/[id]` | Customer | None | `{ cart }` | `401 UNAUTHORIZED`; `404 CART_ITEM_NOT_FOUND` |
| `POST` | `/api/cart/merge` | Customer | `{ items: [{ productId, quantity }] }` | `{ cart }` | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR` |

## Checkout

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `POST` | `/api/checkout` | Customer | `{ addressId, notes?, provider? }` where `provider` is `razorpay` or `simulator` | `201 { orderNumber, orderId, paymentId, totalInPaise, currency, provider }` | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR`; `400 EMPTY_CART`; `404 ADDRESS_NOT_FOUND`; `409 PRODUCT_UNAVAILABLE` |

## Orders

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `GET` | `/api/orders?limit=&cursor=` | Customer | None | `{ items: [{ orderNumber, status, totalInPaise, paymentStatus, createdAt, itemCount }], nextCursor }` | `401 UNAUTHORIZED` |
| `GET` | `/api/orders/[orderNumber]` | Customer | None | Full order detail including totals, timestamps, `shippingAddress`, `items`, and `paymentSummary` | `401 UNAUTHORIZED`; `404 NOT_FOUND` |
| `POST` | `/api/orders/[orderNumber]/cancel` | Customer | None | Updated `Order` | `401 UNAUTHORIZED`; `404 NOT_FOUND`; `409 INVALID_ORDER_STATE`; `409 INVALID_ORDER_TRANSITION` |
| `GET` | `/api/track/[orderNumber]?email=` | Public | Query string `email` is required | `{ orderNumber, status, paymentStatus, totalInPaise, currency, createdAt, shipping: { city, state }, timeline, items }` | `400 EMAIL_REQUIRED`; `404 NOT_FOUND` |

## Payments

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `POST` | `/api/payments/create` | Customer | `{ orderNumber }` | `{ provider, providerOrderId, amountInPaise, currency, clientKey?, clientOptions }` | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR`; `404 NOT_FOUND` for order/customer; `404 PAYMENT_NOT_FOUND`; `409 ORDER_PAYMENT_NOT_PENDING` |
| `POST` | `/api/payments/verify` | Customer | `{ orderNumber, providerOrderId, providerPaymentId, providerSignature }` | `{ ok: true, orderNumber }` or `{ ok: true, orderNumber, idempotent: true }` when already completed | `401 UNAUTHORIZED`; `400 VALIDATION_ERROR`; `400 PAYMENT_ORDER_MISMATCH`; `400 PAYMENT_VERIFICATION_FAILED`; `404 NOT_FOUND`; `404 PAYMENT_NOT_FOUND` |
| `POST` | `/api/payments/webhook` | Public | Raw provider payload; Razorpay uses `X-Razorpay-Signature` | `{ ok: true }` | Always returns `200` even for rejected, duplicate, or unknown events to keep webhook delivery idempotent |
| `POST` | `/api/payments/simulate-sign` | Customer | `{ providerOrderId, providerPaymentId }` | `{ providerSignature }` | `401 UNAUTHORIZED`; `404 NOT_FOUND` when simulator is inactive or payment is missing; `400 VALIDATION_ERROR` |

## Admin Orders

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `GET` | `/api/admin/orders?status=&q=&assignedTo=&limit=&cursor=` | Admin | None | `{ items: [{ id, orderNumber, customerName, customerEmail, itemCount, totalInPaise, status, paymentStatus, createdAt, assignedAdminId }], nextCursor }` | `401 UNAUTHORIZED` |
| `GET` | `/api/admin/orders/[id]` | Admin | None | Full admin order detail from `getAdminOrderDetailsById()` including items, payments, customer, assignee, parsed address, and timestamps | `401 UNAUTHORIZED`; `404 NOT_FOUND` |
| `PATCH` | `/api/admin/orders/[id]/status` | Admin, except `EMPLOYEE` cannot update | `{ status, notes? }` | `{ order }` with refreshed admin detail | `401 UNAUTHORIZED`; `403 FORBIDDEN`; `400 VALIDATION_ERROR`; `404 NOT_FOUND`; `409 INVALID_ORDER_TRANSITION` |
| `PATCH` | `/api/admin/orders/[id]/assign` | `SUPER_ADMIN` or `ADMIN` | `{ assignedAdminId: string | null }` | `{ order }` with refreshed admin detail | `401 UNAUTHORIZED`; `403 FORBIDDEN`; `400 VALIDATION_ERROR`; `404 NOT_FOUND`; `404 ADMIN_NOT_FOUND` |

## Admin Users

| Method | Path | Auth | Request body | Success response | Error codes / notes |
|---|---|---|---|---|---|
| `GET` | `/api/admin/users` | `SUPER_ADMIN` | None | `AdminUser[]` with `id`, `username`, `name`, `email`, `role`, `createdAt` | Returns `403 FORBIDDEN` when session is missing or role is insufficient |
| `POST` | `/api/admin/users` | `SUPER_ADMIN` | `{ username, password, name?, email?, role }` | `201` created admin summary | `403 FORBIDDEN`; `400 VALIDATION_ERROR`; `409 DUPLICATE_ADMIN` |
| `PATCH` | `/api/admin/users/[id]` | `SUPER_ADMIN` | Any subset of `{ role, name, email, password }` | Updated admin summary | `403 FORBIDDEN`; `400 VALIDATION_ERROR`; `404 NOT_FOUND`; `409 DUPLICATE_ADMIN`; `409 LAST_SUPER_ADMIN` |
| `DELETE` | `/api/admin/users/[id]` | `SUPER_ADMIN` | None | `{ ok: true }` | `403 FORBIDDEN`; `404 NOT_FOUND`; `409 LAST_SUPER_ADMIN` |

## Request Schema Notes

- Address phones must match the Indian mobile pattern `^[6-9]\d{9}$`.
- Address pincodes must be 6 digits.
- Cart quantities are capped at `99`.
- Checkout `provider` is optional and, when omitted, falls back to provider selection logic.
- Order-status updates use the Prisma `OrderStatus` enum values verbatim.
