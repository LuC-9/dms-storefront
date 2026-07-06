# Agent instructions

## Cursor Cloud specific instructions

- Standard setup, Prisma, test, and app commands are documented in `README.md`; keep using those as the source of truth for normal local development.
- In Cursor Cloud, start the Next.js dev server with `npm run dev -- --hostname 0.0.0.0` so it is reachable from both `localhost:3000` and the VM network interface.
- The default local checkout path uses `PAYMENT_PROVIDER=simulator`; no Razorpay credentials are needed to exercise customer cart, checkout, payment verification, or admin order-detail flows.
- `npm run lint` currently invokes `next lint` and fails with `Invalid project directory provided, no such directory: /workspace/lint`. Until the script is updated, use the README-documented fallback `npx tsc --noEmit` for the reliable validation pass.
- With the SQLite provider, admin order search via `/api/admin/orders?q=...` currently hits Prisma's unsupported `mode: "insensitive"` filter and returns 500. Use the admin order detail endpoint or the unfiltered list for local verification until that query is fixed.
