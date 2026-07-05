import { describe, expect, it } from "vitest";
import { getSimulatorCardOutcome } from "@/lib/payments/simulator";

describe("payment simulator card outcomes", () => {
  it("returns COMPLETED for success card 4111...1111", () => {
    const result = getSimulatorCardOutcome("4111 1111 1111 1111");

    expect(result.status).toBe("COMPLETED");
    expect(result.errorMessage).toBeNull();
    expect(result.methodDetails).toEqual({
      cardLast4: "1111",
      cardType: "visa",
    });
  });

  it("returns FAILED with decline message for card 4000...0002", () => {
    const result = getSimulatorCardOutcome("4000 0000 0000 0002");

    expect(result.status).toBe("FAILED");
    expect(result.errorMessage?.toLowerCase()).toContain("declined");
    expect(result.methodDetails).toEqual({
      cardLast4: "0002",
      cardType: "visa",
    });
  });

  it("returns FAILED with insufficient message for card 4000...9995", () => {
    const result = getSimulatorCardOutcome("4000 0000 0000 9995");

    expect(result.status).toBe("FAILED");
    expect(result.errorMessage?.toLowerCase()).toContain("insufficient");
    expect(result.methodDetails).toEqual({
      cardLast4: "9995",
      cardType: "visa",
    });
  });

  it("documents fallback behavior for unknown cards", () => {
    const result = getSimulatorCardOutcome("5555 4444 3333 2222");

    expect(result.status).toBe("FAILED");
    expect(result.errorMessage?.toLowerCase()).toContain("unsupported");
    expect(result.methodDetails).toEqual({
      cardLast4: "2222",
      cardType: "card",
    });
  });
});
