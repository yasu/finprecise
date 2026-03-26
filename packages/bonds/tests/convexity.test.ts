import { describe, it, expect } from "vitest";
import { bondConvexity } from "../src/index";

describe("bondConvexity", () => {
  it("convexity is positive for a standard bond", () => {
    const convexity = bondConvexity({
      faceValue: "1000",
      couponRate: "0.06",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    expect(convexity.toNumber()).toBeGreaterThan(0);
  });

  it("zero-coupon bond has higher convexity than coupon bond", () => {
    const input = {
      faceValue: "1000",
      yieldRate: "0.05",
      frequency: 2 as const,
      periods: 20,
    };
    const zeroCoupon = bondConvexity({ ...input, couponRate: "0" });
    const withCoupon = bondConvexity({ ...input, couponRate: "0.06" });
    expect(zeroCoupon.toNumber()).toBeGreaterThan(withCoupon.toNumber());
  });

  it("longer maturity → higher convexity", () => {
    const base = {
      faceValue: "1000",
      couponRate: "0.06",
      yieldRate: "0.06",
      frequency: 2 as const,
    };
    const short = bondConvexity({ ...base, periods: 10 });
    const long = bondConvexity({ ...base, periods: 40 });
    expect(long.toNumber()).toBeGreaterThan(short.toNumber());
  });

  it("10-year 6% semiannual par bond convexity", () => {
    const convexity = bondConvexity({
      faceValue: "1000",
      couponRate: "0.06",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });
    // Well-known approximate value: ~68-72
    expect(convexity.toNumber()).toBeGreaterThan(60);
    expect(convexity.toNumber()).toBeLessThan(80);
  });
});
