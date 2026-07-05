import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const TEST_DATABASE_URL = "file:./prisma/test.db";

export default async function refundsGlobalSetup() {
  (process.env as Record<string, string>).NODE_ENV = "test";
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  const testDbPath = path.resolve(process.cwd(), "prisma", "test.db");
  const testDbWalPath = `${testDbPath}-wal`;
  const testDbShmPath = `${testDbPath}-shm`;

  if (existsSync(testDbPath)) rmSync(testDbPath);
  if (existsSync(testDbWalPath)) rmSync(testDbWalPath);
  if (existsSync(testDbShmPath)) rmSync(testDbShmPath);

  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
  });
}
