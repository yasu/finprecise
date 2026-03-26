import { describe, it, expect } from "vitest";
import { bondAnalytics } from "../src/index";

describe("bondAnalytics", () => {
  it("returns all analytics for a par bond", () => {
    const result = bondAnalytics({
      faceValue: "1000",
      couponRate: "0.06",
      yieldRate: "0.06",
      frequency: 2,
      periods: 20,
    });

    expect(result.price.toNumber()).toBeCloseTo(1000, 2);
    expect(result.accruedInterest.toNumber()).toBe(0);
    expect(result.dirtyPrice.toNumber()).toBeCloseTo(1000, 2);
    expect(result.macaulayDuration.toNumber()).toBeGreaterThan(0);
    expect(result.modifiedDuration.toNumber()).toBeGreaterThan(0);
    expect(result.convexity.toNumber()).toBeGreaterThan(0);
  });

  it("dirty price = price + accrued interest", () => {
    const result = bondAnalytics({
      faceValue: "1000",
      couponRate: "0.08",
      yieldRate: "0.05",
      frequency: 2,
      periods: 10,
    });
    const expectedDirty = result.price.add(result.accruedInterest);
    expect(result.dirtyPrice.toNumber()).toBeCloseTo(expectedDirty.toNumber(), 10);
  });
});
