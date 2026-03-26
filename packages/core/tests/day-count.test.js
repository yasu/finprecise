import { describe, it, expect } from "vitest";
import { yearFrac, daysBetween } from "../src/index";
describe("daysBetween", () => {
    it("counts actual days correctly", () => {
        expect(daysBetween("2025-01-01", "2025-04-01")).toBe(90);
        expect(daysBetween("2025-01-01", "2025-07-01")).toBe(181);
        expect(daysBetween("2024-01-01", "2024-03-01")).toBe(60); // leap year
        expect(daysBetween("2025-01-01", "2026-01-01")).toBe(365);
    });
});
describe("yearFrac", () => {
    it("act/365-fixed: 6 months from Jan 1 to Jul 1", () => {
        const result = yearFrac("2025-01-01", "2025-07-01", "act/365-fixed");
        expect(result.toNumber()).toBeCloseTo(181 / 365, 5);
    });
    it("act/360: 90 days", () => {
        const result = yearFrac("2025-01-01", "2025-04-01", "act/360");
        expect(result.toNumber()).toBeCloseTo(90 / 360, 5);
    });
    it("30/360: 6 months", () => {
        const result = yearFrac("2025-01-01", "2025-07-01", "30/360");
        expect(result.toNumber()).toBeCloseTo(0.5, 5);
    });
    it("30e/360: 6 months", () => {
        const result = yearFrac("2025-01-01", "2025-07-01", "30e/360");
        expect(result.toNumber()).toBeCloseTo(0.5, 5);
    });
    it("act/act-isda: same year", () => {
        const result = yearFrac("2025-01-01", "2025-07-01", "act/act-isda");
        expect(result.toNumber()).toBeCloseTo(181 / 365, 5);
    });
    it("act/act-isda: across years", () => {
        const result = yearFrac("2024-07-01", "2025-07-01", "act/act-isda");
        // 184 days in 2024 (leap year, 366 days) + 181 days in 2025 (365 days)
        const expected = 184 / 366 + 181 / 365;
        expect(result.toNumber()).toBeCloseTo(expected, 5);
    });
    it("handles end-of-month adjustments for 30/360", () => {
        // Jan 31 to Feb 28 → 30 days in 30/360
        const result = yearFrac("2025-01-31", "2025-02-28", "30/360");
        // d1=31→30, d2=28, months: (2-1)=1 → 1*30 + (28-30) = 28 days
        expect(result.toNumber()).toBeCloseTo(28 / 360, 5);
    });
});
describe("yearFrac - Excel compatibility", () => {
    it("YEARFRAC act/365-fixed matches Excel", () => {
        const result = yearFrac("2025-01-01", "2025-07-01", "act/365-fixed");
        expect(result.toNumber()).toBeCloseTo(0.49589, 3);
    });
    it("YEARFRAC 30/360 matches Excel", () => {
        const result = yearFrac("2025-01-01", "2025-07-01", "30/360");
        expect(result.toNumber()).toBeCloseTo(0.5, 3);
    });
    it("YEARFRAC act/360 matches Excel", () => {
        const result = yearFrac("2025-01-01", "2025-04-01", "act/360");
        expect(result.toNumber()).toBeCloseTo(0.25, 3);
    });
});
//# sourceMappingURL=day-count.test.js.map