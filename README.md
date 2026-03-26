# finprecise

A reference-grade financial calculation engine for TypeScript.

**Explicit assumptions. Reproducible results. Verifiable answers.**

finprecise is not another collection of financial helper functions. It is a calculation foundation where every assumption — rate convention, day count, rounding rule, solver behavior — is visible in the API and reproducible across Node.js, Bun, Deno, and browsers.

## Why finprecise?

Existing TypeScript/JavaScript financial libraries have gaps:

- **[financial](https://github.com/lmammino/financial)** covers numpy-financial basics but explicitly excludes arbitrary-precision decimals
- **[financejs](https://www.npmjs.com/package/financejs)** and **[xirr](https://www.npmjs.com/package/xirr)** are aging implementations (2017, 2020) with no day-count or rounding controls
- None expose solver diagnostics ("did it converge?", "is the solution unique?")

finprecise fills these gaps:

- **Decimal-first**: All calculations use `decimal.js` — no floating-point surprises
- **Assumptions are explicit**: Day count convention, compounding frequency, payment timing, and rounding mode are API parameters, not hidden defaults
- **Solver transparency**: IRR/XIRR/rate return `SolveResult` — convergence status, iteration count, and failure reasons
- **Verification-ready**: Ships with fixtures cross-referenced against numpy-financial and Excel

## Packages

| Package | Description |
|---|---|
| `@finprecise/core` | Decimal, Rate, DayCount, Rounding, Solver |
| `@finprecise/cashflow` | PV, FV, PMT, NPER, RATE, NPV, XNPV, IRR, XIRR, MIRR |
| `@finprecise/loans` | Amortization schedules: level-payment, level-principal, interest-only, bullet, variable-rate, prepayment |
| `@finprecise/depreciation` | SLN, DB, DDB, SYD (Excel-compatible) |
| `@finprecise/format` | Display formatting via `Intl.NumberFormat` (separated from calculation) |
| `@finprecise/fixtures` | Verification data for numpy-financial and Excel compatibility |

## Quick Start

```bash
npm install @finprecise/core @finprecise/cashflow
```

### Time Value of Money

```ts
import { pv, pmt, irr, xirr } from "@finprecise/cashflow";

// Monthly payment on a $200,000 mortgage at 6% for 30 years
const payment = pmt("0.005", "360", "200000");
// → -1199.10 (you pay $1,199.10/month)

// Present value of $100/month for 10 years at 5% annual
const presentValue = pv("0.004167", "120", "-100");
// → 9428.14

// IRR with solver diagnostics
const result = irr(["-100000", "30000", "35000", "40000", "25000"]);
if (result.ok) {
  console.log(`IRR: ${result.value.toFixed(4)}, converged in ${result.iterations} iterations`);
} else {
  console.log(`Failed: ${result.reason} — ${result.detail}`);
}
```

### XIRR with Explicit Day Count

```ts
import { xirr } from "@finprecise/cashflow";

const result = xirr({
  cashflows: [
    { amount: "-100000", date: "2025-01-10" },
    { amount: "25000",   date: "2025-06-30" },
    { amount: "90000",   date: "2026-03-01" },
  ],
  dayCount: "act/365-fixed",
  solver: {
    method: "hybrid",
    guess: "0.10",
    maxIterations: 128,
    tolerance: "1e-12",
  },
});
```

### Loan Amortization Schedule

```ts
import { loanSchedule } from "@finprecise/loans";

const schedule = loanSchedule({
  principal: "350000",
  periods: 360,
  repayment: { kind: "level-payment", timing: "end" },
  rateSteps: [
    { from: 1, annualRate: "0.0475" },
    { from: 37, annualRate: "0.0610" },
  ],
  accrual: { dayCount: "30e/360", compounding: "monthly" },
  rounding: {
    interest: "half-up",
    payment: "half-up",
    balance: "half-up",
    scale: 2,
  },
});

// Every row shows: period, beginBalance, payment, principal, interest, endBalance, annualRate
for (const row of schedule.rows.slice(0, 3)) {
  console.log(
    `#${row.period} | Balance: ${row.beginBalance} | Payment: ${row.payment} | ` +
    `Principal: ${row.principal} | Interest: ${row.interest} | End: ${row.endBalance}`
  );
}
console.log(`Total interest: ${schedule.summary.totalInterest}`);
```

### Depreciation

```ts
import { sln, ddb, syd } from "@finprecise/depreciation";

