import { describe, it, expect } from "vitest";
import { pv, fv, pmt, nper, ipmt, ppmt } from "../src/index";
describe("pv", () => {
    it("PV of $100/month for 10 years at 5% annual (numpy-financial)", () => {
        // Monthly rate = 0.05/12
        const result = pv("0.004166666666667", "120", "-100", "0");
        expect(result.toNumber()).toBeCloseTo(9428.135, 0);
    });
    it("PV with zero rate", () => {
        const result = pv("0", "10", "-100", "0");
        expect(result.toNumber()).toBeCloseTo(1000, 1);
    });
    it("PV annuity due (numpy-financial)", () => {
        const result = pv("0.08", "5", "-1000", "0", "begin");
        expect(result.toNumber()).toBeCloseTo(4312.127, 0);
    });
    it("PV with future value", () => {
        const result = pv("0.05", "10", "0", "-1000");
        // PV = 1000 / 1.05^10 = 613.913...
        expect(result.toNumber()).toBeCloseTo(613.913, 0);
    });
});
describe("fv", () => {
    it("FV of $100/month for 10 years at 5% annual (numpy-financial)", () => {
        const result = fv("0.004166666666667", "120", "-100", "0");
        expect(result.toNumber()).toBeCloseTo(15528.228, 0);
    });
    it("FV with zero rate", () => {
        const result = fv("0", "10", "-100", "0");
        expect(result.toNumber()).toBeCloseTo(1000, 1);
    });
    it("FV with initial PV", () => {
        // $1000 at 5% for 10 years
        const result = fv("0.05", "10", "0", "-1000");
        expect(result.toNumber()).toBeCloseTo(1628.895, 0);
    });
});
describe("pmt", () => {
    it("Monthly payment on $200,000 mortgage at 6% for 30 years (Excel)", () => {
        const result = pmt("0.005", "360", "200000", "0");
        expect(result.toNumber()).toBeCloseTo(-1199.101, 0);
    });
    it("PMT annuity due", () => {
        const result = pmt("0.01", "12", "10000", "0", "begin");
        // PMT = -(10000 * 1.01^12) / ((1.01^12 - 1)/0.01 * 1.01) ≈ -879.691
        expect(result.toNumber()).toBeCloseTo(-879.691, 0);
    });
    it("PMT with zero rate", () => {
        const result = pmt("0", "10", "1000", "0");
        expect(result.toNumber()).toBeCloseTo(-100, 1);
    });
});
describe("nper", () => {
    it("Number of periods to pay off $1000 at $100/month at 1%", () => {
        const result = nper("0.01", "-100", "1000", "0");
        expect(result.toNumber()).toBeCloseTo(10.584, 1);
    });
    it("NPER with zero rate", () => {
        const result = nper("0", "-100", "1000", "0");
        expect(result.toNumber()).toBeCloseTo(10, 1);
    });
});
describe("ipmt", () => {
    it("Interest portion of 1st payment on $200k mortgage at 0.5%/month", () => {
        const result = ipmt("0.005", "1", "360", "200000");
        // First month interest = 200000 * 0.005 = 1000 (negative per sign convention)
        expect(result.toNumber()).toBeCloseTo(-1000, 0);
    });
});
describe("ppmt", () => {
    it("Principal portion = PMT - IPMT", () => {
        const payment = pmt("0.005", "360", "200000");
        const interest = ipmt("0.005", "1", "360", "200000");
        const principal = ppmt("0.005", "1", "360", "200000");
        expect(principal.toNumber()).toBeCloseTo(payment.minus(interest).toNumber(), 2);
    });
});
describe("TVM round-trip consistency", () => {
    it("PV → FV round-trip: fv(r, n, pmt, pv(r,n,pmt,FV)) = FV", () => {
        const pvVal = pv("0.05", "10", "-100", "0");
        // If PV is computed with FV=0, then fv(r, n, pmt, PV) should give back 0
        const fvVal = fv("0.05", "10", "-100", pvVal);
        expect(fvVal.toNumber()).toBeCloseTo(0, 5);
    });
});
//# sourceMappingURL=tvm.test.js.map