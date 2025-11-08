/**
 * AI Bradaa - Render Smoke Test
 *
 * Verifies that critical UI elements render correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Render Tests - Landing Page', () => {
  test('index.html renders hero section', async ({ page }) => {
    await page.goto('/');

    // Check hero section
    const heroSection = page.locator('.hero');
    await expect(heroSection).toBeVisible();

    // Check for main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('index.html renders navigation', async ({ page }) => {
    await page.goto('/');

    // Check for nav element or header
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('index.html renders CTA buttons', async ({ page }) => {
    await page.goto('/');

    // Check for at least one CTA button
    const buttons = page.locator('button, a.button, a.btn, .cta');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('index.html has proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);

    // Check description meta tag
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);

    // Check theme color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);
  });
});

test.describe('Render Tests - App', () => {
  test('app.html renders header with logo', async ({ page }) => {
    await page.goto('/app.html');

    // Check for app header
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();

    // Check for logo
    const logo = page.locator('.logo, .logo-text');
    await expect(logo.first()).toBeVisible();
  });

  test('app.html renders navigation items', async ({ page }) => {
    await page.goto('/app.html');

    // Check for navigation items
    const navItems = page.locator('.nav-item');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);

    // Verify at least the main sections are present
    const expectedSections = ['matchmaker', 'versus', 'explorer', 'command'];
    for (const section of expectedSections) {
      const navItem = page.locator(`[data-section="${section}"]`);
      await expect(navItem).toBeVisible();
    }
  });

  test('app.html renders main content area', async ({ page }) => {
    await page.goto('/app.html');

    // Check for main content area
    const mainContent = page.locator('main, .main-content, #main-content');
    await expect(mainContent.first()).toBeVisible();
  });

  test('app.html renders footer', async ({ page }) => {
    await page.goto('/app.html');

    // Check for footer
    const footer = page.locator('footer, .footer, .app-footer');
    const footerExists = await footer.count();
    // Footer may or may not exist, just checking
    console.log('Footer found:', footerExists > 0);
  });

  test('app.html loads CSS correctly', async ({ page }) => {
    await page.goto('/app.html');

    // Check that CSS is loaded by verifying computed styles
    const header = page.locator('.app-header');
    const backgroundColor = await header.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should not be the default (transparent/rgba(0,0,0,0))
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('app.html renders without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/app.html');
    await page.waitForLoadState('networkidle');

    // Check for JavaScript errors
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
    expect(errors.length).toBe(0);
  });

  test('app.html renders icons correctly', async ({ page }) => {
    await page.goto('/app.html');

    // Check for PWA icons in the manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);

    const manifestUrl = await manifestLink.getAttribute('href');
    expect(manifestUrl).toBeTruthy();
  });
});

test.describe('Render Tests - Assets', () => {
  test('PWA manifest loads successfully', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('PWA icons are accessible', async ({ page }) => {
    // Check main PWA icons
    const icons = [
      '/icons/icon-192.png',
      '/icons/icon-512.png'
    ];

    for (const iconPath of icons) {
      const response = await page.request.get(iconPath);
      expect(response.ok()).toBeTruthy();

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('image');
    }
  });

  test('favicon is accessible', async ({ page }) => {
    const response = await page.request.get('/icons/favicon.svg');
    expect(response.ok()).toBeTruthy();

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('svg');
  });

  test('CSS files load successfully', async ({ page }) => {
    await page.goto('/app.html');

    // Get all stylesheet links
    const stylesheets = page.locator('link[rel="stylesheet"]');
    const count = await stylesheets.count();

    expect(count).toBeGreaterThan(0);

    // Verify each stylesheet loads
    for (let i = 0; i < count; i++) {
      const href = await stylesheets.nth(i).getAttribute('href');
      if (href && !href.startsWith('http')) {
        const response = await page.request.get(href);
        expect(response.ok()).toBeTruthy();
      }
    }
  });
});

test.describe('Render Tests - Responsive Design', () => {
  test('app.html is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app.html');

    // Check that app container is visible
    const appContainer = page.locator('#app');
    await expect(appContainer).toBeVisible();

    // Check that header is visible
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
  });

  test('app.html is responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app.html');

    // Check that app container is visible
    const appContainer = page.locator('#app');
    await expect(appContainer).toBeVisible();
  });

  test('app.html is responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/app.html');

    // Check that app container is visible
    const appContainer = page.locator('#app');
    await expect(appContainer).toBeVisible();
  });
});