// Straight-line: $30,000 asset, $7,500 salvage, 10 years
sln("30000", "7500", "10"); // → 2250

// Double-declining balance
ddb("1000000", "100000", "6", "1"); // → 333333.33

// Sum-of-years-digits
syd("30000", "7500", "10", "1"); // → 4090.91
```

### Rate Conversions

```ts
import { effectiveAnnualRate, nominalAnnualRate } from "@finprecise/core";

// 12% nominal with monthly compounding → 12.68% effective
effectiveAnnualRate("0.12", "monthly"); // → 0.126825...

// Convert back
nominalAnnualRate("0.126825", "monthly"); // → 0.12...
```

## Design Principles

### 1. Assumptions Are API Parameters

Every function that depends on conventions requires them explicitly:

- **`PaymentTiming`**: `"begin"` or `"end"` — no hidden default
- **`DayCountConvention`**: `"act/365-fixed"`, `"30/360"`, `"act/act-isda"`, etc.
- **`CompoundingFrequency`**: `"monthly"`, `"quarterly"`, `"continuous"`, etc.
- **`RoundingMode`**: `"half-up"`, `"half-even"`, `"down"`, etc.
- **`SolverConfig`**: method, guess, maxIterations, tolerance

### 2. Solver Results Are Transparent

IRR, XIRR, and RATE return a discriminated union:

```ts
type SolveResult =
  | { ok: true;  value: Decimal; iterations: number }
  | { ok: false; reason: "no-bracket" | "no-convergence" | "multiple-roots"; detail?: string }
```

### 3. Decimal-First, Display-Last

- All calculations use `decimal.js` for arbitrary precision
- Inputs accept `string | number | Decimal` (strings recommended)
- Display formatting is in a separate `@finprecise/format` package using `Intl.NumberFormat`
- Computation and display are strictly separated

### 4. Verification Over Documentation

The `@finprecise/fixtures` package provides cross-referenced expected values from numpy-financial and Excel, so users can verify results against authoritative sources.

## Compatibility

| Function | numpy-financial | Excel | Notes |
|---|---|---|---|
| `pv` | `npf.pv` | `PV` | Identical sign convention |
| `fv` | `npf.fv` | `FV` | Identical sign convention |
| `pmt` | `npf.pmt` | `PMT` | Identical sign convention |
| `nper` | `npf.nper` | `NPER` | |
| `rate` | `npf.rate` | `RATE` | Returns SolveResult |
| `ipmt` | `npf.ipmt` | `IPMT` | |
| `ppmt` | `npf.ppmt` | `PPMT` | |
| `npv` | `npf.npv` | — | First cashflow discounted (numpy convention) |
| `xnpv` | — | `XNPV` | Configurable day count |
| `irr` | `npf.irr` | `IRR` | Returns SolveResult |
| `xirr` | — | `XIRR` | Returns SolveResult, configurable day count |
| `mirr` | `npf.mirr` | `MIRR` | |
| `yearFrac` | — | `YEARFRAC` | All 6 basis types |
| `sln` | — | `SLN` | |
| `ddb` | — | `DDB` | |
| `syd` | — | `SYD` | |

## Project Structure

```
packages/
  core/           — Decimal, Rate, DayCount, Rounding, Solver
  cashflow/       — TVM functions, NPV, IRR, XIRR, MIRR
  loans/          — Amortization schedule engine
  depreciation/   — SLN, DB, DDB, SYD
  format/         — Display formatting (Intl.NumberFormat)
  fixtures/       — Verification data
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```

Tests include:
- Unit tests against numpy-financial and Excel expected values
- Property-based tests with fast-check (TVM round-trips, IRR→NPV=0)
- Day count convention tests for all 6 basis types
- Solver convergence tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests (including fixtures for new functions)
4. Ensure `pnpm test` passes
5. Submit a pull request

## License

[MIT](./LICENSE)
