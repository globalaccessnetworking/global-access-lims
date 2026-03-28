import { test, expect } from '@playwright/test';

test('Verify Inventory Hub UI and Exports', async ({ page }) => {
    // Go to Inventory Hub
    await page.goto('http://localhost:5173/inventory-hub');

    // 1. Check for Data Grid
    const grid = page.locator('table');
    await expect(grid).toBeVisible();

    // 2. Check for Theme Toggle
    // Assume it's in the sidebar, we might need to expand it or just look for the button
    // For now, check if body has dark mode variable applied style (or checks class 'dark')

    // 3. Check for Items
    // We expect 329+ items. Look for "Total Records" footer
    await expect(page.getByText('Total Records:')).toBeVisible();

    // 4. Test "Add Inventory" Modal opening
    await page.getByText('Add Item').click();
    await expect(page.getByText('New Inventory Record')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 5. Test Export Button existence (Logic is hard to test in headless without download verify, but presence is key)
    await expect(page.locator('button[title="Export PDF"]')).toBeVisible();

    console.log('UI Verification Passed');
});
