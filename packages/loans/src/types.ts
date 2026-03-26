import type { DecimalLike, RoundingConfig, AccrualConfig, RateStep } from "@finprecise/core";
import type { Decimal } from "@finprecise/core";

/**
 * Repayment method for loan schedules.
 */
export type RepaymentKind =
  | "level-payment"      // 元利均等 (equal total payment)
  | "level-principal"    // 元金均等 (equal principal payment)
  | "interest-only"      // 利息のみ
  | "bullet"             // 最終回一括
  | "custom";            // Custom payment schedule

/**
 * Repayment configuration.
 */
export interface RepaymentConfig {
  kind: RepaymentKind;
  /** Payment timing: begin or end of period */
  timing: "begin" | "end";
}

/**
 * Prepayment entry.
 */
export interface Prepayment {
  /** Period in which prepayment occurs */
  period: number;
  /** Prepayment amount */
  amount: DecimalLike;
  /** How to apply prepayment */
  strategy: "shorten-term" | "reduce-payment";
}

/**
 * Fee entry to insert into the schedule.
 */
export interface ScheduleFee {
  /** Period in which the fee applies */
  period: number;
  /** Fee amount */
  amount: DecimalLike;
  /** Fee description */
  label: string;
}

/**
 * Input configuration for generating a loan schedule.
 */
export interface LoanScheduleInput {
  /** Loan principal amount */
  principal: DecimalLike;
  /** Total number of payment periods */
  periods: number;
  /** Repayment method and timing */
  repayment: RepaymentConfig;
  /** Rate steps for fixed or variable rate */
  rateSteps: RateStep[];
  /** Interest accrual settings */
  accrual: AccrualConfig;
  /** Rounding configuration */
  rounding: RoundingConfig;
  /** Grace periods (interest-only before regular repayment begins) */
  gracePeriods?: number;
  /** Prepayments */
  prepayments?: Prepayment[];
  /** Fees to insert */
  fees?: ScheduleFee[];
}

/**
 * A single row in the amortization schedule.
 */
export interface ScheduleRow {
  /** Period number (1-based) */
  period: number;
  /** Balance at start of period */
  beginBalance: Decimal;
  /** Total payment amount */
  payment: Decimal;
  /** Principal portion of payment */
  principal: Decimal;
  /** Interest portion of payment */
  interest: Decimal;
  /** Prepayment amount (if any) */
  prepayment: Decimal;
  /** Fee amount (if any) */
  fee: Decimal;
  /** Fee label (if any) */
  feeLabel?: string;
  /** Balance at end of period */
  endBalance: Decimal;
  /** Annual rate applied in this period */
  annualRate: Decimal;
}

/**
 * Complete loan amortization schedule.
 */
export interface LoanSchedule {
  rows: ScheduleRow[];
  /** Summary statistics */
  summary: {
    totalPayment: Decimal;
    totalInterest: Decimal;
    totalPrincipal: Decimal;
    totalFees: Decimal;
    totalPrepayment: Decimal;
    effectivePeriods: number;
  };
}
