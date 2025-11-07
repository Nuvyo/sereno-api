import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IsValidPriceConstraint } from '../decorators/is-valid-price.decorator';

describe('QueryPipe', () => {
  const isValidPrice = new IsValidPriceConstraint();

  describe('IsValidPriceConstraint.validate()', () => {
    it('should return true for valid price', () => {
      assert.strictEqual(isValidPrice.validate(123.45), true);
    });

    it('should return true for integer price', () => {
      assert.strictEqual(isValidPrice.validate(99999), true);
    });

    it('should return true for price with one decimal place', () => {
      assert.strictEqual(isValidPrice.validate(12.3), true);
    });

    it('should return true for price with two decimal places', () => {
      assert.strictEqual(isValidPrice.validate(0.99), true);
    });

    it('should return false for negative price', () => {
      assert.strictEqual(isValidPrice.validate(-1), false);
    });

    it('should return false for price with more than 5 integer digits', () => {
      assert.strictEqual(isValidPrice.validate(100000), false);
    });

    it('should return false for price with more than 2 decimal places', () => {
      assert.strictEqual(isValidPrice.validate(12.345), false);
    });

    it('should return false for NaN', () => {
      assert.strictEqual(isValidPrice.validate(NaN), false);
    });

    it('should return true for zero', () => {
      assert.strictEqual(isValidPrice.validate(0), true);
    });

    it('should return true for non-number input (string)', () => {
      // @ts-expect-error testing runtime behavior
      assert.strictEqual(isValidPrice.validate("123.45"), true);
    });

    it('should return false for non-number input (null)', () => {
      // @ts-expect-error testing runtime behavior
      assert.strictEqual(isValidPrice.validate(null), false);
    });

    it('should return false for non-number input (undefined)', () => {
      // @ts-expect-error testing runtime behavior
      assert.strictEqual(isValidPrice.validate(undefined), false);
    });
  });
});
