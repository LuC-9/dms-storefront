import { describe, expect, it } from "vitest";
import * as validators from "../../lib/validators";

const productCreateSchema =
  "productCreateSchema" in validators
    ? (validators.productCreateSchema as typeof validators.productSchema)
    : validators.productSchema;

describe("product schema smoke tests", () => {
  it("accepts a valid product payload", () => {
    const result = productCreateSchema.safeParse({
      name: "Test Valve",
      slug: "test-valve",
      description: "A valid test product description",
      priceInPaise: 12_345,
      imageUrl: "https://example.com/valve.png",
      sku: "VALVE-123",
      inStock: true,
      categoryId: "ck8w3q8f70000j29z2e9b3f8a",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = productCreateSchema.safeParse({
      slug: "test-valve",
      description: "A valid test product description",
      priceInPaise: 12_345,
      imageUrl: "https://example.com/valve.png",
      inStock: true,
      categoryId: "ck8w3q8f70000j29z2e9b3f8a",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "name")).toBe(
        true,
      );
    }
  });

  it("rejects negative price", () => {
    const result = productCreateSchema.safeParse({
      name: "Test Valve",
      slug: "test-valve",
      description: "A valid test product description",
      priceInPaise: -1,
      imageUrl: "https://example.com/valve.png",
      inStock: true,
      categoryId: "ck8w3q8f70000j29z2e9b3f8a",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "priceInPaise"),
      ).toBe(true);
    }
  });
});
