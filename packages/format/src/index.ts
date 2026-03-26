import { Decimal, toDecimal, type DecimalLike } from "@finprecise/core";

/**
 * Options for formatting financial values.
 */
export interface FormatOptions {
  /** ISO 4217 currency code (e.g., "USD", "JPY", "EUR") */
  currency?: string;
  /** Locale string for Intl.NumberFormat (e.g., "en-US", "ja-JP") */
  locale?: string;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Currency display style */
  currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
  /** Whether to use sign display */
  signDisplay?: "auto" | "never" | "always" | "exceptZero";
}

/**
 * Format a DecimalLike value as a currency string.
 *
 * Uses Intl.NumberFormat for locale-aware formatting.
 * Computation and display are strictly separated:
 * this function does NOT round for calculation purposes.
 *
 * @param value - The value to format
 * @param options - Formatting options
 */
export function formatCurrency(
  value: DecimalLike,
  options: FormatOptions = {},
): string {
  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    currencyDisplay = "symbol",
    signDisplay = "auto",
  } = options;

  const num = toDecimal(value).toNumber();

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    currencyDisplay,
    signDisplay,
  }).format(num);
}

/**
 * Format a DecimalLike value as a number string (no currency).
 */
export function formatNumber(
  value: DecimalLike,
  options: Omit<FormatOptions, "currency" | "currencyDisplay"> = {},
): string {
  const {
    locale = "en-US",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    signDisplay = "auto",
  } = options;

  const num = toDecimal(value).toNumber();

  return new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay,
  }).format(num);
}

/**
 * Format a DecimalLike value as a percentage string.
 */
export function formatPercent(
  value: DecimalLike,
  options: Omit<FormatOptions, "currency" | "currencyDisplay"> = {},
): string {
  const {
    locale = "en-US",
    minimumFractionDigits = 2,
    maximumFractionDigits = 4,
    signDisplay = "auto",
  } = options;

  const num = toDecimal(value).toNumber();

  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay,
  }).format(num);
}
