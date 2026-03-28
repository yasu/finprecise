# finprecise Specification

This document defines the conventions, assumptions, and design decisions that govern finprecise.
It is the authoritative reference for contributors and users who need to understand _why_ a function returns a specific value.

## 1. Numeric Precision

### Rule: Decimal-first, never `number` for intermediate calculations

- All internal calculations use `decimal.js` (arbitrary-precision decimal arithmetic)
- Public APIs accept `DecimalLike = string | number | Decimal`
- **Strings are the recommended input format** to avoid IEEE 754 floating-point surprises
- `number` inputs are accepted for convenience but may lose precision for values with many significant digits

### Why not `number`?

```ts
// JavaScript number:
0.1 + 0.2 === 0.30000000000000004

// decimal.js:
new Decimal("0.1").add("0.2").toString() === "0.3"
```

In financial calculations, accumulated rounding errors in `number` arithmetic can produce material differences in amortization schedules, NPV calculations, and rate-solving convergence.

## 2. Sign Convention

Follows numpy-financial and Excel:

- **Cash you pay out** (investments, loan payments, deposits): **negative**
- **Cash you receive** (income, loan proceeds, withdrawals): **positive**

Example: A $200,000 mortgage with $1,199.10 monthly payments:
- `pv = 200000` (you receive the loan)
- `pmt = -1199.10` (you pay each month)
- `fv = 0` (loan is fully paid off)

## 3. Day Count Conventions

The library supports 6 day count conventions, matching Excel's BASIS parameter and ISDA standards:

| Convention | Numerator | Denominator | Common Use |
|---|---|---|---|
| `act/act-isda` | Actual days | Actual days in year | Bonds (ISDA) |
| `act/360` | Actual days | 360 | Money market |
| `act/365-fixed` | Actual days | 365 | Excel XIRR default |
| `30/360` | 30/360 adjusted days | 360 | US bonds (NASD) |
| `30e/360` | 30E/360 adjusted days | 360 | Eurobonds |
| `30e/360-isda` | 30E/360 ISDA variant | 360 | ISDA variant |

### ACT/ACT-ISDA Year Boundary Split

When a period crosses a year boundary, the fraction is split at January 1:
- Days in year Y₁: `actualDays(startDate, Jan 1 of Y₁+1) / daysInYear(Y₁)`
- Full years between: counted as 1.0 each
- Days in year Y₂: `actualDays(Jan 1 of Y₂, endDate) / daysInYear(Y₂)`

### 30/360 Adjustments

**US 30/360 (NASD)**:
1. If D₁ = 31, set D₁ = 30
2. If D₂ = 31 and D₁ ≥ 30, set D₂ = 30
3. Days = (Y₂-Y₁)×360 + (M₂-M₁)×30 + (D₂-D₁)

**30E/360 (Eurobond)**:
1. If D₁ = 31, set D₁ = 30
2. If D₂ = 31, set D₂ = 30
3. Days = (Y₂-Y₁)×360 + (M₂-M₁)×30 + (D₂-D₁)

## 4. Payment Timing

- `"end"` — Ordinary annuity: payment at end of each period (default)
- `"begin"` — Annuity due: payment at beginning of each period

The timing affects the TVM equation through the `when` factor:
```
annuityFvFactor = ((1+r)^n - 1) / r × (1 + r × when)
```
where `when = 0` for end, `when = 1` for begin.

## 5. Rounding

### Modes

