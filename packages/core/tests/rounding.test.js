import { describe, it, expect } from "vitest";
import { round, toDecimal } from "../src/index";
describe("round", () => {
    it("half-up: rounds 2.5 to 3", () => {
        expect(round(toDecimal("2.5"), 0, "half-up").toNumber()).toBe(3);
    });
    it("half-up: rounds 2.45 to 2.5 at 1 decimal", () => {
        expect(round(toDecimal("2.45"), 1, "half-up").toNumber()).toBe(2.5);
    });
    it("half-even (banker's): rounds 2.5 to 2", () => {
        expect(round(toDecimal("2.5"), 0, "half-even").toNumber()).toBe(2);
    });
    it("half-even (banker's): rounds 3.5 to 4", () => {
        expect(round(toDecimal("3.5"), 0, "half-even").toNumber()).toBe(4);
    });
    it("down (truncate): rounds 2.9 to 2", () => {
        expect(round(toDecimal("2.9"), 0, "down").toNumber()).toBe(2);
    });
    it("up: rounds 2.1 to 3", () => {
        expect(round(toDecimal("2.1"), 0, "up").toNumber()).toBe(3);
    });
    it("ceiling: rounds -2.5 to -2", () => {
        expect(round(toDecimal("-2.5"), 0, "ceiling").toNumber()).toBe(-2);
    });
    it("floor: rounds -2.5 to -3", () => {
        expect(round(toDecimal("-2.5"), 0, "floor").toNumber()).toBe(-3);
    });
    it("2 decimal places: currency rounding", () => {
        expect(round(toDecimal("123.456"), 2, "half-up").toString()).toBe("123.46");
        expect(round(toDecimal("123.454"), 2, "half-up").toString()).toBe("123.45");
    });
});
//# sourceMappingURL=rounding.test.js.map