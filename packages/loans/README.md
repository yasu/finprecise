# @finprecise/loans

Loan amortization schedule engine for the [finprecise](https://github.com/yasu/finprecise) financial calculation engine.

## Install

```bash
npm install @finprecise/loans @finprecise/core
```

## API

### loanSchedule

Generates a full amortization schedule with support for multiple repayment methods, variable rates, grace periods, prepayments, and fees.

```ts
import { loanSchedule } from "@finprecise/loans";

const schedule = loanSchedule({
  principal: "350000",
  periods: 360,
  repayment: { kind: "level-payment", timing: "end" },
  rateSteps: [
    { from: 1, annualRate: "0.0475" },
    { from: 37, annualRate: "0.0610" },  // rate changes after 3 years
  ],
  accrual: { dayCount: "30e/360", compounding: "monthly" },
  rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
});

for (const row of schedule.rows.slice(0, 3)) {
  console.log(
    `#${row.period} | Balance: ${row.beginBalance} | Payment: ${row.payment} | ` +
    `Principal: ${row.principal} | Interest: ${row.interest} | End: ${row.endBalance}`
  );
}

console.log(`Total interest: ${schedule.summary.totalInterest}`);
console.log(`Total payment: ${schedule.summary.totalPayment}`);
```

### Repayment Methods

| Kind | Description |
|---|---|
| `level-payment` | Equal total payment each period (元利均等) |
| `level-principal` | Equal principal payment each period (元金均等) |
| `interest-only` | Pay only interest, principal at maturity |
| `bullet` | No payments until maturity (lump sum) |
| `custom` | Custom payment schedule |

### Features

- **Variable rates**: Define rate changes with `rateSteps` at any period
- **Grace periods**: Interest-only periods before regular repayment begins
- **Prepayments**: Extra payments with `shorten-term` or `reduce-payment` strategies
- **Fees**: Arbitrary fees attached to specific periods
- **Day count conventions**: All 6 basis types supported via `@finprecise/core`

### Output

Each `ScheduleRow` contains:

| Field | Description |
|---|---|
| `period` | Period number (1-based) |
| `beginBalance` | Balance at start of period |
| `payment` | Total payment amount |
| `principal` | Principal portion |
| `interest` | Interest portion |
| `prepayment` | Prepayment amount |
| `fee` / `feeLabel` | Fee amount and label |
| `endBalance` | Balance at end of period |
| `annualRate` | Annual rate applied |

The `summary` provides totals: `totalPayment`, `totalInterest`, `totalPrincipal`, `totalFees`, `totalPrepayment`, `effectivePeriods`.

## License

[MIT](../../LICENSE)
