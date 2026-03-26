# @finprecise/fixtures

Verification data for the [finprecise](https://github.com/yasu/finprecise) financial calculation engine.

Cross-referenced expected values from numpy-financial, Excel, and LibreOffice.

## Install

```bash
npm install @finprecise/fixtures
```

## Usage

```ts
import { pvFixtures, irrFixtures, xirrFixtures } from "@finprecise/fixtures";
import { pv } from "@finprecise/cashflow";
import { decimalClose } from "@finprecise/core";

for (const fixture of pvFixtures) {
  const result = pv(fixture.input.rate, fixture.input.nper, fixture.input.pmt);
  const pass = decimalClose(result, fixture.expected, fixture.tolerance ?? "0.01");
  console.log(`${fixture.description}: ${pass ? "PASS" : "FAIL"}`);
}
```

## Available Fixtures

| Fixture | Source | Description |
|---|---|---|
| `pvFixtures` | numpy-financial | Present value |
| `fvFixtures` | numpy-financial | Future value |
| `pmtFixtures` | Excel, numpy-financial | Payment |
| `irrFixtures` | numpy-financial | Internal rate of return |
| `xirrFixtures` | Excel | Extended IRR with dates |
| `npvFixtures` | numpy-financial | Net present value |
| `mirrFixtures` | numpy-financial | Modified IRR |
| `depreciationFixtures` | Excel | SLN, DDB, SYD |
| `yearFracFixtures` | Excel | Day count year fractions |

## Fixture Format

```ts
interface Fixture<TInput, TExpected> {
  description: string;
  source: "numpy-financial" | "excel" | "libreoffice" | "manual";
  input: TInput;
  expected: TExpected;
  tolerance?: string;
}
```

## License

[MIT](../../LICENSE)
