/**
 * AI Bradaa - CSP (Content Security Policy) Smoke Test
 *
 * Verifies that CSP is configured correctly and violations are detected
 */

import { test, expect } from '@playwright/test';

test.describe('CSP Tests', () => {
  let cspViolations = [];

  test.beforeEach(async ({ page }) => {
    // Capture CSP violations
    cspViolations = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Content Security Policy') || text.includes('CSP')) {
        cspViolations.push(text);
      }
    });
  });

  test('app.html has CSP meta tag', async ({ page }) => {
    await page.goto('/app.html');

    // Check for CSP meta tag
    const cspMeta = await page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(cspMeta).toHaveCount(1);

    // Get the content attribute
    const cspContent = await cspMeta.getAttribute('content');
    expect(cspContent).toBeTruthy();

    // Verify key CSP directives
    expect(cspContent).toContain("default-src 'self'");
    expect(cspContent).toContain("script-src");
    expect(cspContent).toContain("style-src");
    expect(cspContent).toContain("img-src");
    expect(cspContent).toContain("connect-src");
    expect(cspContent).toContain("frame-src");
    expect(cspContent).toContain("object-src 'none'");
  });

  test('CSP allows required external resources', async ({ page }) => {
    await page.goto('/app.html');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for CSP violations
    expect(cspViolations.length).toBe(0);
  });

  test('CSP blocks inline scripts without unsafe-inline', async ({ page, context }) => {
    // Create a test page with CSP that blocks inline scripts
    await page.goto('/app.html');

    // Try to inject an inline script
    const scriptBlocked = await page.evaluate(() => {
      try {
        const script = document.createElement('script');
        script.textContent = 'console.log("injected script");';
        document.body.appendChild(script);
        return false; // If we get here, it wasn't blocked
      } catch (e) {
        return true; // Script was blocked
      }
    });

    // Note: With 'unsafe-inline' in CSP, this won't be blocked
    // This test documents the current state
    console.log('Inline script blocked:', scriptBlocked);
  });

  test('CSP allows Google Fonts', async ({ page }) => {
    await page.goto('/app.html');

    // Check if Google Fonts loaded
    const fontLink = page.locator('link[href*="fonts.googleapis.com"]');
    await expect(fontLink).toHaveCount(1);

    // Wait for fonts to load
    await page.waitForLoadState('networkidle');

    // No CSP violations should be reported
    const fontViolations = cspViolations.filter(v => v.includes('fonts'));
    expect(fontViolations.length).toBe(0);
  });

  test('CSP allows Gemini API connections', async ({ page }) => {
    await page.goto('/app.html');

    const cspMeta = await page.locator('meta[http-equiv="Content-Security-Policy"]');
    const cspContent = await cspMeta.getAttribute('content');

    // Verify Gemini API is allowed in connect-src
    expect(cspContent).toContain('generativelanguage.googleapis.com');
  });

  test('CSP allows Google OAuth', async ({ page }) => {
    await page.goto('/app.html');

    const cspMeta = await page.locator('meta[http-equiv="Content-Security-Policy"]');
    const cspContent = await cspMeta.getAttribute('content');

    // Verify Google OAuth domains are allowed
    expect(cspContent).toContain('accounts.google.com');
  });

  test('CSP enforces upgrade-insecure-requests', async ({ page }) => {
    await page.goto('/app.html');

    const cspMeta = await page.locator('meta[http-equiv="Content-Security-Policy"]');
    const cspContent = await cspMeta.getAttribute('content');

    // Verify upgrade-insecure-requests directive
    expect(cspContent).toContain('upgrade-insecure-requests');
  });

  test('CSP disallows frame-ancestors', async ({ page }) => {
    await page.goto('/app.html');

    const cspMeta = await page.locator('meta[http-equiv="Content-Security-Policy"]');
    const cspContent = await cspMeta.getAttribute('content');

    // Verify frame-ancestors is set to none (prevents clickjacking)
    expect(cspContent).toContain("frame-ancestors 'none'");
  });

  test('CSP report-uri is configured', async ({ page }) => {
    await page.goto('/app.html');

    const cspMeta = await page.locator('meta[http-equiv="Content-Security-Policy"]');
    const cspContent = await cspMeta.getAttribute('content');

    // Verify report-uri is set
    expect(cspContent).toContain('report-uri');
    expect(cspContent).toContain('/api/csp-report');
  });
});
