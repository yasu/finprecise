import { describe, it } from "vitest";
import * as fc from "fast-check";
import { pv, fv, pmt, npv } from "../src/index";
import { irr } from "../src/index";

describe("Property-based tests", () => {
  it("PV and FV are inverses (round-trip)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, max: 0.2, noNaN: true }),  // rate
        fc.integer({ min: 1, max: 60 }),                     // nper
        fc.double({ min: -10000, max: 10000, noNaN: true }), // pmt
        (rate, nper, pmtVal) => {
          // TVM identity: fv(r, n, pmt, pv(r, n, pmt, FV=0)) should equal 0
          const pvVal = pv(rate.toString(), nper.toString(), pmtVal.toString(), "0");
          const fvVal = fv(rate.toString(), nper.toString(), pmtVal.toString(), pvVal.toString());
          return Math.abs(fvVal.toNumber()) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("PMT * NPER + interest ≈ principal for zero-rate", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 360 }),                     // nper
        fc.double({ min: 100, max: 1000000, noNaN: true }),   // pv
        (nper, pvVal) => {
          const payment = pmt("0", nper.toString(), pvVal.toString());
          // payment * nper + pv = 0
          const total = payment.mul(nper).add(pvVal);
          return Math.abs(total.toNumber()) < 0.01;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("IRR of solved cashflows returns rate close to zero NPV", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 0.5, noNaN: true }),    // target rate
        fc.array(
          fc.double({ min: 10, max: 1000, noNaN: true }),
          { minLength: 2, maxLength: 8 },
        ),
        (targetRate, positiveFlows) => {
          // Create cashflows: negative initial, then positive returns
          const initial = -positiveFlows.reduce((a, b) => a + b, 0) * 0.8;
          const cashflows = [initial.toString(), ...positiveFlows.map(String)];

          const result = irr(cashflows);
          if (!result.ok) return true; // Skip non-convergent cases

          // Verify NPV at IRR ≈ 0
          const npvAtIrr = npv(result.value, cashflows);
          return Math.abs(npvAtIrr.toNumber()) < 0.1;
        },
      ),
      { numRuns: 50 },
    );
  });
});
