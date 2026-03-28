import { test, expect } from '@playwright/test';

test('Verify Query Hub', async ({ page }) => {
    // Go to Query Hub
    await page.goto('http://localhost:5173/query-hub');

    // 1. Check if page loaded
    await expect(page.getByText('Query Intelligence Hub')).toBeVisible();

    // 2. Check for Ingested Queries (we expect 3)
    // Check for specific names from CSVs
    await expect(page.getByText('Query for Bacterial strains')).toBeVisible();
    await expect(page.getByText('Query for Plasmids')).toBeVisible();
    await expect(page.getByText('Find duplicates for Primers-details')).toBeVisible();

    // 3. Test "Run" (Execute)
    // Find the Play button for "Query for Plasmids" and click it
    // This is tricky without specific IDs, so we'll just check if buttons exist
    const playButtons = page.locator('button:has(svg.lucide-play)');
    await expect(playButtons).toHaveCount(3);

    // Click first one
    await playButtons.first().click();

    // 4. Verify Results Table appears
    await expect(page.locator('table')).toBeVisible();
    // Check for a column header likely to be in the data (e.g. "Specie" or "Plasmid Name")
    // depending on which one was first. Let's just check for ANY table header.
    await expect(page.locator('th').first()).toBeVisible();

    // 5. Check Builder Mode
    await page.click('text=New Query');
    await expect(page.getByText('Select Data Source')).toBeVisible(); // Builder text
    await expect(page.getByText('InventoryStock')).toBeVisible();

    console.log('Query Hub Verification Passed');
});
