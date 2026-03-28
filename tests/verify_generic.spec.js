import { test, expect } from '@playwright/test';

test('Verify Generic Module (Strain Repository)', async ({ page }) => {
    // Go to Strain Repository (which uses GenericModule usually, or directly Extended Module path)
    await page.goto('http://localhost:5173/strain-repository');

    // 1. Check for Data Grid
    const grid = page.locator('table');
    await expect(grid).toBeVisible();

    // 2. Check for Title match
    await expect(page.getByText('Database')).toBeVisible();

    // 3. Test "Add Record" Modal
    await page.getByText('Add Record').click();
    await expect(page.getByText('Add to')).toBeVisible(); // "Add to Bacterial Strains"

    // 4. Close Modal
    await page.getByRole('button', { name: 'Cancel' }).click();

    console.log('Generic Module Verification Passed');
});
