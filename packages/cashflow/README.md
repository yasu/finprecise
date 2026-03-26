# @finprecise/cashflow

Time value of money and cashflow analysis for the [finprecise](https://github.com/yasu/finprecise) financial calculation engine.

## Install

```bash
npm install @finprecise/cashflow @finprecise/core
```

## API

### Time Value of Money

```ts
import { pv, fv, pmt, nper, rate, ipmt, ppmt } from "@finprecise/cashflow";

// Present value of $100/month for 10 years at 5% annual (monthly rate)
pv("0.004167", "120", "-100"); // → 9428.14

// Future value
fv("0.004167", "120", "-100"); // → 15528.23

// Monthly payment on a $200,000 mortgage at 6% for 30 years
pmt("0.005", "360", "200000"); // → -1199.10

// Number of periods
nper("0.005", "-1199.10", "200000"); // → 360

// Interest and principal portions
ipmt("0.005", "1", "360", "200000"); // interest portion of 1st payment
ppmt("0.005", "1", "360", "200000"); // principal portion of 1st payment

// Solve for rate (returns SolveResult)
const r = rate("360", "-1199.10", "200000");
if (r.ok) console.log(r.value); // → 0.005
```

### NPV / XNPV

```ts
import { npv, xnpv } from "@finprecise/cashflow";

// NPV at 10% discount rate
npv("0.10", ["-100", "39", "59", "55", "20"]); // → 36.09

// XNPV with dates and day count
xnpv({
  rate: "0.10",
  cashflows: [
    { amount: "-100000", date: "2025-01-10" },
    { amount: "50000",   date: "2025-07-01" },
    { amount: "60000",   date: "2026-01-10" },
  ],
  dayCount: "act/365-fixed",
});
```

### IRR / XIRR / MIRR

All return `SolveResult` with convergence diagnostics.

```ts
import { irr, xirr, mirr } from "@finprecise/cashflow";

// IRR
const result = irr(["-100000", "30000", "35000", "40000", "25000"]);
if (result.ok) {
  console.log(`IRR: ${result.value.toFixed(4)}, converged in ${result.iterations} iterations`);
}

// XIRR with explicit day count and solver config
const xResult = xirr({
  cashflows: [
    { amount: "-100000", date: "2025-01-10" },
    { amount: "25000",   date: "2025-06-30" },
    { amount: "90000",   date: "2026-03-01" },
  ],
  dayCount: "act/365-fixed",
  solver: { method: "hybrid", guess: "0.10", maxIterations: 128, tolerance: "1e-12" },
});

// MIRR
mirr(["-100", "50", "40", "30", "20"], "0.10", "0.12"); // → 0.1486
```

## Compatibility

| Function | numpy-financial | Excel |
|---|---|---|
| `pv` | `npf.pv` | `PV` |
| `fv` | `npf.fv` | `FV` |
| `pmt` | `npf.pmt` | `PMT` |
| `nper` | `npf.nper` | `NPER` |
| `rate` | `npf.rate` | `RATE` |
| `ipmt` | `npf.ipmt` | `IPMT` |
| `ppmt` | `npf.ppmt` | `PPMT` |
| `npv` | `npf.npv` | — |
| `xnpv` | — | `XNPV` |
| `irr` | `npf.irr` | `IRR` |
| `xirr` | — | `XIRR` |
| `mirr` | `npf.mirr` | `MIRR` |

## License

[MIT](../../LICENSE)
