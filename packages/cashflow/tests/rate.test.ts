import { describe, it, expect } from "vitest";
import { rate } from "../src/index";

describe("rate", () => {
  it("Finds rate for $200k mortgage with $1199.10/month payment", () => {
    const result = rate("360", "-1199.10", "200000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toNumber()).toBeCloseTo(0.005, 3);
    }
  });

  it("Finds rate for simple loan", () => {
    const result = rate("10", "-100", "800", "0");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toNumber()).toBeCloseTo(0.0417, 2);
    }
  });
});