| Mode | Behavior |
|---|---|
| `half-up` | Round half away from zero (Excel default, standard financial) |
| `half-even` | Round half to even (banker's rounding) |
| `half-down` | Round half towards zero |
| `up` | Always away from zero |
| `down` | Always towards zero (truncate) |
| `ceiling` | Always towards +∞ |
| `floor` | Always towards -∞ |

### Application Points

Rounding is applied at three points in amortization calculations:
1. **Interest**: After computing `balance × periodicRate`
2. **Payment**: After computing the payment amount
3. **Balance**: After computing `balance - principal - prepayment`

Each point has its own configurable rounding mode and scale.

## 6. Solver Behavior

### Methods

- **Newton-Raphson**: Fast convergence near the solution, requires derivative
- **Bisection**: Guaranteed convergence within a bracket, slower
- **Hybrid** (default): Tries Newton first, falls back to bisection with multiple bracket attempts

### Return Type

```ts
type SolveResult =
  | { ok: true;  value: Decimal; iterations: number }
  | { ok: false; reason: "no-bracket" | "no-convergence"; detail?: string }
```

### Defaults

- Method: `"hybrid"`
- Initial guess: `0.10`
- Max iterations: `128`
- Tolerance: `1e-12`

### Why This Matters

Excel's XIRR silently fails after 100 iterations. Existing npm packages say "change your guess" without guidance. finprecise:
1. Reports _why_ solving failed
2. Reports how many iterations were needed
3. Allows full control over solver parameters
4. Uses wider bracket search in hybrid mode

## 7. TVM Equation

The fundamental Time Value of Money equation used throughout:

```
0 = PV × (1+r)^n + PMT × ((1+r)^n - 1) / r × (1 + r×when) + FV
```

All TVM functions (PV, FV, PMT, NPER, RATE, IPMT, PPMT) solve for one variable given the others.

## 8. Loan Schedule Engine

### Repayment Methods

| Method | Principal Behavior | Payment Behavior |
|---|---|---|
| `level-payment` | Increasing over time | Constant |
| `level-principal` | Constant | Decreasing over time |
| `interest-only` | Zero | Interest only |
| `bullet` | Zero until final period | Interest only, then principal + interest |

### Variable Rate

Rate changes are specified as steps:
```ts
rateSteps: [
  { from: 1, annualRate: "0.04" },   // Periods 1-36
  { from: 37, annualRate: "0.06" },  // Period 37+
]
```

When a rate changes, the level-payment amount is recalculated based on the remaining balance and remaining periods.

### Prepayment

Two strategies:
- `"shorten-term"`: Maintains payment amount, loan ends earlier
- `"reduce-payment"`: Recalculates payment, maintains original term

### Last Period Adjustment

The final period payment is adjusted to exactly zero out the balance, preventing residual amounts from rounding accumulation.

## 9. Depreciation Methods

All methods match Excel function behavior:

| Function | Excel | Formula |
|---|---|---|
| `sln` | `SLN` | `(cost - salvage) / life` |
| `db` | `DB` | Fixed rate = `1 - (salvage/cost)^(1/life)`, rounded to 3 decimals |
| `ddb` | `DDB` | `min(bookValue × factor/life, bookValue - salvage)` |
| `syd` | `SYD` | `(cost - salvage) × (life - period + 1) / (life × (life+1) / 2)` |

## 10. Display Formatting

- Formatting is **strictly separated** from calculation
- `@finprecise/format` uses `Intl.NumberFormat` for locale-aware display
- No custom number formatting code
- Currency, locale, and fraction digits are display concerns, not calculation concerns

## 11. Verification Strategy

### Compatibility Targets

1. **numpy-financial**: TVM functions (pv, fv, pmt, nper, rate, irr, mirr, npv)
2. **Excel**: XIRR, XNPV, YEARFRAC, PMT, SLN, DDB, SYD
3. **Manual calculation**: Cross-verified with algebraic derivations

### Fixture Format

```ts
interface Fixture<TInput, TExpected> {
  description: string;
  source: "numpy-financial" | "excel" | "libreoffice" | "manual";
  input: TInput;
  expected: TExpected;
  tolerance?: string;
}
```

### Property-Based Testing

Using fast-check to verify algebraic invariants:
- `fv(r, n, pmt, pv(r, n, pmt, 0)) = 0` (TVM round-trip)
- `pmt × nper + pv = 0` for zero-rate (identity)
- `npv(irr(cfs), cfs) ≈ 0` (IRR definition)
- Sum of all principal payments ≈ original principal (amortization invariant)

## 12. Dependencies

### Runtime

- `decimal.js` — Arbitrary-precision decimal arithmetic (single runtime dependency)

### Dev

- `vitest` — Test runner
- `fast-check` — Property-based testing
- `typescript` — Type checking and compilation

### Explicitly Not Dependencies

- `Temporal` — Not yet universally available; ISO strings used instead
- `dayjs` / `date-fns` — Date logic is minimal and self-contained
- `bignumber.js` — `decimal.js` chosen for broader precision control
