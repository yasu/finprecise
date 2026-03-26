import {
  Decimal,
  toDecimal,
  type DecimalLike,
  type PaymentTiming,
} from "@finprecise/core";

/**
 * Time Value of Money functions.
 *
 * Sign convention follows numpy-financial / Excel:
 * - Cash you pay out (investments, deposits) are negative
 * - Cash you receive (returns, income) are positive
 *
 * All functions take DecimalLike inputs for precision safety.
 */

/**
 * Internal helper: compute the "when" flag (0 for end, 1 for begin).
 */
function whenFlag(timing: PaymentTiming): Decimal {
  return timing === "begin" ? new Decimal(1) : new Decimal(0);
}

/**
 * Present Value.
 *
 * Solves for PV in the TVM equation:
 *   0 = PV * (1+r)^n + PMT * ((1+r)^n - 1)/r * (1 + r*when) + FV
 *   PV = -(FV + PMT * ((1+r)^n - 1)/r * (1 + r*when)) / (1+r)^n
 *
 * Compatible with Excel PV() and numpy-financial pv().
 */
export function pv(
  rate: DecimalLike,
  nper: DecimalLike,
  pmt: DecimalLike,
  fv: DecimalLike = 0,
  timing: PaymentTiming = "end",
): Decimal {
  const r = toDecimal(rate);
  const n = toDecimal(nper);
  const p = toDecimal(pmt);
  const f = toDecimal(fv);
  const when = whenFlag(timing);

  if (r.isZero()) {
    return f.add(p.mul(n)).neg();
  }

  const r1n = r.add(1).pow(n);
  const annuityFvFactor = r1n.minus(1).div(r).mul(r.mul(when).add(1));

  return f.add(p.mul(annuityFvFactor)).div(r1n).neg();
}

/**
 * Future Value.
 *
 * Solves for FV in the TVM equation:
 *   0 = PV * (1+r)^n + PMT * ((1+r)^n - 1)/r * (1 + r*when) + FV
 *   FV = -(PV * (1+r)^n + PMT * ((1+r)^n - 1)/r * (1 + r*when))
 *
 * Compatible with Excel FV() and numpy-financial fv().
 */
export function fv(
  rate: DecimalLike,
  nper: DecimalLike,
  pmt: DecimalLike,
  pvVal: DecimalLike = 0,
  timing: PaymentTiming = "end",
): Decimal {
  const r = toDecimal(rate);
  const n = toDecimal(nper);
  const p = toDecimal(pmt);
  const pvD = toDecimal(pvVal);
  const when = whenFlag(timing);

  if (r.isZero()) {
    return pvD.add(p.mul(n)).neg();
  }

  const r1n = r.add(1).pow(n);
  const annuityFvFactor = r1n.minus(1).div(r).mul(r.mul(when).add(1));

  return pvD.mul(r1n).add(p.mul(annuityFvFactor)).neg();
}

/**
 * Payment per period.
 *
 * Solves for PMT in the TVM equation:
 *   PMT = -(PV * (1+r)^n + FV) / (((1+r)^n - 1)/r * (1 + r*when))
 *
 * Compatible with Excel PMT() and numpy-financial pmt().
 */
export function pmt(
  rate: DecimalLike,
  nper: DecimalLike,
  pvVal: DecimalLike,
  fv: DecimalLike = 0,
  timing: PaymentTiming = "end",
): Decimal {
  const r = toDecimal(rate);
  const n = toDecimal(nper);
  const pvD = toDecimal(pvVal);
  const f = toDecimal(fv);
  const when = whenFlag(timing);

  if (r.isZero()) {
    return pvD.add(f).div(n).neg();
  }

  const r1n = r.add(1).pow(n);
  const annuityFvFactor = r1n.minus(1).div(r).mul(r.mul(when).add(1));

  return pvD.mul(r1n).add(f).div(annuityFvFactor).neg();
}

/**
 * Number of periods.
 *
 * Solves for nper in the TVM equation.
 * Compatible with Excel NPER() and numpy-financial nper().
 */
export function nper(
  rate: DecimalLike,
  pmtVal: DecimalLike,
  pvVal: DecimalLike,
  fvVal: DecimalLike = 0,
  timing: PaymentTiming = "end",
): Decimal {
  const r = toDecimal(rate);
  const p = toDecimal(pmtVal);
  const pvD = toDecimal(pvVal);
  const f = toDecimal(fvVal);
  const when = whenFlag(timing);

  if (r.isZero()) {
    return pvD.add(f).div(p).neg();
  }

  // From the TVM equation (0 = PV*(1+r)^n + PMT*((1+r)^n-1)/r*(1+r*when) + FV):
  // Let z = PMT*(1+r*when)/r
  // Then (1+r)^n = (z - FV) / (z + PV)
  // nper = log((z - FV) / (z + PV)) / log(1+r)
  const z = p.mul(r.mul(when).add(1)).div(r);
  const q = z.minus(f).div(z.add(pvD));

  if (q.lte(0)) {
    throw new Error("Cannot compute nper: parameters result in logarithm of non-positive value");
  }

  return q.ln().div(r.add(1).ln());
}

/**
 * Interest portion of a payment for a given period.
 *
 * Compatible with Excel IPMT() and numpy-financial ipmt().
 *
 * @param rate - Interest rate per period
 * @param per - The period (1-based) for which to compute interest
 * @param nper - Total number of periods
 * @param pvVal - Present value
 * @param fvVal - Future value (default 0)
 * @param timing - Payment timing (default "end")
 */
export function ipmt(
  rate: DecimalLike,
  per: DecimalLike,
  nperVal: DecimalLike,
  pvVal: DecimalLike,
  fvVal: DecimalLike = 0,
  timing: PaymentTiming = "end",
): Decimal {
  const r = toDecimal(rate);
  const period = toDecimal(per);

  if (timing === "begin" && period.eq(1)) {
    return new Decimal(0);
  }

  const totalPmt = pmt(rate, nperVal, pvVal, fvVal, timing);
  const adjPer = timing === "begin" ? period.minus(1) : period;

  // Balance at start of the period (after adjPer-1 payments)
  const balanceAtStart = fv(rate, adjPer.minus(1), totalPmt, pvVal, timing);

  // Interest = balance * rate (note: fv already handles sign)
  return balanceAtStart.mul(r);
}

/**
 * Principal portion of a payment for a given period.
 *
 * PPMT = PMT - IPMT
 *
 * Compatible with Excel PPMT() and numpy-financial ppmt().
 */
export function ppmt(
  rate: DecimalLike,
  per: DecimalLike,
  nperVal: DecimalLike,
  pvVal: DecimalLike,
  fvVal: DecimalLike = 0,
  timing: PaymentTiming = "end",
): Decimal {
  const totalPmt = pmt(rate, nperVal, pvVal, fvVal, timing);
  const interestPmt = ipmt(rate, per, nperVal, pvVal, fvVal, timing);
  return totalPmt.minus(interestPmt);
}
