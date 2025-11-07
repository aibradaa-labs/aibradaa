/**
 * AI Bradaa - Data Schema Tests
 *
 * Validates data files against expected schemas
 */

import { test, expect } from '@jest/globals';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

test('laptops.json has valid structure', async () => {
  const content = await fs.readFile(join(ROOT, 'data', 'laptops.json'), 'utf-8');
  const data = JSON.parse(content);

  // Check top-level structure
  expect(data).toHaveProperty('catalog');
  expect(data).toHaveProperty('laptops');
  expect(Array.isArray(data.laptops)).toBe(true);

  // Check catalog metadata
  expect(data.catalog).toHaveProperty('version');
  expect(data.catalog).toHaveProperty('lastUpdated');
  expect(data.catalog).toHaveProperty('totalLaptops');

  // Check each laptop has required fields
  for (const laptop of data.laptops) {
    expect(laptop).toHaveProperty('id');
    expect(laptop).toHaveProperty('brand');
    expect(laptop).toHaveProperty('model');
    expect(laptop).toHaveProperty('price');
    expect(laptop).toHaveProperty('specs');

    // Check specs structure
    expect(laptop.specs).toHaveProperty('cpu');
    expect(laptop.specs).toHaveProperty('ram');
    expect(laptop.specs).toHaveProperty('storage');
    expect(laptop.specs).toHaveProperty('display');

    // Validate data types
    expect(typeof laptop.id).toBe('string');
    expect(typeof laptop.brand).toBe('string');
    expect(typeof laptop.price).toBe('number');
    expect(laptop.price).toBeGreaterThan(0);
  }
});

test('brands.json has valid structure', async () => {
  const content = await fs.readFile(join(ROOT, 'data', 'brands.json'), 'utf-8');
  const data = JSON.parse(content);

  expect(data).toHaveProperty('brands');
  expect(Array.isArray(data.brands)).toBe(true);

  for (const brand of data.brands) {
    expect(brand).toHaveProperty('id');
    expect(brand).toHaveProperty('name');
    expect(brand).toHaveProperty('country');
    expect(brand).toHaveProperty('tier');
    expect(brand).toHaveProperty('active');

    expect(typeof brand.id).toBe('string');
    expect(typeof brand.name).toBe('string');
    expect(typeof brand.active).toBe('boolean');
  }
});

test('segments.json has valid structure', async () => {
  const content = await fs.readFile(join(ROOT, 'data', 'segments.json'), 'utf-8');
  const data = JSON.parse(content);

  expect(data).toHaveProperty('segments');
  expect(Array.isArray(data.segments)).toBe(true);

  for (const segment of data.segments) {
    expect(segment).toHaveProperty('id');
    expect(segment).toHaveProperty('name');
    expect(segment).toHaveProperty('description');
    expect(segment).toHaveProperty('criteria');
    expect(segment).toHaveProperty('useCases');

    expect(typeof segment.id).toBe('string');
    expect(typeof segment.name).toBe('string');
    expect(Array.isArray(segment.useCases)).toBe(true);
  }
});

test('price-drops.json has valid structure', async () => {
  const content = await fs.readFile(join(ROOT, 'data', 'price-drops.json'), 'utf-8');
  const data = JSON.parse(content);

  expect(data).toHaveProperty('priceDrops');
  expect(data).toHaveProperty('drops');
  expect(Array.isArray(data.drops)).toBe(true);

  for (const drop of data.drops) {
    expect(drop).toHaveProperty('id');
    expect(drop).toHaveProperty('laptopId');
    expect(drop).toHaveProperty('currentPrice');
    expect(drop).toHaveProperty('originalPrice');
    expect(drop).toHaveProperty('discount');
    expect(drop).toHaveProperty('discountPercent');

    expect(typeof drop.currentPrice).toBe('number');
    expect(typeof drop.originalPrice).toBe('number');
    expect(drop.currentPrice).toBeLessThan(drop.originalPrice);
    expect(drop.discountPercent).toBeGreaterThan(0);
  }
});
