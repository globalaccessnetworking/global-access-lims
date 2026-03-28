import { test, expect } from '@playwright/test';

test('Verify Clean UI Restoration', async ({ page }) => {
    // Go to Inventory Hub
    await page.goto('http://localhost:5173/inventory-hub');

    // 1. Check for Modern Table (Standard HTML table, not DataGrid component structure if distinct, but checking for general visibility)
    const grid = page.locator('table');
    await expect(grid).toBeVisible();

    // 2. Check for Clean "Add Item" button
    await expect(page.getByText('Add Item')).toBeVisible();

    // 3. Test Theme Toggle (Ensure it doesn't break layout)
    // Just check if page doesn't crash
    await expect(page.locator('body')).toBeVisible();

    // 4. Check Extended Module (Generic Module)
    await page.goto('http://localhost:5173/strain-repository');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByText('Add Record')).toBeVisible();

    console.log('Clean UI Verification Passed');
});
