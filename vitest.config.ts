import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: [
      "tests/lib/refunds.test.ts",
      "tests/api/customer-cancel.test.ts",
      "tests/api/admin-refund.test.ts",
      "tests/api/refund-history.test.ts",
      "tests/api/admin-stats.test.ts",
    ],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/refunds.globalSetup.ts"],
    fileParallelism: false,
  },
});
