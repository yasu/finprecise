import { Decimal, toDecimal, type DecimalLike } from "./decimal.js";

/**
 * Day count conventions used in financial calculations.
 *
 * These correspond to Excel's BASIS parameter and ISDA standards:
 * - "act/act-isda": Actual days / actual days in year (ISDA variant)
 * - "act/360": Actual days / 360
 * - "act/365-fixed": Actual days / 365 (Excel XIRR default)
 * - "30/360": US 30/360 (NASD)
 * - "30e/360": European 30/360 (Eurobond basis)
 * - "30e/360-isda": European 30/360 ISDA variant
 */
export type DayCountConvention =
  | "act/act-isda"
  | "act/360"
  | "act/365-fixed"
  | "30/360"
  | "30e/360"
  | "30e/360-isda";

/**
 * Parse an ISO date string (YYYY-MM-DD) to year, month, day.
 */
function parseDateParts(iso: string): [number, number, number] {
  const parts = iso.split("-");
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: "${iso}". Expected YYYY-MM-DD.`);
  }
  return [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)];
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInYear(y: number): number {
  return isLeapYear(y) ? 366 : 365;
}

function toJSDate(iso: string): Date {
  const [y, m, d] = parseDateParts(iso);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Actual number of days between two ISO date strings.
 */
function actualDays(startDate: string, endDate: string): number {
  const s = toJSDate(startDate);
  const e = toJSDate(endDate);
  return Math.round((e.getTime() - s.getTime()) / 86_400_000);
}

/**
 * 30/360 US (NASD) day count.
 */
function days30_360(
  y1: number, m1: number, d1: number,
  y2: number, m2: number, d2: number,
): number {
  let dd1 = d1;
  let dd2 = d2;
  if (dd1 === 31) dd1 = 30;
  if (dd2 === 31 && dd1 >= 30) dd2 = 30;
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (dd2 - dd1);
}

/**
 * 30E/360 (Eurobond) day count.
 */
function days30E_360(
  y1: number, m1: number, d1: number,
  y2: number, m2: number, d2: number,
): number {
  let dd1 = d1;
  let dd2 = d2;
  if (dd1 === 31) dd1 = 30;
  if (dd2 === 31) dd2 = 30;
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (dd2 - dd1);
}

/**
 * 30E/360 ISDA day count.
 */
function days30E_360_isda(
  y1: number, m1: number, d1: number,
  y2: number, m2: number, d2: number,
  isEndOfMonth: boolean,
): number {
  let dd1 = d1;
  let dd2 = d2;
  const feb1End = isLeapYear(y1) ? 29 : 28;
  const feb2End = isLeapYear(y2) ? 29 : 28;
  if (m1 === 2 && d1 === feb1End) dd1 = 30;
  if (m2 === 2 && d2 === feb2End && !isEndOfMonth) dd2 = 30;
  if (dd1 === 31) dd1 = 30;
  if (dd2 === 31) dd2 = 30;
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (dd2 - dd1);
}

/**
 * Calculate the year fraction between two dates according to the given day count convention.
 * This is the equivalent of Excel's YEARFRAC function.
 */
export function yearFrac(
  startDate: string,
  endDate: string,
  convention: DayCountConvention,
): Decimal {
  const [y1, m1, d1] = parseDateParts(startDate);
  const [y2, m2, d2] = parseDateParts(endDate);

  switch (convention) {
    case "act/act-isda": {
      if (y1 === y2) {
        return toDecimal(actualDays(startDate, endDate)).div(daysInYear(y1));
      }
      // Split across year boundaries using Jan 1 as boundary
      const startOfNextY1 = `${y1 + 1}-01-01`;
      let frac = toDecimal(actualDays(startDate, startOfNextY1)).div(daysInYear(y1));
      for (let y = y1 + 1; y < y2; y++) {
        frac = frac.add(1);
      }
      if (y1 + 1 <= y2) {
        const startOfY2 = `${y2}-01-01`;
        frac = frac.add(toDecimal(actualDays(startOfY2, endDate)).div(daysInYear(y2)));
      }
      return frac;
    }
    case "act/360":
      return toDecimal(actualDays(startDate, endDate)).div(360);
    case "act/365-fixed":
      return toDecimal(actualDays(startDate, endDate)).div(365);
    case "30/360":
      return toDecimal(days30_360(y1, m1, d1, y2, m2, d2)).div(360);
    case "30e/360":
      return toDecimal(days30E_360(y1, m1, d1, y2, m2, d2)).div(360);
    case "30e/360-isda":
      return toDecimal(days30E_360_isda(y1, m1, d1, y2, m2, d2, false)).div(360);
    default:
      throw new Error(`Unsupported day count convention: ${convention}`);
  }
}

/**
 * Calculate the actual number of days between two ISO date strings.
 */
export function daysBetween(startDate: string, endDate: string): number {
  return actualDays(startDate, endDate);
}

/**
 * Calculate the discount factor for a given year fraction and rate.
 * df = (1 + rate) ^ (-yearFraction)
 */
export function discountFactor(
  annualRate: DecimalLike,
  yf: DecimalLike,
): Decimal {
  return toDecimal(annualRate).add(1).pow(toDecimal(yf).neg());
}
