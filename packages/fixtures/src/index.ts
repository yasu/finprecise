// @finprecise/fixtures — Verification data for financial calculations
//
// These fixtures provide expected values from authoritative sources
// (numpy-financial, Excel, LibreOffice) so users can verify that
// finprecise produces correct results.

export interface Fixture<TInput, TExpected> {
  /** Human-readable description */
  description: string;
  /** Source of the expected value */
  source: "numpy-financial" | "excel" | "libreoffice" | "manual";
  /** Input parameters */
  input: TInput;
  /** Expected output */
  expected: TExpected;
  /** Tolerance for floating-point comparison */
  tolerance?: string;
}

// ── TVM Fixtures (numpy-financial compatible) ──

export interface TvmInput {
  rate: string;
  nper: string;
  pmt: string;
  fv?: string;
  timing?: "begin" | "end";
}

export const pvFixtures: Fixture<TvmInput, string>[] = [
  {
    description: "PV of $100/month for 10 years at 5% annual (monthly rate)",
    source: "numpy-financial",
    input: { rate: "0.004166666666667", nper: "120", pmt: "-100", fv: "0" },
    expected: "9428.135",
    tolerance: "0.01",
  },
  {
    description: "PV with zero rate",
    source: "manual",
    input: { rate: "0", nper: "10", pmt: "-100", fv: "0" },
    expected: "1000",
    tolerance: "0.001",
  },
  {
    description: "PV annuity due",
    source: "numpy-financial",
    input: { rate: "0.08", nper: "5", pmt: "-1000", fv: "0", timing: "begin" },
    expected: "4312.127",
    tolerance: "0.01",
  },
];

export const fvFixtures: Fixture<TvmInput, string>[] = [
  {
    description: "FV of $100/month for 10 years at 5% annual",
    source: "numpy-financial",
    input: { rate: "0.004166666666667", nper: "120", pmt: "-100", fv: "0" },
    expected: "15528.228",
    tolerance: "0.01",
  },
];

export const pmtFixtures: Fixture<
  { rate: string; nper: string; pv: string; fv?: string; timing?: "begin" | "end" },
  string
>[] = [
  {
    description: "Monthly payment on $200,000 mortgage at 6% for 30 years",
    source: "excel",
    input: { rate: "0.005", nper: "360", pv: "200000", fv: "0" },
    expected: "-1199.101",
    tolerance: "0.01",
  },
  {
    description: "Monthly payment, annuity due",
    source: "numpy-financial",
    input: { rate: "0.01", nper: "12", pv: "10000", fv: "0", timing: "begin" },
    expected: "-879.159",
    tolerance: "0.01",
  },
];

// ── IRR Fixtures ──

export interface IrrInput {
  cashflows: string[];
}

export const irrFixtures: Fixture<IrrInput, string>[] = [
  {
    description: "Standard IRR example",
    source: "numpy-financial",
    input: { cashflows: ["-100", "39", "59", "55", "20"] },
    expected: "0.28095",
    tolerance: "0.0001",
  },
  {
    description: "Simple investment and return",
    source: "numpy-financial",
    input: { cashflows: ["-1000", "300", "300", "300", "300"] },
    expected: "0.07714",
    tolerance: "0.0001",
  },
];

// ── XIRR Fixtures ──

export interface XirrInput {
  cashflows: { amount: string; date: string }[];
  dayCount?: string;
}

export const xirrFixtures: Fixture<XirrInput, string>[] = [
  {
    description: "Excel XIRR example",
    source: "excel",
    input: {
      cashflows: [
        { amount: "-10000", date: "2008-01-01" },
        { amount: "2750", date: "2008-03-01" },
        { amount: "4250", date: "2008-10-30" },
        { amount: "3250", date: "2009-02-15" },
        { amount: "2750", date: "2009-04-01" },
      ],
      dayCount: "act/365-fixed",
    },
    expected: "0.373363",
    tolerance: "0.0001",
  },
];

// ── NPV Fixtures ──

export const npvFixtures: Fixture<{ rate: string; cashflows: string[] }, string>[] = [
  {
    description: "NPV at 10% discount rate",
    source: "numpy-financial",
    input: { rate: "0.10", cashflows: ["-100", "39", "59", "55", "20"] },
    expected: "36.089",
    tolerance: "0.01",
  },
];

// ── MIRR Fixtures ──

export const mirrFixtures: Fixture<
  { cashflows: string[]; financeRate: string; reinvestRate: string },
  string
>[] = [
  {
    description: "MIRR with 10% finance and 12% reinvest",
    source: "numpy-financial",
    input: {
      cashflows: ["-100", "50", "40", "30", "20"],
      financeRate: "0.10",
      reinvestRate: "0.12",
    },
    expected: "0.14855",
    tolerance: "0.001",
  },
];

// ── Depreciation Fixtures ──

export const depreciationFixtures = {
  sln: [
    {
      description: "SLN: $30,000 asset, $7,500 salvage, 10 year life",
      source: "excel" as const,
      input: { cost: "30000", salvage: "7500", life: "10" },
      expected: "2250",
      tolerance: "0.01",
    },
  ],
  ddb: [
    {
      description: "DDB: $1,000,000 asset, $100,000 salvage, 6 year life, period 1",
      source: "excel" as const,
      input: { cost: "1000000", salvage: "100000", life: "6", period: "1", factor: "2" },
      expected: "333333.333",
      tolerance: "0.01",
    },
  ],
  syd: [
    {
      description: "SYD: $30,000 asset, $7,500 salvage, 10 year life, period 1",
      source: "excel" as const,
      input: { cost: "30000", salvage: "7500", life: "10", period: "1" },
      expected: "4090.909",
      tolerance: "0.01",
    },
  ],
};

// ── Day Count Fixtures ──

export const yearFracFixtures: Fixture<
  { startDate: string; endDate: string; convention: string },
  string
>[] = [
  {
    description: "YEARFRAC act/365-fixed: 6 months",
    source: "excel",
    input: { startDate: "2025-01-01", endDate: "2025-07-01", convention: "act/365-fixed" },
    expected: "0.49589",
    tolerance: "0.001",
  },
  {
    description: "YEARFRAC 30/360: 6 months",
    source: "excel",
    input: { startDate: "2025-01-01", endDate: "2025-07-01", convention: "30/360" },
    expected: "0.5",
    tolerance: "0.001",
  },
  {
    description: "YEARFRAC act/360: 90 days",
    source: "excel",
    input: { startDate: "2025-01-01", endDate: "2025-04-01", convention: "act/360" },
    expected: "0.25",
    tolerance: "0.001",
  },
];
