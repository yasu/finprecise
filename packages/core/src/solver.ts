import { Decimal, toDecimal, type DecimalLike } from "./decimal.js";

/**
 * Configuration for iterative solvers (e.g., IRR, XIRR, rate).
 */
export interface SolverConfig {
  /** Solver method */
  method: "newton" | "bisection" | "hybrid";
  /** Initial guess for the solution */
  guess: DecimalLike;
  /** Maximum number of iterations */
  maxIterations: number;
  /** Convergence tolerance */
  tolerance: DecimalLike;
}

/**
 * Default solver configuration.
 */
export const DEFAULT_SOLVER: SolverConfig = {
  method: "hybrid",
  guess: "0.10",
  maxIterations: 128,
  tolerance: "1e-12",
};

/**
 * Result of an iterative solve operation.
 * Discriminated union: check `ok` to determine success or failure.
 */
export type SolveResult =
  | { ok: true; value: Decimal; iterations: number }
  | { ok: false; reason: "no-bracket" | "no-convergence" | "multiple-roots"; detail?: string };

/**
 * Newton-Raphson solver.
 * Requires both f(x) and f'(x).
 */
export function solveNewton(
  f: (x: Decimal) => Decimal,
  fPrime: (x: Decimal) => Decimal,
  config: SolverConfig,
): SolveResult {
  const tol = toDecimal(config.tolerance);
  let x = toDecimal(config.guess);

  for (let i = 0; i < config.maxIterations; i++) {
    const fx = f(x);
    if (fx.abs().lte(tol)) {
      return { ok: true, value: x, iterations: i + 1 };
    }
    const fpx = fPrime(x);
    if (fpx.isZero()) {
      return { ok: false, reason: "no-convergence", detail: "Derivative is zero" };
    }
    x = x.minus(fx.div(fpx));
  }
  return { ok: false, reason: "no-convergence", detail: `Did not converge in ${config.maxIterations} iterations` };
}

/**
 * Bisection solver.
 * Requires a bracket [a, b] where f(a) and f(b) have opposite signs.
 */
export function solveBisection(
  f: (x: Decimal) => Decimal,
  a: Decimal,
  b: Decimal,
  config: Pick<SolverConfig, "maxIterations" | "tolerance">,
): SolveResult {
  const tol = toDecimal(config.tolerance);
  let lo = a;
  let hi = b;
  let fLo = f(lo);
  let fHi = f(hi);

  if (fLo.mul(fHi).gt(0)) {
    return { ok: false, reason: "no-bracket", detail: `f(${lo}) and f(${hi}) have the same sign` };
  }

  for (let i = 0; i < config.maxIterations; i++) {
    const mid = lo.add(hi).div(2);
    const fMid = f(mid);
    if (fMid.abs().lte(tol) || hi.minus(lo).div(2).abs().lte(tol)) {
      return { ok: true, value: mid, iterations: i + 1 };
    }
    if (fLo.mul(fMid).lt(0)) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return { ok: false, reason: "no-convergence", detail: `Did not converge in ${config.maxIterations} iterations` };
}

/**
 * Hybrid solver: starts with Newton-Raphson, falls back to bisection if needed.
 */
export function solveHybrid(
  f: (x: Decimal) => Decimal,
  fPrime: (x: Decimal) => Decimal,
  config: SolverConfig,
): SolveResult {
  // Try Newton first
  const newtonResult = solveNewton(f, fPrime, {
    ...config,
    maxIterations: Math.floor(config.maxIterations / 2),
  });

  if (newtonResult.ok) return newtonResult;

  // Fall back to bisection: try to find a bracket
  const guess = toDecimal(config.guess);
  const tryBrackets: [Decimal, Decimal][] = [
    [toDecimal("-0.99"), toDecimal("10")],
    [toDecimal("-0.5"), toDecimal("5")],
    [guess.minus("1"), guess.add("1")],
    [toDecimal("-0.999"), toDecimal("100")],
  ];

  for (const [a, b] of tryBrackets) {
    const result = solveBisection(f, a, b, {
      maxIterations: config.maxIterations,
      tolerance: config.tolerance,
    });
    if (result.ok) return result;
  }

  return { ok: false, reason: "no-convergence", detail: "Neither Newton nor bisection converged" };
}

/**
 * General solve function that dispatches to the appropriate solver.
 */
export function solve(
  f: (x: Decimal) => Decimal,
  fPrime: (x: Decimal) => Decimal,
  config: Partial<SolverConfig> = {},
): SolveResult {
  const cfg: SolverConfig = { ...DEFAULT_SOLVER, ...config };

  switch (cfg.method) {
    case "newton":
      return solveNewton(f, fPrime, cfg);
    case "bisection": {
      const guess = toDecimal(cfg.guess);
      return solveBisection(f, guess.minus("1"), guess.add("1"), cfg);
    }
    case "hybrid":
      return solveHybrid(f, fPrime, cfg);
  }
}
