# Admin RBAC Matrix

All admin routes are hidden from public users. The public storefront header does not expose an admin link, and middleware blocks `/admin/*` plus `/api/admin/*` unless the session token has `userType === "admin"`.

## Route And Action Matrix

Legend:

- `[x]` allowed
- `[ ]` not allowed

| Route / action | SUPER_ADMIN | ADMIN | MANAGER | EMPLOYEE | Notes |
|---|---|---|---|---|---|
| Admin sign-in at `/admin/login` | `[x]` | `[x]` | `[x]` | `[x]` | Uses the `admin` NextAuth credentials provider |
| Dashboard at `/admin` | `[x]` | `[x]` | `[x]` | `[ ]` | EMPLOYEE sidebar routes to `/admin/orders/mine` only |
| Orders list at `/admin/orders` | `[x]` | `[x]` | `[x]` | `[ ]` | EMPLOYEE is redirected to `/admin/orders/mine` |
| Assigned orders at `/admin/orders/mine` | `[x]` | `[x]` | `[x]` | `[x]` | Employee-focused view; other staff can also use it |
| Order detail at `/admin/orders/[id]` | `[x]` | `[x]` | `[x]` | `[x]` | Detail view is accessible; mutation actions remain role-gated |
| Admin users page at `/admin/users` | `[x]` | `[ ]` | `[ ]` | `[ ]` | Page requires `requireAdminSession("SUPER_ADMIN")` |
| `GET /api/admin/orders` | `[x]` | `[x]` | `[x]` | `[x]` | Supports filters, search, pagination, and `assignedTo=me` |
| `GET /api/admin/orders/[id]` | `[x]` | `[x]` | `[x]` | `[x]` | Returns full order detail |
| `PATCH /api/admin/orders/[id]/status` | `[x]` | `[x]` | `[x]` | `[ ]` | MANAGER follows transition rules; EMPLOYEE gets `403 FORBIDDEN` |
| `PATCH /api/admin/orders/[id]/assign` | `[x]` | `[x]` | `[ ]` | `[ ]` | Only SUPER_ADMIN and ADMIN can assign or unassign orders |
| `GET /api/admin/users` | `[x]` | `[ ]` | `[ ]` | `[ ]` | Insufficient role returns `403 FORBIDDEN` |
| `POST /api/admin/users` | `[x]` | `[ ]` | `[ ]` | `[ ]` | Creates new admin/staff users |
| `PATCH /api/admin/users/[id]` | `[x]` | `[ ]` | `[ ]` | `[ ]` | Can change role, name, email, and password |
| `DELETE /api/admin/users/[id]` | `[x]` | `[ ]` | `[ ]` | `[ ]` | Also clears `assignedAdminId` on affected orders |

## Sidebar Visibility

| Role | Visible navigation |
|---|---|
| `SUPER_ADMIN` | Dashboard, Orders, Products, Categories, Employees, Admin Users |
| `ADMIN` | Dashboard, Orders, Products, Categories, Employees |
| `MANAGER` | Dashboard, Orders, Employees |
| `EMPLOYEE` | My Orders |

## Order State Transition Matrix

Legend:

- `[x]` transition allowed when the current order state matches the row
- `[ ]` transition blocked

| Transition | SUPER_ADMIN | ADMIN | MANAGER | EMPLOYEE | Notes |
|---|---|---|---|---|---|
| `PENDING -> CONFIRMED` | `[x]` | `[x]` | `[x]` | `[ ]` | Normal post-payment or manual processing step |
| `PENDING -> CANCELLED` | `[x]` | `[x]` | `[x]` | `[ ]` | Customers may also cancel their own pending orders |
| `CONFIRMED -> PROCESSING` | `[x]` | `[x]` | `[x]` | `[ ]` | Starts fulfilment |
| `CONFIRMED -> CANCELLED` | `[x]` | `[x]` | `[x]` | `[ ]` | Allowed before shipment |
| `PROCESSING -> SHIPPED` | `[x]` | `[x]` | `[x]` | `[ ]` | Sets `shippedAt` |
| `PROCESSING -> CANCELLED` | `[x]` | `[x]` | `[x]` | `[ ]` | Allowed before shipment |
| `SHIPPED -> DELIVERED` | `[x]` | `[x]` | `[x]` | `[ ]` | Final fulfilment step |
| `SHIPPED -> CANCELLED` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | Invalid in the state machine |

Customer note:

- Customers can only perform `PENDING -> CANCELLED` on their own orders through `POST /api/orders/[orderNumber]/cancel`.

Timestamp side effects:

- `CONFIRMED` sets `confirmedAt`
- `SHIPPED` sets `shippedAt`
- `DELIVERED` sets `deliveredAt`
- `CANCELLED` sets `cancelledAt`

## SUPER_ADMIN Guards

The admin-user API enforces two explicit safety rules:

- The last remaining `SUPER_ADMIN` cannot be demoted.
- The last remaining `SUPER_ADMIN` cannot be deleted.
