# @finprecise/depreciation

Excel-compatible depreciation methods for the [finprecise](https://github.com/yasu/finprecise) financial calculation engine.

## Install

```bash
npm install @finprecise/depreciation @finprecise/core
```

## API

### sln — Straight-Line

```ts
import { sln } from "@finprecise/depreciation";

// $30,000 asset, $7,500 salvage, 10-year life
sln("30000", "7500", "10"); // → 2250
```

### db — Fixed-Declining Balance

```ts
import { db } from "@finprecise/depreciation";

// $1,000,000 asset, $100,000 salvage, 6-year life, period 1
db("1000000", "100000", "6", "1"); // → 319000

// With partial first year (9 months)
db("1000000", "100000", "6", "1", "9");
```

### ddb — Double-Declining Balance

```ts
import { ddb } from "@finprecise/depreciation";

// $1,000,000 asset, $100,000 salvage, 6-year life, period 1
ddb("1000000", "100000", "6", "1"); // → 333333.33

// Custom factor (e.g., 1.5 for 150% declining)
ddb("1000000", "100000", "6", "1", "1.5");
```

### syd — Sum-of-Years-Digits

```ts
import { syd } from "@finprecise/depreciation";

// $30,000 asset, $7,500 salvage, 10-year life, period 1
syd("30000", "7500", "10", "1"); // → 4090.91
```

## Compatibility

| Function | Excel | Description |
|---|---|---|
| `sln` | `SLN` | Straight-line depreciation |
| `db` | `DB` | Fixed-declining balance |
| `ddb` | `DDB` | Double-declining balance |
| `syd` | `SYD` | Sum-of-years-digits |

## License

[MIT](../../LICENSE)
