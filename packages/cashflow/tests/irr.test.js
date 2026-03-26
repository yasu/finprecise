import { describe, it, expect } from "vitest";
import { irr, xirr, mirr } from "../src/index";
import { npv, xnpv } from "../src/index";
describe("irr", () => {
    it("Standard IRR example (numpy-financial)", () => {
        const result = irr(["-100", "39", "59", "55", "20"]);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.toNumber()).toBeCloseTo(0.28095, 3);
        }
    });
    it("Simple investment and return (numpy-financial)", () => {
        const result = irr(["-1000", "300", "300", "300", "300"]);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.toNumber()).toBeCloseTo(0.07714, 3);
        }
    });
    it("IRR → NPV ≈ 0 consistency", () => {
        const result = irr(["-100", "39", "59", "55", "20"]);
        expect(result.ok).toBe(true);
        if (result.ok) {
            const npvAtIrr = npv(result.value, ["-100", "39", "59", "55", "20"]);
            expect(npvAtIrr.toNumber()).toBeCloseTo(0, 6);
        }
    });
    it("Returns SolveResult with iteration count", () => {
        const result = irr(["-100", "110"]);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.iterations).toBeGreaterThan(0);
            expect(result.value.toNumber()).toBeCloseTo(0.10, 5);
        }
    });
});
describe("xirr", () => {
    it("Excel XIRR example", () => {
        const result = xirr({
            cashflows: [
                { amount: "-10000", date: "2008-01-01" },
                { amount: "2750", date: "2008-03-01" },
                { amount: "4250", date: "2008-10-30" },
                { amount: "3250", date: "2009-02-15" },
                { amount: "2750", date: "2009-04-01" },
            ],
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.toNumber()).toBeCloseTo(0.373363, 3);
        }
    });
    it("XIRR → XNPV ≈ 0 consistency", () => {
        const cfs = [
            { amount: "-100000", date: "2025-01-10" },
            { amount: "25000", date: "2025-06-30" },
            { amount: "90000", date: "2026-03-01" },
        ];
        const result = xirr({ cashflows: cfs });
        expect(result.ok).toBe(true);
        if (result.ok) {
            const npvAtXirr = xnpv(result.value, cfs);
            expect(npvAtXirr.toNumber()).toBeCloseTo(0, 4);
        }
    });
    it("Returns error for insufficient cashflows", () => {
        const result = xirr({
            cashflows: [{ amount: "-100", date: "2025-01-01" }],
        });
        expect(result.ok).toBe(false);
    });
});
describe("mirr", () => {
    it("MIRR with 10% finance and 12% reinvest (numpy-financial)", () => {
        const result = mirr(["-100", "50", "40", "30", "20"], "0.10", "0.12");
        // PV neg=-100, FV pos=50*1.12^3+40*1.12^2+30*1.12+20=174.0224
        // MIRR = (174.0224/100)^(1/4) - 1 ≈ 0.14855
        expect(result.toNumber()).toBeCloseTo(0.14855, 3);
    });
    it("Throws for all positive cashflows", () => {
        expect(() => mirr(["100", "200"], "0.10", "0.12")).toThrow();
    });
});
describe("npv", () => {
    it("NPV at 10% discount rate (numpy-financial)", () => {
        const result = npv("0.10", ["-100", "39", "59", "55", "20"]);
        expect(result.toNumber()).toBeCloseTo(36.089, 0);
    });
});
//# sourceMappingURL=irr.test.js.map