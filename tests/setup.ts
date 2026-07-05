import { afterAll, beforeEach } from "vitest";
import { clearDatabase, disconnectTestDb, TEST_DATABASE_URL } from "@/tests/helpers/db";

(process.env as Record<string, string>).NODE_ENV = "test";
process.env.DATABASE_URL = TEST_DATABASE_URL;

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnectTestDb();
});
