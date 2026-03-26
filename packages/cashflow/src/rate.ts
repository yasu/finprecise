import {
  Decimal,
  toDecimal,
  type DecimalLike,
  type PaymentTiming,
  type SolverConfig,
  type SolveResult,
  solve,
  DEFAULT_SOLVER,
} from "@finprecise/core";
import { pv } from "./tvm.js";

/**
 * Solve for the interest rate per period.
 *
 * Finds rate r such that PV(r, nper, pmt, fv) + pv = 0.
 *
 * Compatible with Excel RATE() and numpy-financial rate().
 *
 * @param nper - Number of periods
 * @param pmt - Payment per period
 * @param pvVal - Present value
 * @param fv - Future value (default 0)
 * @param timing - Payment timing (default "end")
 * @param solver - Solver configuration (optional)
 */
export function rate(
  nper: DecimalLike,
  pmt: DecimalLike,
  pvVal: DecimalLike,
  fv: DecimalLike = 0,
  timing: PaymentTiming = "end",
  solver: Partial<SolverConfig> = {},
): SolveResult {
  // Estimate an initial guess based on simple interest approximation
  const n = toDecimal(nper);
  const p = toDecimal(pmt);
  const pvD = toDecimal(pvVal);
  const fD = toDecimal(fv);
  const totalPmt = p.mul(n).abs();
  const principal = pvD.abs();
  let initialGuess = "0.01";
  if (principal.gt(0) && totalPmt.gt(0)) {
    // Simple estimate: (total payments - principal) / (principal * nper)
    const interest = totalPmt.minus(principal).minus(fD.abs());
    if (interest.gt(0)) {
      initialGuess = interest.div(principal.mul(n)).toString();
    }
  }

  const cfg: SolverConfig = { ...DEFAULT_SOLVER, guess: initialGuess, ...solver };

  // Find r such that pv(r, nper, pmt, fv) = pvVal
  const f = (r: Decimal): Decimal => {
    const computed = pv(r, nper, pmt, fv, timing);
    return computed.minus(pvD);
  };

  // Numerical derivative (central difference)
  const fPrime = (r: Decimal): Decimal => {
    const h = new Decimal("1e-8");
    const f1 = f(r.add(h));
    const f2 = f(r.minus(h));
    return f1.minus(f2).div(h.mul(2));
  };

  return solve(f, fPrime, cfg);
}
