import { describe, expect, it } from "vitest";
import { formatInr, slugify } from "../../lib/utils";

describe("formatInr", () => {
  it("formats zero paise as zero rupees", () => {
    expect(formatInr(0)).toBe("₹0");
  });

  it("formats 100000 paise as one thousand rupees", () => {
    expect(formatInr(100_000)).toBe("₹1,000");
  });

  it("matches the current output for large numbers", () => {
    expect(formatInr(12_345_678)).toMatchInlineSnapshot(`"₹1,23,457"`);
  });
});

describe("slugify", () => {
  it("slugifies a regular product name", () => {
    expect(slugify("H Guru Pressure Gauge")).toBe("h-guru-pressure-gauge");
  });

  it("removes punctuation and parenthesis", () => {
    expect(slugify("Belt Lacing (Industrial)")).toBe(
      "belt-lacing-industrial",
    );
  });
});
