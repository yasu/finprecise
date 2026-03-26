import Decimal from "decimal.js";

/**
 * Any value that can be coerced to a Decimal.
 * Accepts string (preferred for precision), number, or Decimal instances.
 */
export type DecimalLike = string | number | Decimal;

/**
 * Convert any DecimalLike to a Decimal instance.
 * Strings are preferred to avoid floating-point surprises.
 */
export function toDecimal(value: DecimalLike): Decimal {
  return new Decimal(value);
}

/**
 * Check if two Decimals are equal within a given tolerance.
 */
export function decimalClose(
  a: Decimal,
  b: Decimal,
  tolerance: DecimalLike = "1e-10",
): boolean {
  return a.minus(b).abs().lte(toDecimal(tolerance));
}

export { Decimal };
