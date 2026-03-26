import {
  Decimal,
  toDecimal,
  periodicRate,
  round,
  type RoundingConfig,
} from "@finprecise/core";
import type {
  LoanScheduleInput,
  LoanSchedule,
  ScheduleRow,
  Prepayment,
  ScheduleFee,
} from "./types.js";

/**
 * Get the annual rate for a given period from the rate steps.
 */
function getRateForPeriod(
  period: number,
  rateSteps: { from: number; annualRate: Decimal }[],
): Decimal {
  let rate = rateSteps[0].annualRate;
  for (const step of rateSteps) {
    if (period >= step.from) {
      rate = step.annualRate;
    }
  }
  return rate;
}

/**
 * Calculate level-payment (PMT) for given balance, rate, and remaining periods.
 */
function calcLevelPayment(
  balance: Decimal,
  periodicR: Decimal,
  remainingPeriods: number,
  rounding: RoundingConfig,
): Decimal {
  if (periodicR.isZero()) {
    return round(balance.div(remainingPeriods), rounding.scale, rounding.payment);
  }
  const r1n = periodicR.add(1).pow(remainingPeriods);
  const pmt = balance.mul(periodicR.mul(r1n)).div(r1n.minus(1));
  return round(pmt, rounding.scale, rounding.payment);
}

/**
 * Generate a complete loan amortization schedule.
 *
 * Supports:
 * - Level payment (元利均等)
 * - Level principal (元金均等)
 * - Interest-only
 * - Bullet (final balloon payment)
 * - Variable rates via rateSteps
 * - Grace periods
 * - Prepayments (shorten-term or reduce-payment)
 * - Fee rows
 */
export function loanSchedule(input: LoanScheduleInput): LoanSchedule {
  const {
    repayment,
    accrual,
    rounding,
    gracePeriods = 0,
    prepayments = [],
    fees = [],
  } = input;

  let periods = input.periods;

  const rateSteps = input.rateSteps.map((s) => ({
    from: s.from,
    annualRate: toDecimal(s.annualRate),
  }));

  const prepaymentMap = new Map<number, Prepayment[]>();
  for (const pp of prepayments) {
    const existing = prepaymentMap.get(pp.period) || [];
    existing.push(pp);
    prepaymentMap.set(pp.period, existing);
  }

  const feeMap = new Map<number, ScheduleFee[]>();
  for (const fee of fees) {
    const existing = feeMap.get(fee.period) || [];
    existing.push(fee);
    feeMap.set(fee.period, existing);
  }

  let balance = toDecimal(input.principal);
  const rows: ScheduleRow[] = [];
  let recalcPayment = true;
  let levelPayment = new Decimal(0);

  for (let period = 1; period <= periods && balance.gt(0); period++) {
    const beginBalance = balance;
    const annualRate = getRateForPeriod(period, rateSteps);
    const perRate = periodicRate(annualRate, accrual.compounding);

    // Interest for this period
    const interest = round(beginBalance.mul(perRate), rounding.scale, rounding.interest);

    let principal: Decimal;
    let payment: Decimal;

    const isGrace = period <= gracePeriods;

    if (isGrace || repayment.kind === "interest-only") {
      // Interest-only period
      payment = interest;
      principal = new Decimal(0);
    } else if (repayment.kind === "bullet") {
      if (period === periods) {
        // Final period: pay everything
        principal = beginBalance;
        payment = round(principal.add(interest), rounding.scale, rounding.payment);
      } else {
        // Interest-only until final period
        payment = interest;
        principal = new Decimal(0);
      }
    } else if (repayment.kind === "level-principal") {
      const effectiveStart = gracePeriods + 1;
      const remainingPrincipalPeriods = periods - effectiveStart + 1;
      principal = round(
        toDecimal(input.principal).div(remainingPrincipalPeriods),
        rounding.scale,
        rounding.payment,
      );
      // Adjust last period
      if (principal.gt(beginBalance)) {
        principal = beginBalance;
      }
      payment = round(principal.add(interest), rounding.scale, rounding.payment);
    } else {
      // level-payment (default)
      if (recalcPayment) {
        const effectiveRemaining = periods - period + 1;
        levelPayment = calcLevelPayment(beginBalance, perRate, effectiveRemaining, rounding);
        recalcPayment = false;
      }

      // Last period adjustment
      if (period === periods || beginBalance.add(interest).lte(levelPayment)) {
        principal = beginBalance;
        payment = round(principal.add(interest), rounding.scale, rounding.payment);
      } else {
        payment = levelPayment;
        principal = round(payment.minus(interest), rounding.scale, rounding.balance);
      }
    }

    // Handle prepayments
    let prepaymentAmount = new Decimal(0);
    const periodPrepayments = prepaymentMap.get(period) || [];
    for (const pp of periodPrepayments) {
      const ppAmt = toDecimal(pp.amount);
      prepaymentAmount = prepaymentAmount.add(ppAmt);

      if (pp.strategy === "reduce-payment") {
        recalcPayment = true;
      } else if (pp.strategy === "shorten-term") {
        // Term will naturally shorten as balance decreases faster
      }
    }

    // Handle fees
    let feeAmount = new Decimal(0);
    let feeLabel: string | undefined;
    const periodFees = feeMap.get(period) || [];
    for (const fee of periodFees) {
      feeAmount = feeAmount.add(toDecimal(fee.amount));
      feeLabel = feeLabel ? `${feeLabel}; ${fee.label}` : fee.label;
    }

    const endBalance = round(
      beginBalance.minus(principal).minus(prepaymentAmount),
      rounding.scale,
      rounding.balance,
    );

    balance = endBalance.lt(0) ? new Decimal(0) : endBalance;

    rows.push({
      period,
      beginBalance,
      payment,
      principal,
      interest,
      prepayment: prepaymentAmount,
      fee: feeAmount,
      feeLabel,
      endBalance: balance,
      annualRate,
    });

    // If balance is 0, we're done
    if (balance.isZero()) break;
  }

  // Summary
  const summary = rows.reduce(
    (acc, row) => ({
      totalPayment: acc.totalPayment.add(row.payment),
      totalInterest: acc.totalInterest.add(row.interest),
      totalPrincipal: acc.totalPrincipal.add(row.principal),
      totalFees: acc.totalFees.add(row.fee),
      totalPrepayment: acc.totalPrepayment.add(row.prepayment),
      effectivePeriods: row.period,
    }),
    {
      totalPayment: new Decimal(0),
      totalInterest: new Decimal(0),
      totalPrincipal: new Decimal(0),
      totalFees: new Decimal(0),
      totalPrepayment: new Decimal(0),
      effectivePeriods: 0,
    },
  );

  return { rows, summary };
}
