/**
 * Helper Functions Tests
 * Tests for utility helper functions
 */

import { strict as assert } from 'assert';
import { describe, it } from 'node:test';
import {
  formatCurrency,
  formatDate,
  debounce,
  throttle,
  deepClone,
  generateId,
  truncate,
  Validators,
  ArrayUtils
} from '../public/js/utils/helpers.js';

describe('Helper Functions Tests', () => {

  describe('formatCurrency', () => {
    it('should format Malaysian Ringgit correctly', () => {
      const result = formatCurrency(5000);
      assert.ok(result.includes('5'));
      assert.ok(result.includes('000'));
    });

    it('should handle decimal values', () => {
      const result = formatCurrency(5000.99);
      assert.ok(result.includes('5'));
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      assert.ok(result.includes('0'));
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(15000);
      assert.ok(result.length > 0);
    });
  });

  describe('deepClone', () => {
    it('should clone objects without reference', () => {
      const original = { name: 'MacBook', price: 5000, specs: { ram: 16 } };
      const cloned = deepClone(original);

      cloned.specs.ram = 32;

      assert.strictEqual(original.specs.ram, 16);
      assert.strictEqual(cloned.specs.ram, 32);
    });

    it('should clone arrays', () => {
      const original = [1, 2, 3, { value: 4 }];
      const cloned = deepClone(original);

      cloned[3].value = 5;

      assert.strictEqual(original[3].value, 4);
      assert.strictEqual(cloned[3].value, 5);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      assert.notStrictEqual(id1, id2);
      assert.ok(id1.length > 0);
      assert.ok(id2.length > 0);
    });

    it('should include timestamp', () => {
      const id = generateId();
      assert.ok(id.includes('-'));
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const long = 'This is a very long string that should be truncated';
      const result = truncate(long, 20);

      assert.ok(result.length <= 23); // 20 + '...'
      assert.ok(result.includes('...'));
    });

    it('should not truncate short strings', () => {
      const short = 'Short';
      const result = truncate(short, 20);

      assert.strictEqual(result, short);
      assert.ok(!result.includes('...'));
    });

    it('should handle empty strings', () => {
      const result = truncate('', 10);
      assert.strictEqual(result, '');
    });
  });

  describe('Validators', () => {
    describe('email', () => {
      it('should validate correct emails', () => {
        assert.ok(Validators.email('test@example.com'));
        assert.ok(Validators.email('user.name+tag@domain.co.my'));
      });

      it('should reject invalid emails', () => {
        assert.ok(!Validators.email('invalid'));
        assert.ok(!Validators.email('test@'));
        assert.ok(!Validators.email('@domain.com'));
        assert.ok(!Validators.email('test @domain.com'));
      });
    });

    describe('phone', () => {
      it('should validate Malaysian phone numbers', () => {
        assert.ok(Validators.phone('0123456789'));
        assert.ok(Validators.phone('+60123456789'));
        assert.ok(Validators.phone('01112345678'));
      });

      it('should reject invalid phone numbers', () => {
        assert.ok(!Validators.phone('123456'));
        assert.ok(!Validators.phone('abcdefghij'));
      });
    });

    describe('password', () => {
      it('should validate strong passwords', () => {
        assert.ok(Validators.password('Password123'));
        assert.ok(Validators.password('MySecure1Pass'));
      });

      it('should reject weak passwords', () => {
        assert.ok(!Validators.password('short'));
        assert.ok(!Validators.password('onlyletters'));
        assert.ok(!Validators.password('12345678'));
        assert.ok(!Validators.password('Pass1')); // Too short
      });
    });

    describe('required', () => {
      it('should validate non-empty values', () => {
        assert.ok(Validators.required('test'));
        assert.ok(Validators.required(123));
        assert.ok(Validators.required(true));
      });

      it('should reject empty values', () => {
        assert.ok(!Validators.required(''));
        assert.ok(!Validators.required('   '));
        assert.ok(!Validators.required(null));
        assert.ok(!Validators.required(undefined));
      });
    });
  });

  describe('ArrayUtils', () => {
    describe('unique', () => {
      it('should remove duplicates', () => {
        const result = ArrayUtils.unique([1, 2, 2, 3, 3, 3]);
        assert.deepStrictEqual(result, [1, 2, 3]);
      });

      it('should handle strings', () => {
        const result = ArrayUtils.unique(['a', 'b', 'a', 'c']);
        assert.deepStrictEqual(result, ['a', 'b', 'c']);
      });
    });

    describe('chunk', () => {
      it('should split array into chunks', () => {
        const result = ArrayUtils.chunk([1, 2, 3, 4, 5], 2);
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual(result[0], [1, 2]);
        assert.deepStrictEqual(result[1], [3, 4]);
        assert.deepStrictEqual(result[2], [5]);
      });
    });

    describe('shuffle', () => {
      it('should shuffle array', () => {
        const original = [1, 2, 3, 4, 5];
        const shuffled = ArrayUtils.shuffle(original);

        // Array should have same elements
        assert.strictEqual(shuffled.length, original.length);

        // Original should not be modified
        assert.deepStrictEqual(original, [1, 2, 3, 4, 5]);
      });
    });

    describe('sortBy', () => {
      it('should sort objects by key', () => {
        const items = [
          { name: 'Charlie', age: 30 },
          { name: 'Alice', age: 25 },
          { name: 'Bob', age: 35 }
        ];

        const result = ArrayUtils.sortBy(items, 'name');

        assert.strictEqual(result[0].name, 'Alice');
        assert.strictEqual(result[1].name, 'Bob');
        assert.strictEqual(result[2].name, 'Charlie');
      });

      it('should sort by number', () => {
        const items = [
          { price: 5000 },
          { price: 3000 },
          { price: 7000 }
        ];

        const result = ArrayUtils.sortBy(items, 'price');

        assert.strictEqual(result[0].price, 3000);
        assert.strictEqual(result[1].price, 5000);
        assert.strictEqual(result[2].price, 7000);
      });
    });
  });

  describe('debounce', () => {
    it('should delay function execution', (t, done) => {
      let callCount = 0;
      const fn = debounce(() => {
        callCount++;
      }, 100);

      fn();
      fn();
      fn();

      // Should not have called yet
      assert.strictEqual(callCount, 0);

      // Wait for debounce
      setTimeout(() => {
        assert.strictEqual(callCount, 1);
        done();
      }, 150);
    });
  });

  describe('throttle', () => {
    it('should limit function calls', (t, done) => {
      let callCount = 0;
      const fn = throttle(() => {
        callCount++;
      }, 100);

      fn(); // Called immediately
      fn(); // Throttled
      fn(); // Throttled

      assert.strictEqual(callCount, 1);

      setTimeout(() => {
        fn(); // Should be called after throttle period
        assert.strictEqual(callCount, 2);
        done();
      }, 150);
    });
  });

});
