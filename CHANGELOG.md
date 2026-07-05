# Changelog

## [Phase 3] - 2026-07-05

### Added
- `POST /api/cart/merge` for authenticated guest-cart reconciliation using `{ items: [{ productId, quantity }] }`, with skipped unavailable items returned to the client.
- Deterministic payment simulator support with dedicated checkout card-entry UI, mock transaction IDs in the `SIM-{timestamp}-{random}` format, and logged payment attempts in the `Payment` table.
- Admin order detail payment history for reviewing recent payment attempts, statuses, and failure reasons.

### Changed
- Customer authentication flows now merge guest cart contents from `localStorage` into the server-side cart, using the higher quantity for overlapping products and surfacing skipped items via toast feedback.
- Public-facing storefront pages now use the Delta Mill industrial design system, including the new palette, Oswald and IBM Plex typography, square interactive controls, responsive layouts, reduced-motion handling, and Specification Plate metadata treatment.
- Seeded catalogue media now uses relevant Unsplash imagery across all 25 categories and 34 products instead of placeholder image URLs.

## [Phase 2] - 2026-07-04

### Added
- Customer identity and commerce models in Prisma: `User`, `Address`, `PasswordResetToken`, `Cart`, `CartItem`, `Order`, `OrderItem`, and `Payment`.
- Dual NextAuth credentials flows for staff and customers, plus customer registration, login, forgot-password, and reset-password flows.
- Customer APIs for addresses, cart management, checkout, account profile updates, order history, order detail, order cancellation, and public order tracking by email.
- Payment provider abstraction with Razorpay integration, simulator fallback, signature verification, webhook handling, and a checkout payment widget.
- Admin order-management UI and APIs for order listing, detail, assignment, status updates, assigned-order views, and SUPER_ADMIN-only admin-user management.
- Storefront cart drawer, `/cart`, `/checkout`, account pages, order confirmation, public tracking page, `<Price>`, `<QuantityStepper>`, and upgraded sheet primitives.

### Changed
- `AdminUser` now stores `role`, `name`, `email`, and `updatedAt`; admin navigation and visibility now adapt to role.
- Public header now exposes customer sign-in/register flows and customer account actions instead of public admin links.
- Orders now persist address snapshots, payment state, lifecycle timestamps, and generated order numbers in the `DMS-YYYYMMDD-XXXXX` format.
- Cart behavior now supports guest storage in `localStorage` and merges guest items into the signed-in cart after customer login.

### Security
- Admin routes are isolated by middleware and session checks that require `userType === "admin"`.
- Password reset tokens are stored as SHA-256 hashes, expire after 60 minutes, and are marked one-time-use after reset.
- Razorpay and simulator payment verification use HMAC-SHA256 signatures; Razorpay comparisons use constant-time checks.
- SUPER_ADMIN safeguards prevent demoting or deleting the last remaining SUPER_ADMIN account.

### Migrations
- Prisma schema expanded for customer, cart, order, payment, and RBAC support while keeping SQLite as the local datastore.
- Seed data now creates a SUPER_ADMIN bootstrap account (`admin1` / `pwd1`), a demo customer (`demo@deltamill.local` / `Password123!`), and a default customer address.
- Local setup now requires applying the latest Prisma migration and seeding before testing Phase 2 checkout and admin-order flows.
