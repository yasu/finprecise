import { describe, it, expect } from "vitest";
import { bondDuration } from "../src/index";

describe("bondDuration", () => {
  it("zero-coupon bond: Macaulay duration equals maturity", () => {
    const result = bondDuration({
      faceValue: "1000",
      couponRate: "0",
      yieldRate: "0.05",
      frequency: 1,
      periods: 10,
    });
    // Zero-coupon: Macaulay duration = maturity in years
    expect(result.macaulay.toNumber()).toBeCloseTo(10, 6);
  });

  it("coupon bond: duration < maturity", () => {
    const result = bondDuration({
      faceValue: "1000",
      couponRate: "0.06",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    // 10-year par bond should have duration < 10
    expect(result.macaulay.toNumber()).toBeLessThan(10);
    expect(result.macaulay.toNumber()).toBeGreaterThan(0);
  });

  it("modified duration < Macaulay duration", () => {
    const result = bondDuration({
      faceValue: "1000",
      couponRate: "0.06",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    expect(result.modified.toNumber()).toBeLessThan(result.macaulay.toNumber());
  });

  it("modified = macaulay / (1 + y/freq)", () => {
    const result = bondDuration({
      faceValue: "1000",
      couponRate: "0.08",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    const expected = result.macaulay.toNumber() / (1 + 0.06 / 2);
    expect(result.modified.toNumber()).toBeCloseTo(expected, 6);
  });

  it("higher coupon → lower duration", () => {
    const lowCoupon = bondDuration({
      faceValue: "1000",
      couponRate: "0.02",
      yieldRate: "0.05",
      frequency: 2,
      periods: 20,
    });
    const highCoupon = bondDuration({
      faceValue: "1000",
      couponRate: "0.10",
      yieldRate: "0.05",
      frequency: 2,
      periods: 20,
    });
    expect(highCoupon.macaulay.toNumber()).toBeLessThan(lowCoupon.macaulay.toNumber());
  });

  it("10-year 6% semiannual par bond duration", () => {
    const result = bondDuration({
      faceValue: "1000",
      couponRate: "0.06",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    // Well-known result: ~7.66 years Macaulay duration
    expect(result.macaulay.toNumber()).toBeCloseTo(7.66, 1);
  });
});
