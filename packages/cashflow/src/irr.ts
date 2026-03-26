import {
  Decimal,
  toDecimal,
  type DecimalLike,
  type SolverConfig,
  type SolveResult,
  solve,
  DEFAULT_SOLVER,
  yearFrac,
  type DayCountConvention,
  type DatedCashflow,
} from "@finprecise/core";

/**
 * Internal Rate of Return.
 *
 * Finds the rate r such that NPV(r, cashflows) = 0.
 * The cashflows are assumed to be evenly spaced (one per period).
 *
 * Compatible with numpy-financial irr() and Excel IRR().
 *
 * @param cashflows - Array of periodic cashflows (first is typically negative)
 * @param solver - Solver configuration (optional)
 */
export function irr(
  cashflows: DecimalLike[],
  solver: Partial<SolverConfig> = {},
): SolveResult {
  if (cashflows.length < 2) {
    return { ok: false, reason: "no-convergence", detail: "At least 2 cashflows required" };
  }

  const cfs = cashflows.map(toDecimal);

  const hasPositive = cfs.some((cf) => cf.gt(0));
  const hasNegative = cfs.some((cf) => cf.lt(0));
  if (!hasPositive || !hasNegative) {
    return { ok: false, reason: "no-convergence", detail: "IRR requires both positive and negative cashflows" };
  }

  const cfg: SolverConfig = { ...DEFAULT_SOLVER, guess: "0.10", ...solver };

  // f(r) = sum( cf[i] / (1+r)^i ) = 0
  const f = (r: Decimal): Decimal => {
    const r1 = r.add(1);
    return cfs.reduce<Decimal>((acc, cf, i) => {
      return acc.add(cf.div(r1.pow(i)));
    }, new Decimal(0));
  };

  // f'(r) = sum( -i * cf[i] / (1+r)^(i+1) )
  const fPrime = (r: Decimal): Decimal => {
    const r1 = r.add(1);
    return cfs.reduce<Decimal>((acc, cf, i) => {
      if (i === 0) return acc;
      return acc.add(toDecimal(-i).mul(cf).div(r1.pow(i + 1)));
    }, new Decimal(0));
  };

  return solve(f, fPrime, cfg);
}

/**
 * Extended Internal Rate of Return (Excel XIRR equivalent).
 *
 * Finds the rate r such that XNPV(r, cashflows) = 0 using irregular dates.
 * Uses act/365-fixed day count by default (matching Excel XIRR).
 *
 * @param options - XIRR calculation options
 */
export function xirr(options: {
  cashflows: DatedCashflow[];
  dayCount?: DayCountConvention;
  solver?: Partial<SolverConfig>;
}): SolveResult {
  const {
    cashflows,
    dayCount = "act/365-fixed",
    solver: solverOpts = {},
  } = options;

  if (cashflows.length < 2) {
    return { ok: false, reason: "no-convergence", detail: "At least 2 cashflows required" };
  }

  const cfs = cashflows.map((cf) => ({
    amount: toDecimal(cf.amount),
    date: cf.date,
  }));

  const hasPositive = cfs.some((cf) => cf.amount.gt(0));
  const hasNegative = cfs.some((cf) => cf.amount.lt(0));
  if (!hasPositive || !hasNegative) {
    return { ok: false, reason: "no-convergence", detail: "XIRR requires both positive and negative cashflows" };
  }

  const baseDate = cfs[0].date;

  // Pre-compute year fractions
  const yfs = cfs.map((cf) => yearFrac(baseDate, cf.date, dayCount));

  const cfg: SolverConfig = { ...DEFAULT_SOLVER, guess: "0.10", ...solverOpts };

  // f(r) = sum( cf[i] / (1+r)^yf[i] ) = 0
  const f = (r: Decimal): Decimal => {
    const r1 = r.add(1);
    return cfs.reduce<Decimal>((acc, cf, i) => {
      return acc.add(cf.amount.div(r1.pow(yfs[i])));
    }, new Decimal(0));
  };

  // f'(r) = sum( -yf[i] * cf[i] / (1+r)^(yf[i]+1) )
  const fPrime = (r: Decimal): Decimal => {
    const r1 = r.add(1);
    return cfs.reduce<Decimal>((acc, cf, i) => {
      return acc.add(yfs[i].neg().mul(cf.amount).div(r1.pow(yfs[i].add(1))));
    }, new Decimal(0));
  };

  return solve(f, fPrime, cfg);
}

/**
 * Modified Internal Rate of Return.
 *
 * MIRR considers separate rates for financing (negative cashflows)
 * and reinvestment (positive cashflows).
 *
 * MIRR = (FV of positives at reinvestRate / PV of negatives at financeRate)^(1/n) - 1
 *
 * Compatible with Excel MIRR() and numpy-financial mirr().
 *
 * @param cashflows - Array of periodic cashflows
 * @param financeRate - Rate for financing (borrowing) costs
 * @param reinvestRate - Rate for reinvestment returns
 */
export function mirr(
  cashflows: DecimalLike[],
  financeRate: DecimalLike,
  reinvestRate: DecimalLike,
): Decimal {
  const cfs = cashflows.map(toDecimal);
  const fRate = toDecimal(financeRate);
  const rRate = toDecimal(reinvestRate);
  const n = cfs.length - 1;

  if (n < 1) {
    throw new Error("MIRR requires at least 2 cashflows");
  }

  // PV of negative cashflows at finance rate
  const pvNeg = cfs.reduce<Decimal>((acc, cf, i) => {
    if (cf.lt(0)) {
      return acc.add(cf.div(fRate.add(1).pow(i)));
    }
    return acc;
  }, new Decimal(0));

  // FV of positive cashflows at reinvestment rate
  const fvPos = cfs.reduce<Decimal>((acc, cf, i) => {
    if (cf.gt(0)) {
      return acc.add(cf.mul(rRate.add(1).pow(n - i)));
    }
    return acc;
  }, new Decimal(0));

  if (pvNeg.isZero() || fvPos.isZero()) {
    throw new Error("MIRR requires both positive and negative cashflows");
  }

  return fvPos.div(pvNeg.neg()).pow(toDecimal(1).div(n)).minus(1);
}
