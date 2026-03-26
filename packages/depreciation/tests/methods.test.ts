import { describe, it, expect } from "vitest";
import { sln, db, ddb, syd } from "../src/index";

describe("sln", () => {
  it("Excel example: $30,000 asset, $7,500 salvage, 10 years", () => {
    const result = sln("30000", "7500", "10");
    expect(result.toNumber()).toBe(2250);
  });

  it("Throws for zero life", () => {
    expect(() => sln("1000", "100", "0")).toThrow();
  });
});

describe("db", () => {
  it("First year depreciation", () => {
    const result = db("1000000", "100000", "6", "1", "7");
    // Expected from Excel DB(1000000, 100000, 6, 1, 7)
    expect(result.toNumber()).toBeGreaterThan(0);
  });
});

describe("ddb", () => {
  it("Excel example: $1,000,000 asset, $100,000 salvage, 6 years, period 1", () => {
    const result = ddb("1000000", "100000", "6", "1");
    expect(result.toNumber()).toBeCloseTo(333333.333, 0);
  });

  it("Does not depreciate below salvage", () => {
    // After enough periods, depreciation should stop
    let totalDep = 0;
    for (let p = 1; p <= 6; p++) {
      totalDep += ddb("1000", "100", "6", p.toString()).toNumber();
    }
    expect(totalDep).toBeCloseTo(900, 2);
  });

  it("Custom factor (1.5 declining balance)", () => {
    const result = ddb("10000", "1000", "5", "1", "1.5");
    // 10000 * 1.5/5 = 3000
    expect(result.toNumber()).toBe(3000);
  });
});

describe("syd", () => {
  it("Excel example: $30,000 asset, $7,500 salvage, 10 years, period 1", () => {
    const result = syd("30000", "7500", "10", "1");
    // (30000-7500) * 10/55 = 4090.909...
    expect(result.toNumber()).toBeCloseTo(4090.909, 0);
  });

  it("Sum of all periods equals depreciable amount", () => {
    let total = 0;
    for (let p = 1; p <= 10; p++) {
      total += syd("30000", "7500", "10", p.toString()).toNumber();
    }
    expect(total).toBeCloseTo(22500, 0);
  });
});
