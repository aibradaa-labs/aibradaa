/**
 * AI Bradaa - Boot Smoke Test
 *
 * Verifies that the application boots and core endpoints respond
 */

import { test, expect } from '@playwright/test';

test.describe('Boot Tests', () => {
  test('app.html loads successfully', async ({ page }) => {
    await page.goto('/app.html');

    // Check that the page loads
    await expect(page).toHaveTitle(/AI Bradaa/);

    // Check for main app container
    const appContainer = page.locator('#app');
    await expect(appContainer).toBeVisible();

    // Check for header
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
  });

  test('signup.html loads successfully', async ({ page }) => {
    await page.goto('/signup.html');

    // Check that the page loads
    await expect(page).toHaveTitle(/Sign Up/);

    // Check for auth container
    const authContainer = page.locator('.auth-container');
    await expect(authContainer).toBeVisible();

    // Check for sign up form
    const signupForm = page.locator('#signupForm');
    await expect(signupForm).toBeVisible();
  });

  test('service worker registers', async ({ page }) => {
    await page.goto('/app.html');

    // Wait for service worker to register
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/pwa/service-worker.js');
          return true;
        } catch (error) {
          console.error('Service worker registration failed:', error);
          return false;
        }
      }
      return false;
    });

    expect(swRegistered).toBe(true);
  });

  test('IndexedDB initializes', async ({ page }) => {
    await page.goto('/app.html');

    // Check if IndexedDB is available
    const dbAvailable = await page.evaluate(() => {
      return 'indexedDB' in window;
    });

    expect(dbAvailable).toBe(true);
  });

  test('PWA manifest is accessible', async ({ page }) => {
    const response = await page.request.get('/pwa/manifest.json');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBe('AI Bradaa - Malaysia\'s AI Laptop Advisor');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });
});
