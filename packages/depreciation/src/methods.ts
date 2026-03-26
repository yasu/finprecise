import { Decimal, toDecimal, type DecimalLike } from "@finprecise/core";

/**
 * Straight-Line Depreciation (Excel SLN compatible).
 *
 * SLN = (cost - salvage) / life
 *
 * @param cost - Initial cost of the asset
 * @param salvage - Salvage value at end of life
 * @param life - Number of periods (useful life)
 */
export function sln(
  cost: DecimalLike,
  salvage: DecimalLike,
  life: DecimalLike,
): Decimal {
  const c = toDecimal(cost);
  const s = toDecimal(salvage);
  const l = toDecimal(life);
  if (l.isZero()) {
    throw new Error("SLN: life must be > 0");
  }
  return c.minus(s).div(l);
}

/**
 * Fixed-Declining Balance Depreciation (Excel DB compatible).
 *
 * Uses a fixed rate based on: rate = 1 - (salvage / cost)^(1/life)
 * Rounded to 3 decimal places (Excel convention).
 *
 * @param cost - Initial cost
 * @param salvage - Salvage value
 * @param life - Total life periods
 * @param period - Period for which to calculate depreciation (1-based)
 * @param month - Number of months in the first year (default 12)
 */
export function db(
  cost: DecimalLike,
  salvage: DecimalLike,
  life: DecimalLike,
  period: DecimalLike,
  month: DecimalLike = 12,
): Decimal {
  const c = toDecimal(cost);
  const s = toDecimal(salvage);
  const l = toDecimal(life);
  const per = toDecimal(period);
  const m = toDecimal(month);

  if (l.isZero() || c.isZero()) {
    throw new Error("DB: cost and life must be > 0");
  }

  // Rate = 1 - (salvage/cost)^(1/life), rounded to 3 decimal places
  let rate: Decimal;
  if (s.isZero()) {
    rate = new Decimal(1);
  } else {
    rate = new Decimal(1).minus(
      s.div(c).pow(new Decimal(1).div(l)),
    );
  }
  rate = rate.toDecimalPlaces(3, Decimal.ROUND_HALF_UP);

  let totalDepreciation = new Decimal(0);
  let depreciation = new Decimal(0);

  for (let p = 1; p <= per.toNumber(); p++) {
    if (p === 1) {
      // First period: prorate by month
      depreciation = c.mul(rate).mul(m).div(12);
    } else if (p === l.toNumber() + 1) {
      // Last period (if month < 12): remaining balance
      const remaining = c.minus(totalDepreciation);
      depreciation = remaining.mul(rate).mul(toDecimal(12).minus(m)).div(12);
    } else {
      depreciation = c.minus(totalDepreciation).mul(rate);
    }
    totalDepreciation = totalDepreciation.add(depreciation);
  }

  return depreciation;
}

/**
 * Double-Declining Balance Depreciation (Excel DDB compatible).
 *
 * DDB = min(book_value * (factor/life), book_value - salvage)
 *
 * @param cost - Initial cost
 * @param salvage - Salvage value
 * @param life - Total life periods
 * @param period - Period for which to calculate depreciation (1-based)
 * @param factor - Depreciation factor (default 2 for double-declining)
 */
export function ddb(
  cost: DecimalLike,
  salvage: DecimalLike,
  life: DecimalLike,
  period: DecimalLike,
  factor: DecimalLike = 2,
): Decimal {
  const c = toDecimal(cost);
  const s = toDecimal(salvage);
  const l = toDecimal(life);
  const per = toDecimal(period);
  const f = toDecimal(factor);

  if (l.isZero()) {
    throw new Error("DDB: life must be > 0");
  }

  const rate = f.div(l);
  let bookValue = c;

  for (let p = 1; p <= per.toNumber(); p++) {
    let depreciation = bookValue.mul(rate);
    // Cannot depreciate below salvage
    if (bookValue.minus(depreciation).lt(s)) {
      depreciation = bookValue.minus(s);
    }
    if (depreciation.lt(0)) {
      depreciation = new Decimal(0);
    }
    if (p === per.toNumber()) {
      return depreciation;
    }
    bookValue = bookValue.minus(depreciation);
  }

  return new Decimal(0);
}

/**
 * Sum-of-Years-Digits Depreciation (Excel SYD compatible).
 *
 * SYD = (cost - salvage) * (life - period + 1) / (life * (life + 1) / 2)
 *
 * @param cost - Initial cost
 * @param salvage - Salvage value
 * @param life - Total life periods
 * @param period - Period for which to calculate depreciation (1-based)
 */
export function syd(
  cost: DecimalLike,
  salvage: DecimalLike,
  life: DecimalLike,
  period: DecimalLike,
): Decimal {
  const c = toDecimal(cost);
  const s = toDecimal(salvage);
  const l = toDecimal(life);
  const per = toDecimal(period);

  if (l.isZero()) {
    throw new Error("SYD: life must be > 0");
  }

  const depreciable = c.minus(s);
  const sumOfYears = l.mul(l.add(1)).div(2);
  const remaining = l.minus(per).add(1);

  return depreciable.mul(remaining).div(sumOfYears);
}
