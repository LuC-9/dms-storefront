import { describe, expect, it } from "vitest";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3100";

describe("public API routes", () => {
  it("GET /api/categories returns 25 seeded categories", async () => {
    const response = await fetch(`${baseUrl}/api/categories`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(25);
  });

  it("GET /api/products returns 34 seeded products", async () => {
    const response = await fetch(`${baseUrl}/api/products`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(34);
  });

  it("GET /api/products/search?q=valve returns valve-like matches", async () => {
    const response = await fetch(`${baseUrl}/api/products/search?q=valve`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(
      data.some(
        (item: { name?: string; description?: string }) =>
          /valve/i.test(item.name ?? "") || /valve/i.test(item.description ?? ""),
      ),
    ).toBe(true);
  });

  it("GET /api/products/search?q= returns empty array", async () => {
    const response = await fetch(`${baseUrl}/api/products/search?q=`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it("GET /api/products/nonexistent-slug returns 404", async () => {
    const response = await fetch(`${baseUrl}/api/products/nonexistent-slug`);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toMatchObject({ error: "Product not found" });
  });

  it("GET /api/categories/valves-valve-fittings returns category with products", async () => {
    const response = await fetch(
      `${baseUrl}/api/categories/valves-valve-fittings`,
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data?.slug).toBe("valves-valve-fittings");
    expect(Array.isArray(data?.products)).toBe(true);
    expect(data.products.length).toBeGreaterThanOrEqual(3);
  });
});
