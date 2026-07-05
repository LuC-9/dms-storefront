import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import treeKill from "tree-kill";

const TEST_BASE_URL = "http://localhost:3100";
const STARTUP_TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 1_000;

function killProcessTree(pid: number): Promise<void> {
  return new Promise((resolve, reject) => {
    treeKill(pid, "SIGTERM", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function waitForServerReady(baseUrl: string): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  const endpoint = `${baseUrl}/api/categories`;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is not ready yet.
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Timed out waiting for Next.js dev server at ${endpoint} after ${STARTUP_TIMEOUT_MS}ms`,
  );
}

export default async function globalSetup() {
  process.env.TEST_BASE_URL = TEST_BASE_URL;
  let isShuttingDown = false;

  const devServer = spawn("npm run dev -- --port 3100", {
    shell: true,
    stdio: "pipe",
  });

  devServer.stdout?.on("data", () => {
    // Keep stream in flowing mode to prevent buffer blocking.
  });

  devServer.stderr?.on("data", () => {
    // Keep stream in flowing mode to prevent buffer blocking.
  });

  devServer.on("exit", (code) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`Dev server exited unexpectedly with code ${code}`);
    }
  });

  await waitForServerReady(TEST_BASE_URL);

  return async () => {
    if (devServer.pid) {
      isShuttingDown = true;
      await killProcessTree(devServer.pid);
    }
  };
}
