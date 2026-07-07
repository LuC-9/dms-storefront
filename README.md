# Delta Mill Store

> Full-stack industrial commerce platform for **Delta Mill Stores** - industrial hardware & machinery supplier in Kanpur, Uttar Pradesh, India.

Delta Mill Store is a full-stack industrial commerce application for browsing products, managing customer carts and checkout, tracking orders and payments, and operating catalogue and employee workflows through an authenticated admin area. The project is built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style components, Prisma, SQLite, NextAuth, Zod, and Vitest.

## Features

### Public storefront

- Industrial redesign across home, catalogue, category, product detail, cart, checkout, order confirmation, account, auth, contact, search, and `404` pages
- Home page with featured categories and products, plus catalogue navigation optimized for B2B product discovery
- Full catalogue, category detail, product detail, and search flows backed by seeded industrial catalogue data
- Mobile-first responsive layouts with reduced-motion support
- Real Unsplash imagery across all 25 categories and 34 products

### Customer commerce

- Customer registration, sign-in, forgot-password, and password-reset flows
- Guest cart stored in browser `localStorage` and automatically merged into the authenticated server cart after sign-in or registration
- Merge semantics use the higher of guest and existing cart quantities for overlapping products; unavailable items are reported via toast
- Saved addresses, cart drawer, checkout, order confirmation, account profile, order history, and public order tracking
- Payment provider abstraction with Razorpay support and a built-in simulator for local development and testing

### Admin dashboard (auth-protected)

- Admin login via NextAuth credentials and role-gated order operations
- Dashboard stats for products, categories, employees, and current-month salary totals
- Product and category CRUD through protected admin screens and `/api/admin/products` and `/api/admin/categories`
- Order listing, assignment, lifecycle updates, internal notes, and payment history on order detail screens
- Middleware protection for `/admin/**` and `/api/admin/**`

### Employee management

- Employee directory with list, detail, create, update, and delete flows
- Salary history per employee with protected list/create API routes
- Attendance history per employee with protected list/create API routes
- Seeded payroll and attendance records for local development and testing

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (`strict: true`) |
| Styling | Tailwind CSS + shadcn/ui-style component primitives |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth v4 (Credentials + JWT session strategy) |
| Validation | Zod |
| Password hashing | bcryptjs |
| Testing | Vitest |
| Icons | lucide-react |

## Prerequisites

- Node.js 18.17+ or 20+
- npm 9+
- Windows, macOS, or Linux
- The project has been developed and verified on **Windows 11 / PowerShell**

## Quick start

```powershell
# 1. Install dependencies
npm install

# 2. Copy environment variables
Copy-Item .env.example .env

# 3. Apply the committed Prisma migration and create the local SQLite database
npx prisma migrate dev

# 4. Seed the catalogue (25 categories, 34 products, 3 employees)
npx prisma db seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Admin access

```text
Admin URL: http://localhost:3000/admin/login
Username: admin1
Password: pwd1
```

The seeded admin account is intended for local development only. Change the credentials before production use by updating `prisma/seed.ts` or by replacing the bootstrap flow with a secure admin-creation script.

## Phase 3 - Storefront and Checkout Refinement

Phase 3 builds on the Phase 2 commerce foundation with automatic guest-cart merge, a deterministic payment simulator for local checkout testing, and a full public-facing redesign aligned to Delta Mill Stores' industrial identity. Admin dashboard styling remains intentionally unchanged.

See `docs/PHASE2.md` for the commerce implementation guide and `docs/api/README.md` for the broader customer, checkout, payment, and admin API reference.

## Payment Simulator

The default local development payment mode is the built-in simulator, controlled by `PAYMENT_PROVIDER=simulator` in `.env.example`.

- Checkout exposes a dedicated card-entry form for card number, expiry (`MM/YY`), and CVV.
- Successful simulator payments continue to order confirmation; failed attempts return a deterministic error state and can be retried from checkout.
- Every payment attempt is persisted in the `Payment` table, receives a mock transaction ID in the `SIM-{timestamp}-{random}` format, and appears in admin order detail payment history.

Use the following test cards:

| Card number | Outcome |
|---|---|
| `4111 1111 1111 1111` | Payment succeeds |
| `4000 0000 0000 0002` | Payment is declined |
| `4000 0000 0000 9995` | Payment fails with insufficient funds |

## Design system

The public storefront now uses a consistent industrial visual system tuned for a B2B catalogue and checkout experience.

- Palette: `forge-950` `#0D1B2A`, `iron-800` `#1A3148`, `steel-500` `#45637A`, `blueprint-100` `#DCE8F2`, `safety-orange` `#CC5500`, and `alloy-white` `#F0F4F8`
- Typography: Oswald for headings, IBM Plex Sans for body copy, and IBM Plex Mono for data, prices, and system labels
- Interactive controls use square corners throughout the public storefront
- The Specification Plate (`SpecPlate`) component uses a `forge-950` panel with `safety-orange` monospace text for SKU, order, and specification metadata
- Public pages use `blueprint-100` as the primary page background and reduce motion when `prefers-reduced-motion` is enabled

