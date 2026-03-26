import { describe, it, expect } from "vitest";
import { bondPrice } from "../src/index";

describe("bondPrice", () => {
  it("par bond: price equals face value when coupon rate = yield", () => {
    const price = bondPrice({
      faceValue: "1000",
      couponRate: "0.06",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    expect(price.toNumber()).toBeCloseTo(1000, 2);
  });

  it("premium bond: price > face value when coupon rate > yield", () => {
    const price = bondPrice({
      faceValue: "1000",
      couponRate: "0.08",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    expect(price.toNumber()).toBeGreaterThan(1000);
    // Expected: ~1148.77 (10-year, 8% coupon, 6% yield, semiannual)
    expect(price.toNumber()).toBeCloseTo(1148.77, 1);
  });

  it("discount bond: price < face value when coupon rate < yield", () => {
    const price = bondPrice({
      faceValue: "1000",
      couponRate: "0.04",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    expect(price.toNumber()).toBeLessThan(1000);
    // Expected: ~851.23
    expect(price.toNumber()).toBeCloseTo(851.23, 0);
  });

  it("zero-coupon bond: price = face / (1+y)^n", () => {
    const price = bondPrice({
      faceValue: "1000",
      couponRate: "0",
      yieldRate: "0.08",
      frequency: 2,
      periods: 20,
    });
    // 1000 / (1.04)^20 = 456.387
    expect(price.toNumber()).toBeCloseTo(456.39, 0);
  });

  it("single period bond", () => {
    const price = bondPrice({
      faceValue: "1000",
      couponRate: "0.10",
      yieldRate: "0.10",
      frequency: 1,
      periods: 1,
    });
    // (100 + 1000) / 1.10 = 1000
    expect(price.toNumber()).toBeCloseTo(1000, 2);
  });

  it("annual coupon, 5-year bond", () => {
    const price = bondPrice({
      faceValue: "100",
      couponRate: "0.05",
      yieldRate: "0.03",
      frequency: 1,
      periods: 5,
    });
    // 5-year, 5% coupon, 3% yield, annual
    // Expected: ~109.16
    expect(price.toNumber()).toBeCloseTo(109.16, 1);
  });
});
