import { describe, expect, it } from "vitest";
import type { OrderStatus } from "@prisma/client";
import {
  ORDER_STATUS_TRANSITIONS,
  OrderStateError,
  applyTransitionTimestamps,
  assertTransition,
  canTransition,
} from "@/lib/state-machine";

describe("state machine transitions", () => {
  it("returns transition validity from graph", () => {
    const statuses = Object.keys(ORDER_STATUS_TRANSITIONS) as Array<keyof typeof ORDER_STATUS_TRANSITIONS>;

    for (const current of statuses) {
      for (const next of statuses) {
        const expected = ORDER_STATUS_TRANSITIONS[current].has(next);
        expect(canTransition(current, next)).toBe(expected);
      }
    }
  });

  it("allows SUPER_ADMIN and ADMIN on valid transitions", () => {
    expect(() => assertTransition("PENDING", "CONFIRMED", "SUPER_ADMIN")).not.toThrow();
    expect(() => assertTransition("PROCESSING", "SHIPPED", "ADMIN")).not.toThrow();
  });

  it("applies MANAGER restrictions", () => {
    expect(() => assertTransition("PROCESSING", "CANCELLED", "MANAGER")).not.toThrow();
    expect(() => assertTransition("SHIPPED", "CANCELLED", "MANAGER")).toThrow(OrderStateError);
  });

  it("blocks EMPLOYEE transitions", () => {
    expect(() => assertTransition("PENDING", "CONFIRMED", "EMPLOYEE")).toThrow(OrderStateError);
  });

  it("allows customer only from PENDING to CANCELLED", () => {
    expect(() => assertTransition("PENDING", "CANCELLED", "customer")).not.toThrow();
    expect(() => assertTransition("CONFIRMED", "CANCELLED", "customer")).toThrow(OrderStateError);
  });
});

describe("applyTransitionTimestamps", () => {
  it("sets exactly one status timestamp field", () => {
    const expectedKeyMap = {
      CONFIRMED: "confirmedAt",
      SHIPPED: "shippedAt",
      DELIVERED: "deliveredAt",
      CANCELLED: "cancelledAt",
      PENDING: undefined,
      PROCESSING: undefined,
    } as const;

    for (const [next, expectedKey] of Object.entries(expectedKeyMap)) {
      const result = applyTransitionTimestamps({ status: "PENDING" }, next as OrderStatus);
      const keys = Object.keys(result);
      if (!expectedKey) {
        expect(keys).toEqual([]);
      } else {
        expect(keys).toEqual([expectedKey]);
        expect((result as Record<string, unknown>)[expectedKey]).toBeInstanceOf(Date);
      }
    }
  });
});