## Environment variables

The repository includes `.env.example` with the following variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Prisma Postgres connection string, for example a Neon URL with `sslmode=require`. |
| `NEXTAUTH_SECRET` | Yes | Secret used by NextAuth to sign and verify session tokens. Replace the placeholder with a strong random value. |
| `NEXTAUTH_URL` | Yes | Base URL for NextAuth callbacks and session handling. Use `http://localhost:3000` in local development. |
| `PAYMENT_PROVIDER` | No | Explicit payment provider override: `simulator` for local testing or `razorpay` for gateway-backed checkout. Defaults to `simulator` in development. |
| `RAZORPAY_KEY_ID` | No | Razorpay public key used when the Razorpay provider is enabled. |
| `RAZORPAY_KEY_SECRET` | No | Razorpay secret key used for server-side payment creation and verification. |
| `RAZORPAY_WEBHOOK_SECRET` | No | Signing secret for `/api/payments/webhook`. |
| `SIMULATOR_SECRET` | No | Optional HMAC secret for simulator signatures; when omitted, the app derives one from `NEXTAUTH_SECRET`. |
| `SHIPPING_FLAT_PAISE` | No | Flat shipping charge stored in paise. Set to `0` for free local shipping during development. |

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the built application in production mode |
| `npm run lint` | Run Next.js linting |
| `npm test` | Run the full Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

Prisma commands:

- `npx prisma migrate dev` - apply committed migrations locally and generate the Prisma client
- `npx prisma migrate dev --name <name>` - create and apply a new migration during schema development
- `npx prisma db seed` - reset the local sample dataset according to `prisma/seed.ts`
- `npx prisma studio` - inspect the database in a browser UI

## Project structure

```text
newApp/
|- app/           Next.js App Router pages, layouts, and API route handlers
|- components/    Reusable storefront, admin, and UI components
|- lib/           Prisma client, auth helpers, validators, and shared utilities
|- prisma/        Prisma schema, committed migrations, and seed script
|- scripts/       Reserved helper-script directory (currently contains `.gitkeep`)
|- tests/         Vitest unit tests, API tests, and global test server setup
|- types/         TypeScript type augmentation for NextAuth session/user types
|- .next/         Generated Next.js development/build artifacts
`- node_modules/  Installed project dependencies
```

Key top-level files:

- `middleware.ts` - protects admin pages and admin API routes
- `package.json` - project metadata, dependencies, and scripts
- `prisma.config.ts` - Prisma configuration, including the migrations path
- `tailwind.config.ts` - Tailwind theme configuration
- `vitest.config.ts` - Vitest configuration and global setup entry

## Data model

The Prisma schema currently defines fourteen application models grouped across catalogue, commerce, identity, and operations:

- Catalogue: `Category` and `Product`
- Admin and customer identity: `AdminUser`, `User`, `Address`, and `PasswordResetToken`
- Commerce: `Cart`, `CartItem`, `Order`, `OrderItem`, and `Payment`
- Operations: `Employee`, `SalaryRecord`, and `AttendanceRecord`

Related schema notes:

- `Payment` stores both successful and failed payment attempts, including simulator transactions
- `AttendanceStatus` is an enum with `PRESENT`, `ABSENT`, `HALF_DAY`, and `LEAVE`
- `SalaryRecord` is unique per employee/month
- `AttendanceRecord` is unique per employee/date

## Seeded data

The seed script in `prisma/seed.ts` creates a realistic local dataset for development:

- 25 categories
- 34 products
- 1 admin user (`admin1` / `pwd1`)
- 3 employees
- 2 salary records per employee (current month and previous month)
- 5 recent attendance records per employee

The seeded product catalogue spans gauges, valves, pumps, drill bits, bearings, steel pipes, flanges, adhesives, seals, belts, and other industrial supply categories.

## API reference

This README lists the core catalogue and admin endpoints below. For the wider commerce API surface, including customer account, cart, checkout, payment, and `/api/cart/merge`, see `docs/api/README.md`.

### Public endpoints (no auth)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/categories` | List all categories with product counts |
| `GET` | `/api/categories/[slug]` | Return one category by slug, including its products |
| `GET` | `/api/products` | List all products; supports `?category=<slug>`, `?limit=<n>`, and `?offset=<n>` |
| `GET` | `/api/products/[slug]` | Return one product by slug, including its category |
| `GET` | `/api/products/search?q=<term>` | Search product names and descriptions; returns `[]` when `q` is empty |

