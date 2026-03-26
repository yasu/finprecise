// @finprecise/core — Core types and utilities for financial calculations

export { Decimal, toDecimal, decimalClose, type DecimalLike } from "./decimal.js";
export {
  type DayCountConvention,
  yearFrac,
  daysBetween,
  discountFactor,
} from "./day-count.js";
export {
  type RoundingMode,
  type RoundingConfig,
  round,
  DEFAULT_ROUNDING,
} from "./rounding.js";
export {
  type CompoundingFrequency,
  periodsPerYear,
  effectiveAnnualRate,
  nominalAnnualRate,
  periodicRate,
} from "./rate.js";
export {
  type SolverConfig,
  type SolveResult,
  solve,
  solveNewton,
  solveBisection,
  solveHybrid,
  DEFAULT_SOLVER,
} from "./solver.js";
export {
  type PaymentTiming,
  type AccrualConfig,
  type DatedCashflow,
  type RateStep,
} from "./types.js";
