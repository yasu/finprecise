import { describe, it, expect } from "vitest";
import { effectiveAnnualRate, nominalAnnualRate, periodicRate, periodsPerYear, } from "../src/index";
describe("periodsPerYear", () => {
    it("monthly = 12", () => expect(periodsPerYear("monthly")).toBe(12));
    it("quarterly = 4", () => expect(periodsPerYear("quarterly")).toBe(4));
    it("semiannual = 2", () => expect(periodsPerYear("semiannual")).toBe(2));
    it("annual = 1", () => expect(periodsPerYear("annual")).toBe(1));
    it("daily = 365", () => expect(periodsPerYear("daily")).toBe(365));
    it("continuous = Infinity", () => expect(periodsPerYear("continuous")).toBe(Infinity));
});
describe("effectiveAnnualRate", () => {
    it("monthly compounding at 12% nominal", () => {
        const ear = effectiveAnnualRate("0.12", "monthly");
        // (1 + 0.12/12)^12 - 1 = 0.126825...
        expect(ear.toNumber()).toBeCloseTo(0.126825, 4);
    });
    it("continuous compounding at 10%", () => {
        const ear = effectiveAnnualRate("0.10", "continuous");
        // e^0.10 - 1 = 0.10517...
        expect(ear.toNumber()).toBeCloseTo(0.10517, 4);
    });
    it("annual compounding: EAR equals nominal rate", () => {
        const ear = effectiveAnnualRate("0.05", "annual");
        expect(ear.toNumber()).toBeCloseTo(0.05, 10);
    });
});
describe("nominalAnnualRate", () => {
    it("round-trips with effectiveAnnualRate (monthly)", () => {
        const ear = effectiveAnnualRate("0.12", "monthly");
        const nominal = nominalAnnualRate(ear, "monthly");
        expect(nominal.toNumber()).toBeCloseTo(0.12, 8);
    });
    it("continuous: ln(1 + EAR)", () => {
        const ear = effectiveAnnualRate("0.10", "continuous");
        const nominal = nominalAnnualRate(ear, "continuous");
        expect(nominal.toNumber()).toBeCloseTo(0.10, 8);
    });
});
describe("periodicRate", () => {
    it("monthly rate from 12% annual", () => {
        const pr = periodicRate("0.12", "monthly");
        expect(pr.toNumber()).toBeCloseTo(0.01, 10);
    });
    it("throws for continuous compounding", () => {
        expect(() => periodicRate("0.10", "continuous")).toThrow();
    });
});
//# sourceMappingURL=rate.test.js.map