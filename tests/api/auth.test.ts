import { describe, expect, it } from "vitest";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3100";

describe("admin route protections", () => {
  it("GET /api/admin/stats without auth is blocked", async () => {
    const response = await fetch(`${baseUrl}/api/admin/stats`, {
      redirect: "manual",
    });

    expect([307, 401]).toContain(response.status);
  });

  it("POST /api/admin/products without auth is blocked", async () => {
    const response = await fetch(`${baseUrl}/api/admin/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      redirect: "manual",
    });

    expect([307, 401]).toContain(response.status);
  });

  it("GET /admin unauthenticated redirects to login", async () => {
    const response = await fetch(`${baseUrl}/admin`, {
      redirect: "manual",
    });

    expect([307, 401]).toContain(response.status);
    if (response.status === 307) {
      expect(response.headers.get("location")).toContain("/admin/login");
    }
  });

  it("GET /admin/login unauthenticated returns the page", async () => {
    const response = await fetch(`${baseUrl}/admin/login`, {
      redirect: "manual",
    });

    expect(response.status).toBe(200);
  });
});
