import type { DayCountConvention } from "./day-count.js";
import type { RoundingConfig } from "./rounding.js";
import type { CompoundingFrequency } from "./rate.js";
import type { SolverConfig } from "./solver.js";
import type { DecimalLike } from "./decimal.js";

/**
 * Payment timing: beginning or end of period.
 * - "end" (ordinary annuity): payment at end of each period (default in most contexts)
 * - "begin" (annuity due): payment at beginning of each period
 */
export type PaymentTiming = "begin" | "end";

/**
 * Accrual configuration for interest calculations.
 */
export interface AccrualConfig {
  dayCount: DayCountConvention;
  compounding: CompoundingFrequency;
}

/**
 * Dated cash flow entry.
 */
export interface DatedCashflow {
  amount: DecimalLike;
  date: string; // ISO YYYY-MM-DD
}

/**
 * Rate step for variable-rate loans.
 */
export interface RateStep {
  /** Period number from which this rate applies (1-based) */
  from: number;
  /** Annual interest rate */
  annualRate: DecimalLike;
}
