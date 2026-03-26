# @finprecise/core

Core types and utilities for the [finprecise](https://github.com/yasu/finprecise) financial calculation engine.

## Install

```bash
npm install @finprecise/core
```

## API

### Decimal

Arbitrary-precision decimal arithmetic via `decimal.js`.

```ts
import { Decimal, toDecimal, decimalClose } from "@finprecise/core";

const a = toDecimal("100000.50");   // string → Decimal (recommended)
const b = toDecimal(0.06);          // number → Decimal
const result = a.mul(b);            // 6000.03

decimalClose(result, "6000.03", "0.01"); // true
```

### Rate Conversions

```ts
import { effectiveAnnualRate, nominalAnnualRate, periodicRate } from "@finprecise/core";

// 12% nominal, monthly compounding → 12.68% effective
effectiveAnnualRate("0.12", "monthly"); // → 0.126825...

// Convert back
nominalAnnualRate("0.126825", "monthly"); // → 0.12...

// Periodic rate
periodicRate("0.06", "monthly"); // → 0.005
```

### Day Count Conventions

```ts
import { yearFrac, daysBetween, discountFactor } from "@finprecise/core";

yearFrac("2025-01-01", "2025-07-01", "act/365-fixed"); // → 0.4959...
yearFrac("2025-01-01", "2025-07-01", "30/360");        // → 0.5
daysBetween("2025-01-01", "2025-04-01");                // → 90
```

Supported conventions: `act/365-fixed`, `act/360`, `act/act-isda`, `30/360`, `30e/360`, `30e/360-isda`.

### Rounding

```ts
import { round, DEFAULT_ROUNDING } from "@finprecise/core";

round("1234.5678", { scale: 2, interest: "half-up", payment: "half-up", balance: "half-up" }, "interest");
// → 1234.57
```

Modes: `half-up`, `half-even`, `down`, `up`, `ceil`, `floor`.

### Solver

Iterative solvers for IRR, XIRR, rate calculations.

```ts
import { solve } from "@finprecise/core";

const result = solve(f, fPrime, {
  method: "hybrid",     // "newton" | "bisection" | "hybrid"
  guess: "0.10",
  maxIterations: 128,
  tolerance: "1e-12",
});

if (result.ok) {
  console.log(`Solution: ${result.value}, iterations: ${result.iterations}`);
} else {
  console.log(`Failed: ${result.reason}`);
}
```

## Types

| Type | Description |
|---|---|
| `DecimalLike` | `string \| number \| Decimal` — accepted by all numeric inputs |
| `DayCountConvention` | Day count basis for year fraction calculations |
| `CompoundingFrequency` | `"continuous" \| "daily" \| "monthly" \| "quarterly" \| "semiannual" \| "annual"` etc. |
| `RoundingMode` | `"half-up" \| "half-even" \| "down" \| "up" \| "ceil" \| "floor"` |
| `RoundingConfig` | Scale + rounding mode per component (interest, payment, balance) |
| `SolverConfig` | Method, guess, maxIterations, tolerance |
| `SolveResult` | Discriminated union: `{ ok: true, value, iterations }` or `{ ok: false, reason }` |
| `PaymentTiming` | `"begin" \| "end"` |
| `AccrualConfig` | Day count + compounding frequency |
| `DatedCashflow` | `{ amount, date }` for XNPV/XIRR |
| `RateStep` | `{ from, annualRate }` for variable-rate schedules |

## License

[MIT](../../LICENSE)
