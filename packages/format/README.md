# @finprecise/format

Locale-aware display formatting for financial values, built on `Intl.NumberFormat`.

Part of the [finprecise](https://github.com/yasu/finprecise) financial calculation engine.

## Install

```bash
npm install @finprecise/format @finprecise/core
```

## API

### formatCurrency

```ts
import { formatCurrency } from "@finprecise/format";

formatCurrency("1234567.89");
// → "$1,234,567.89"

formatCurrency("1234567.89", { currency: "JPY", locale: "ja-JP" });
// → "￥1,234,568"

formatCurrency("1234567.89", { currency: "EUR", locale: "de-DE" });
// → "1.234.567,89 €"

formatCurrency("-500.50", { signDisplay: "always" });
// → "-$500.50"
```

### formatNumber

```ts
import { formatNumber } from "@finprecise/format";

formatNumber("1234567.89");
// → "1,234,567.89"

formatNumber("0.123456", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
// → "0.1235"
```

### formatPercent

```ts
import { formatPercent } from "@finprecise/format";

formatPercent("0.0625");
// → "6.25%"

formatPercent("0.0625", { locale: "ja-JP" });
// → "6.25%"
```

## Options

| Option | Default | Description |
|---|---|---|
| `currency` | `"USD"` | ISO 4217 currency code |
| `locale` | `"en-US"` | Locale for `Intl.NumberFormat` |
| `minimumFractionDigits` | `2` | Minimum decimal places |
| `maximumFractionDigits` | `2` (`4` for percent) | Maximum decimal places |
| `currencyDisplay` | `"symbol"` | `"symbol" \| "narrowSymbol" \| "code" \| "name"` |
| `signDisplay` | `"auto"` | `"auto" \| "never" \| "always" \| "exceptZero"` |

## Design Note

This package is for **display only**. It does not perform any rounding for calculation purposes. Computation and display are strictly separated in finprecise — use `@finprecise/core`'s `round()` for calculation rounding.

## License

[MIT](../../LICENSE)
