import { Decimal, type DecimalLike, toDecimal } from "./decimal.js";

/**
 * Rounding modes supported by the library.
 *
 * - "half-up": Round half away from zero (standard financial rounding, Excel default)
 * - "half-even": Round half to even (banker's rounding)
 * - "half-down": Round half towards zero
 * - "up": Always round away from zero (ceiling for positive, floor for negative)
 * - "down": Always round towards zero (truncate)
 * - "ceiling": Always round towards positive infinity
 * - "floor": Always round towards negative infinity
 */
export type RoundingMode =
  | "half-up"
  | "half-even"
  | "half-down"
  | "up"
  | "down"
  | "ceiling"
  | "floor";

/**
 * Rounding configuration for financial calculations.
 */
export interface RoundingConfig {
  /** Rounding mode for interest amounts */
  interest: RoundingMode;
  /** Rounding mode for payment amounts */
  payment: RoundingMode;
  /** Rounding mode for balance amounts */
  balance: RoundingMode;
  /** Number of decimal places */
  scale: number;
}

const DECIMAL_ROUNDING_MAP: Record<RoundingMode, Decimal.Rounding> = {
  "half-up": Decimal.ROUND_HALF_UP,
  "half-even": Decimal.ROUND_HALF_EVEN,
  "half-down": Decimal.ROUND_HALF_DOWN,
  "up": Decimal.ROUND_UP,
  "down": Decimal.ROUND_DOWN,
  "ceiling": Decimal.ROUND_CEIL,
  "floor": Decimal.ROUND_FLOOR,
};

/**
 * Round a Decimal value using the specified mode and scale.
 */
export function round(
  value: Decimal,
  scale: number,
  mode: RoundingMode,
): Decimal {
  return value.toDecimalPlaces(scale, DECIMAL_ROUNDING_MAP[mode]);
}

/**
 * Default rounding config: half-up, 2 decimal places.
 * Matches typical currency rounding.
 */
export const DEFAULT_ROUNDING: RoundingConfig = {
  interest: "half-up",
  payment: "half-up",
  balance: "half-up",
  scale: 2,
};