Public route behavior:

- `/api/categories/[slug]` returns `404` when the category slug does not exist
- `/api/products/[slug]` returns `404` when the product slug does not exist
- Search is implemented with Prisma `contains` filters against `name` and `description`

### Admin endpoints (session required)

All routes below are protected by middleware and server-side session checks. Unauthenticated browser requests typically redirect to `/admin/login`; API callers may observe a redirect or a `401` response depending on request context.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/stats` | Return dashboard totals for products, categories, employees, and salary paid this month |
| `GET` | `/api/admin/products` | List all products for admin management |
| `POST` | `/api/admin/products` | Create a product from a validated payload |
| `PUT` | `/api/admin/products/[id]` | Update an existing product |
| `DELETE` | `/api/admin/products/[id]` | Delete a product |
| `GET` | `/api/admin/categories` | List all categories with product counts |
| `POST` | `/api/admin/categories` | Create a category from a validated payload |
| `PUT` | `/api/admin/categories/[id]` | Update an existing category |
| `DELETE` | `/api/admin/categories/[id]` | Delete a category |
| `GET` | `/api/admin/employees` | List all employees with salary/attendance counts |
| `POST` | `/api/admin/employees` | Create a new employee |
| `GET` | `/api/admin/employees/[id]` | Fetch one employee with salary and attendance history |
| `PUT` | `/api/admin/employees/[id]` | Update an employee |
| `DELETE` | `/api/admin/employees/[id]` | Delete an employee |
| `GET` | `/api/admin/employees/[id]/salary` | List salary records for one employee |
| `POST` | `/api/admin/employees/[id]/salary` | Create a salary record for one employee |
| `GET` | `/api/admin/employees/[id]/attendance` | List attendance records for one employee |
| `POST` | `/api/admin/employees/[id]/attendance` | Create an attendance record for one employee |

Validation notes:

- Product, category, employee, salary, and attendance payloads are validated with Zod in `lib/validators.ts`
- Employee `joinDate` and attendance `date` accept ISO datetime strings or date-only strings
- Invalid payloads return `400` with an `issues` array from Zod

Authentication notes:

- NextAuth credentials are configured in `lib/auth.ts`
- Session strategy is JWT-based
- The sign-in page is `/admin/login`
- Auth endpoints under `/api/auth/[...nextauth]` are provided by NextAuth

## Testing

The project includes both unit tests and API integration tests under `tests/`:

- Unit tests cover shared validators and utility helpers
- API tests exercise public routes, admin route protection behavior, and cart-merge logic
- Vitest uses `tests/globalSetup.ts` to boot `npm run dev -- --port 3100` before API tests run

Run the full suite with:

```powershell
npm test
```

## Product catalogue

The seeded catalogue includes **25 categories** and **34 products** spanning valves, gauges, pumps, drill bits, bearings, steel pipes, flanges, seals, adhesives, and other industrial hardware lines relevant to Delta Mill Stores. Seed data now maps every category and product to relevant Unsplash imagery rather than placeholder URLs.

## Store information

- **Business**: Delta Mill Stores (also known as Delta Machinery Store)
- **Contact**: Mr. Vineet Awasthi
- **Phone**: [512-2362054](tel:5122362054)
- **Address**: 78/45 Latouche Road, Anwar Ganj, Mulganj, Kanpur, Uttar Pradesh - 208001, India

## Development notes

- The storefront remains catalogue-led in presentation, but customer carts, checkout, payments, and order history are fully implemented for local commerce workflows
- Local development uses SQLite through Prisma, which keeps setup lightweight on Windows
- Local checkout defaults to the simulator provider unless `PAYMENT_PROVIDER` is overridden
- Guest cart state persists in browser `localStorage` and is merged into the authenticated cart after sign-in
- Admin session checks happen both at the middleware layer and inside protected route handlers

## Troubleshooting

- If `npm run lint` fails with `Invalid project directory`, treat it as a Next.js CLI quirk on Windows and use `npx tsc --noEmit` for a reliable type-check pass.
- If Prisma migration commands fail because the SQLite database is locked, close processes that may hold `dev.db` open, especially the dev server or Prisma Studio, and retry the command.
- Re-running `npx prisma db seed` is safe for local setup, but it is **not** an upsert flow: the seed script deletes existing app data and recreates the seeded records from scratch.
- If the dev server does not shut down cleanly on Windows, use `taskkill /F /IM node.exe` or inspect the port owner with `netstat -ano | findstr :3000`.
- The Vitest API suite starts a Next.js dev server on port `3100`, so make sure that port is free before running `npm test`.

## License

Private / internal use for Delta Mill Stores, Kanpur, India.

Repository note: `package.json` currently declares `MIT`. If this project is intended to remain internal-only, align the package metadata before external distribution.
