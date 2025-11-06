/**
 * Smoke Tests
 * Basic tests to ensure critical functionality works
 */

import { strict as assert } from 'assert';
import { describe, it } from 'node:test';

describe('Smoke Tests', () => {
  it('should load environment variables', () => {
    assert.ok(process.env.NODE_ENV !== undefined, 'NODE_ENV should be defined');
  });

  it('should have required env vars for production', () => {
    const required = ['GEMINI_API_KEY', 'JWT_SECRET', 'SESSION_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (process.env.NODE_ENV === 'production') {
      assert.strictEqual(missing.length, 0, `Missing env vars: ${missing.join(', ')}`);
    }
  });

  it('should validate package.json exists', async () => {
    const fs = await import('fs/promises');
    const packageJson = await fs.readFile('./package.json', 'utf-8');
    const pkg = JSON.parse(packageJson);

    assert.ok(pkg.name === 'ai-bradaa', 'Package name should be ai-bradaa');
    assert.ok(pkg.version, 'Package should have a version');
  });

  it('should check critical dependencies', async () => {
    const fs = await import('fs/promises');
    const packageJson = await fs.readFile('./package.json', 'utf-8');
    const pkg = JSON.parse(packageJson);

    const critical = ['express', '@google/generative-ai', 'bcryptjs', 'jsonwebtoken'];
    critical.forEach(dep => {
      assert.ok(
        pkg.dependencies[dep],
        `Critical dependency ${dep} should be present`
      );
    });
  });
});
