## Cursor Cloud specific instructions

- This is a single Next.js/Prisma SQLite app; there are no separate database, queue, or Docker services required for local development. Use the README quick start as the source of truth for the standard migrate/seed/dev commands.
- `npm run lint` currently invokes `next lint`, which fails in this environment with `Invalid project directory provided, no such directory: /workspace/lint`. Use the README-documented fallback `npx tsc --noEmit` when a reliable lint/type-check pass is needed.
- `npm test` runs the configured Vitest suite against its own SQLite test database and may leave generated local database files behind; do not commit those generated artifacts.
