import { describe, it, expect } from "vitest";
import { solve, solveNewton, solveBisection, toDecimal } from "../src/index";
describe("solver", () => {
    // Solve x^2 - 4 = 0 → x = 2
    const f = (x) => x.pow(2).minus(4);
    const fPrime = (x) => x.mul(2);
    it("Newton's method finds x=2 for x^2=4", () => {
        const result = solveNewton(f, fPrime, {
            method: "newton",
            guess: "1.5",
            maxIterations: 50,
            tolerance: "1e-12",
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.toNumber()).toBeCloseTo(2, 10);
        }
    });
    it("Bisection finds x=2 for x^2=4", () => {
        const result = solveBisection(f, toDecimal("0"), toDecimal("5"), {
            maxIterations: 100,
            tolerance: "1e-12",
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.toNumber()).toBeCloseTo(2, 8);
        }
    });
    it("Hybrid solver finds x=2 for x^2=4", () => {
        const result = solve(f, fPrime, { guess: "3" });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.toNumber()).toBeCloseTo(2, 10);
        }
    });
    it("Reports no-bracket when signs are same", () => {
        const result = solveBisection(f, toDecimal("3"), toDecimal("5"), {
            maxIterations: 100,
            tolerance: "1e-12",
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("no-bracket");
        }
    });
});
//# sourceMappingURL=solver.test.js.map