import { describe, expect, it } from "vitest";
import { computeOrderTotals, generateOrderNumber } from "@/lib/orders";

describe("generateOrderNumber", () => {
  it("matches required DMS format", () => {
    const value = generateOrderNumber(new Date("2026-07-04T00:00:00.000Z"));
    expect(value).toMatch(/^DMS-\d{8}-[A-Z0-9]{5}$/);
  });

  it("generates unique values in 100 runs", () => {
    const values = new Set(Array.from({ length: 100 }, () => generateOrderNumber()));
    expect(values.size).toBe(100);
  });
});

describe("computeOrderTotals", () => {
  it("computes subtotal and total from quantity and prices", () => {
    const input = {
      items: [
        { quantity: 2, unitPriceInPaise: 1250 },
        { quantity: 1, unitPriceInPaise: 5499 },
        { quantity: 3, unitPriceInPaise: 299 },
      ],
      shippingInPaise: 800,
      taxInPaise: 450,
    };

    const result = computeOrderTotals(input);
    const expectedSubtotal = 2 * 1250 + 1 * 5499 + 3 * 299;
    expect(result.subtotalInPaise).toBe(expectedSubtotal);
    expect(result.totalInPaise).toBe(expectedSubtotal + input.shippingInPaise + input.taxInPaise);
  });
});
