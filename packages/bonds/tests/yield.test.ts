import { describe, it, expect } from "vitest";
import { bondYield, bondPrice } from "../src/index";

describe("bondYield", () => {
  it("recovers yield when price = par (coupon rate = yield)", () => {
    const result = bondYield({
      faceValue: "1000",
      couponRate: "0.06",
      frequency: 2,
      periods: 20,
      marketPrice: "1000",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toNumber()).toBeCloseTo(0.06, 6);
    }
  });

  it("premium bond has lower yield than coupon rate", () => {
    const result = bondYield({
      faceValue: "1000",
      couponRate: "0.08",
      frequency: 2,
      periods: 20,
      marketPrice: "1100",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toNumber()).toBeLessThan(0.08);
    }
  });

  it("discount bond has higher yield than coupon rate", () => {
    const result = bondYield({
      faceValue: "1000",
      couponRate: "0.04",
      frequency: 2,
      periods: 20,
      marketPrice: "900",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toNumber()).toBeGreaterThan(0.04);
    }
  });

  it("round-trip: price → yield → price", () => {
    const originalYield = "0.07";
    const input = {
      faceValue: "1000",
      couponRate: "0.05",
      frequency: 2 as const,
      periods: 30,
    };

    const price = bondPrice({ ...input, yieldRate: originalYield });

    const result = bondYield({ ...input, marketPrice: price.toString() });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toNumber()).toBeCloseTo(0.07, 8);
    }
  });

  it("zero-coupon bond yield", () => {
    // Zero-coupon, 10 years, semiannual, price = 500, face = 1000
    // (1 + y/2)^20 = 2 → y/2 = 2^(1/20) - 1 → y ≈ 0.07052
    const result = bondYield({
      faceValue: "1000",
      couponRate: "0",
      frequency: 2,
      periods: 20,
      marketPrice: "500",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toNumber()).toBeCloseTo(0.07052, 3);
    }
  });
});
