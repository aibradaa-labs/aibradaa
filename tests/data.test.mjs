/**
 * Data Validation Tests
 * Tests for laptop data structure and validation
 */

import { strict as assert } from 'assert';
import { describe, it } from 'node:test';
import Ajv from 'ajv';

describe('Data Validation Tests', () => {
  const ajv = new Ajv();

  const laptopSchema = {
    type: 'object',
    required: ['id', 'brand', 'model', 'price_MYR', 'cpu', 'ram', 'storage'],
    properties: {
      id: { type: 'string' },
      brand: { type: 'string' },
      model: { type: 'string' },
      price_MYR: { type: 'number', minimum: 0 },
      cpu: {
        type: 'object',
        required: ['gen', 'cores'],
        properties: {
          gen: { type: 'string' },
          cores: { type: 'number', minimum: 2 }
        }
      },
      ram: {
        type: 'object',
        required: ['gb'],
        properties: {
          gb: { type: 'number', minimum: 4 }
        }
      },
      storage: {
        type: 'object',
        required: ['gb'],
        properties: {
          gb: { type: 'number', minimum: 128 }
        }
      },
      score_composite: { type: 'number', minimum: 0, maximum: 100 }
    }
  };

  const validate = ajv.compile(laptopSchema);

  it('should validate correct laptop data', () => {
    const validLaptop = {
      id: 'laptop-001',
      brand: 'Apple',
      model: 'MacBook Air M4',
      price_MYR: 5499,
      cpu: { gen: 'Apple M4', cores: 8 },
      ram: { gb: 16 },
      storage: { gb: 512 },
      score_composite: 95.5
    };

    const valid = validate(validLaptop);
    assert.ok(valid, 'Valid laptop should pass validation');
  });

  it('should reject laptop with missing required fields', () => {
    const invalidLaptop = {
      id: 'laptop-002',
      brand: 'Dell'
      // Missing required fields
    };

    const valid = validate(invalidLaptop);
    assert.ok(!valid, 'Laptop with missing fields should fail validation');
  });

  it('should reject invalid price', () => {
    const invalidLaptop = {
      id: 'laptop-003',
      brand: 'HP',
      model: 'Pavilion',
      price_MYR: -100, // Invalid negative price
      cpu: { gen: 'Intel Core i5', cores: 4 },
      ram: { gb: 8 },
      storage: { gb: 256 }
    };

    const valid = validate(invalidLaptop);
    assert.ok(!valid, 'Laptop with negative price should fail validation');
  });

  it('should reject invalid score', () => {
    const invalidLaptop = {
      id: 'laptop-004',
      brand: 'Lenovo',
      model: 'ThinkPad',
      price_MYR: 4999,
      cpu: { gen: 'AMD Ryzen 7', cores: 8 },
      ram: { gb: 16 },
      storage: { gb: 512 },
      score_composite: 150 // Invalid score > 100
    };

    const valid = validate(invalidLaptop);
    assert.ok(!valid, 'Laptop with score > 100 should fail validation');
  });

  it('should validate minimum hardware specs', () => {
    const laptop = {
      id: 'laptop-005',
      brand: 'Acer',
      model: 'Aspire',
      price_MYR: 2499,
      cpu: { gen: 'Intel Core i3', cores: 2 },
      ram: { gb: 4 },
      storage: { gb: 128 }
    };

    const valid = validate(laptop);
    assert.ok(valid, 'Laptop with minimum specs should pass validation');
  });
});
