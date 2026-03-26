# @finprecise/bonds

Bond valuation and analytics for the [finprecise](https://github.com/yasu/finprecise) financial calculation engine.

## Install

```bash
npm install @finprecise/bonds @finprecise/core
```

## API

### bondPrice

Calculate the present value of a bond given a yield to maturity.

```ts
import { bondPrice } from "@finprecise/bonds";

// 10-year bond, 6% coupon, semiannual, priced at 5% yield
const price = bondPrice({
  faceValue: "1000",
  couponRate: "0.06",
  yieldRate: "0.05",
  frequency: 2,
  periods: 20,
});
// → ~1077.95 (premium bond)
```

### bondYield

Solve for yield to maturity (YTM) given a market price. Returns `SolveResult` with convergence diagnostics.

```ts
import { bondYield } from "@finprecise/bonds";

const result = bondYield({
  faceValue: "1000",
  couponRate: "0.06",
  frequency: 2,
  periods: 20,
  marketPrice: "1050",
});

if (result.ok) {
  console.log(`YTM: ${result.value.toFixed(4)}, converged in ${result.iterations} iterations`);
}
```

### bondDuration

Calculate Macaulay duration and modified duration.

```ts
import { bondDuration } from "@finprecise/bonds";

const { macaulay, modified } = bondDuration({
  faceValue: "1000",
  couponRate: "0.06",
  yieldRate: "0.06",
  frequency: 2,
  periods: 20,
});
// macaulay → ~7.66 years
// modified → ~7.44
```

### bondConvexity

Calculate bond convexity for measuring price sensitivity to yield changes.

```ts
import { bondConvexity } from "@finprecise/bonds";

const convexity = bondConvexity({
  faceValue: "1000",
  couponRate: "0.06",
  yieldRate: "0.06",
  frequency: 2,
  periods: 20,
});
// → ~68.8
```

### bondAnalytics

Calculate all analytics in a single call.

```ts
import { bondAnalytics } from "@finprecise/bonds";

const result = bondAnalytics({
  faceValue: "1000",
  couponRate: "0.06",
  yieldRate: "0.05",
  frequency: 2,
  periods: 20,
});

console.log(`Price: ${result.price}`);
console.log(`Macaulay Duration: ${result.macaulayDuration}`);
console.log(`Modified Duration: ${result.modifiedDuration}`);
console.log(`Convexity: ${result.convexity}`);
```

## Price Approximation with Duration & Convexity

```ts
// Estimate price change for a +50bp yield shift
const dy = 0.005;
const durationEffect = -modified.toNumber() * dy;
const convexityEffect = 0.5 * convexity.toNumber() * dy * dy;
const approxPriceChange = (durationEffect + convexityEffect) * price.toNumber();
```

## Types

| Type | Description |
|---|---|
| `CouponFrequency` | `1 \| 2 \| 4 \| 12` — annual, semi, quarterly, monthly |
| `BondInput` | Base: faceValue, couponRate, frequency, periods |
| `BondPriceInput` | BondInput + yieldRate |
| `BondYieldInput` | BondInput + marketPrice |
| `DurationResult` | `{ macaulay: Decimal, modified: Decimal }` |
| `BondAnalytics` | Price, accrued interest, dirty price, duration, convexity |

## License

[MIT](../../LICENSE)
