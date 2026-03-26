import type { DecimalLike } from "@finprecise/core";
import type { Decimal } from "decimal.js";

/**
 * Coupon frequency: number of coupon payments per year.
 */
export type CouponFrequency = 1 | 2 | 4 | 12;

/**
 * Input parameters for bond calculations.
 *
 * All rates are expressed as decimals (e.g., 0.05 for 5%).
 */
export interface BondInput {
  /** Face (par) value of the bond */
  faceValue: DecimalLike;
  /** Annual coupon rate (decimal) */
  couponRate: DecimalLike;
  /** Number of coupon payments per year */
  frequency: CouponFrequency;
  /** Number of remaining coupon periods until maturity */
  periods: number;
}

/**
 * Input for bond pricing: BondInput + required yield.
 */
export interface BondPriceInput extends BondInput {
  /** Annual yield to maturity (decimal) */
  yieldRate: DecimalLike;
}

/**
 * Input for YTM calculation: BondInput + market price.
 */
export interface BondYieldInput extends BondInput {
  /** Current market price of the bond */
  marketPrice: DecimalLike;
}

/**
 * Result of bond duration calculation.
 */
export interface DurationResult {
  /** Macaulay duration (in years) */
  macaulay: Decimal;
  /** Modified duration */
  modified: Decimal;
}

/**
 * Comprehensive bond analytics result.
 */
export interface BondAnalytics {
  /** Clean price (excluding accrued interest) */
  price: Decimal;
  /** Accrued interest (currently 0 — full-period pricing) */
  accruedInterest: Decimal;
  /** Dirty price (price + accrued interest) */
  dirtyPrice: Decimal;
  /** Macaulay duration (in years) */
  macaulayDuration: Decimal;
  /** Modified duration */
  modifiedDuration: Decimal;
  /** Convexity */
  convexity: Decimal;
}
