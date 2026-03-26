import { describe, it, expect } from "vitest";
import { loanSchedule } from "../src/index";
import { toDecimal } from "@finprecise/core";

describe("loanSchedule - level-payment", () => {
  it("generates correct number of rows", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 12,
      repayment: { kind: "level-payment", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.06" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    expect(result.rows.length).toBe(12);
  });

  it("final balance is zero", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 12,
      repayment: { kind: "level-payment", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.06" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    const lastRow = result.rows[result.rows.length - 1];
    expect(lastRow.endBalance.toNumber()).toBeCloseTo(0, 0);
  });

  it("total principal equals original principal", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 60,
      repayment: { kind: "level-payment", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.05" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    expect(result.summary.totalPrincipal.toNumber()).toBeCloseTo(100000, 0);
  });

  it("first period interest is correct", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 12,
      repayment: { kind: "level-payment", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.12" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    // First month interest = 100000 * 0.01 = 1000
    expect(result.rows[0].interest.toNumber()).toBe(1000);
  });
});

describe("loanSchedule - level-principal", () => {
  it("all principal portions are equal", () => {
    const result = loanSchedule({
      principal: "120000",
      periods: 12,
      repayment: { kind: "level-principal", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.06" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    // Each principal portion should be 10000
    expect(result.rows[0].principal.toNumber()).toBe(10000);
    expect(result.rows[5].principal.toNumber()).toBe(10000);
  });

  it("interest decreases over time", () => {
    const result = loanSchedule({
      principal: "120000",
      periods: 12,
      repayment: { kind: "level-principal", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.12" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    expect(result.rows[0].interest.gt(result.rows[11].interest)).toBe(true);
  });
});

describe("loanSchedule - interest-only", () => {
  it("principal is always zero", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 12,
      repayment: { kind: "interest-only", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.06" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    for (const row of result.rows) {
      expect(row.principal.toNumber()).toBe(0);
    }
    // Balance never changes
    expect(result.rows[11].endBalance.toNumber()).toBe(100000);
  });
});

describe("loanSchedule - bullet", () => {
  it("pays interest only, then full principal at end", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 12,
      repayment: { kind: "bullet", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.06" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    // All but last period: interest only
    for (let i = 0; i < 11; i++) {
      expect(result.rows[i].principal.toNumber()).toBe(0);
    }
    // Last period: full principal
    expect(result.rows[11].principal.toNumber()).toBe(100000);
    expect(result.rows[11].endBalance.toNumber()).toBe(0);
  });
});

describe("loanSchedule - variable rate", () => {
  it("rate changes at specified period", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 24,
      repayment: { kind: "level-payment", timing: "end" },
      rateSteps: [
        { from: 1, annualRate: "0.04" },
        { from: 13, annualRate: "0.06" },
      ],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
    });
    // Rate changes at period 13
    expect(result.rows[0].annualRate.toNumber()).toBe(0.04);
    expect(result.rows[12].annualRate.toNumber()).toBe(0.06);
  });
});

describe("loanSchedule - grace periods", () => {
  it("grace periods are interest-only", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 15,
      repayment: { kind: "level-payment", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.06" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
      gracePeriods: 3,
    });
    // First 3 periods: interest only
    for (let i = 0; i < 3; i++) {
      expect(result.rows[i].principal.toNumber()).toBe(0);
      expect(result.rows[i].endBalance.toNumber()).toBe(100000);
    }
    // Period 4: principal repayment starts
    expect(result.rows[3].principal.toNumber()).toBeGreaterThan(0);
  });
});

describe("loanSchedule - prepayment", () => {
  it("prepayment reduces balance", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 24,
      repayment: { kind: "level-payment", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.06" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
      prepayments: [{ period: 6, amount: "10000", strategy: "shorten-term" }],
    });
    // After prepayment, balance drops
    const beforePP = result.rows[4].endBalance;
    const afterPP = result.rows[5].endBalance;
    // Balance drop should be > regular principal + 10000
    expect(beforePP.minus(afterPP).toNumber()).toBeGreaterThan(10000);
  });
});

describe("loanSchedule - fees", () => {
  it("includes fees in schedule", () => {
    const result = loanSchedule({
      principal: "100000",
      periods: 12,
      repayment: { kind: "level-payment", timing: "end" },
      rateSteps: [{ from: 1, annualRate: "0.06" }],
      accrual: { dayCount: "30/360", compounding: "monthly" },
      rounding: { interest: "half-up", payment: "half-up", balance: "half-up", scale: 2 },
      fees: [{ period: 1, amount: "500", label: "Origination fee" }],
    });
    expect(result.rows[0].fee.toNumber()).toBe(500);
    expect(result.rows[0].feeLabel).toBe("Origination fee");
    expect(result.summary.totalFees.toNumber()).toBe(500);
  });
});
