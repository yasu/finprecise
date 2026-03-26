import {
  Decimal,
  toDecimal,
  type DecimalLike,
  yearFrac,
  type DayCountConvention,
  type DatedCashflow,
} from "@finprecise/core";

/**
 * Net Present Value.
 *
 * NPV = sum( cashflow[i] / (1 + rate)^i )  for i = 1..n
 *
 * Note: follows numpy-financial convention where the first cashflow
 * is discounted by one period. For Excel-like NPV where the first
 * cashflow is at t=0, add it separately: cashflows[0] + npv(rate, cashflows.slice(1)).
 *
 * Compatible with numpy-financial npv().
 */
export function npv(
  rate: DecimalLike,
  cashflows: DecimalLike[],
): Decimal {
  const r = toDecimal(rate);
  const r1 = r.add(1);

  return cashflows.reduce<Decimal>((acc, cf, i) => {
    const cfD = toDecimal(cf);
    return acc.add(cfD.div(r1.pow(i + 1)));
  }, new Decimal(0));
}

/**
 * Net Present Value with irregular dates (Excel XNPV equivalent).
 *
 * XNPV = sum( cashflow[i] / (1 + rate)^yearFrac(date[0], date[i]) )
 *
 * The first cashflow's date is used as the valuation date.
 *
 * @param rate - Annual discount rate
 * @param cashflows - Array of dated cashflows
 * @param dayCount - Day count convention (default "act/365-fixed")
 */
export function xnpv(
  rate: DecimalLike,
  cashflows: DatedCashflow[],
  dayCount: DayCountConvention = "act/365-fixed",
): Decimal {
  if (cashflows.length === 0) {
    return new Decimal(0);
  }

  const r = toDecimal(rate);
  const baseDate = cashflows[0].date;

  return cashflows.reduce<Decimal>((acc, cf) => {
    const cfD = toDecimal(cf.amount);
    const yf = yearFrac(baseDate, cf.date, dayCount);
    const df = r.add(1).pow(yf);
    return acc.add(cfD.div(df));
  }, new Decimal(0));
}
