import { expect, test } from '@playwright/test';
import { authenticateManagementSession } from '../e2e/mock-session';

test.describe('Management dashboard tabs', () => {
	test.beforeEach(async ({ context, baseURL }) => {
		if (!baseURL) throw new Error('Playwright baseURL is required for authenticated e2e tests');
		await authenticateManagementSession(context, baseURL);
	});

	test('shows the overview tab by default', async ({ page }) => {
		await page.goto('/management');

		await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(page.getByText('Total Organizations')).toBeVisible();
	});

	test('switches to the collections tab, navigating to /management/collections', async ({
		page
	}) => {
		await page.goto('/management');

		await page.getByRole('tab', { name: 'Collections' }).click();

		await expect(page).toHaveURL(/\/management\/collections\/?$/);
		await expect(page.getByRole('tab', { name: 'Collections' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(page.getByText('Total Collection Value')).toBeVisible();
	});

	// Disbursements tab temporarily hidden
	// test('switches to the disbursements tab, navigating to /management/disbursements', async ({
	// 	page
	// }) => {
	// 	await page.goto('/management');
	//
	// 	await page.getByRole('tab', { name: 'Disbursements' }).click();
	//
	// 	await expect(page).toHaveURL(/\/management\/disbursements\/?$/);
	// 	await expect(page.getByRole('tab', { name: 'Disbursements' })).toHaveAttribute(
	// 		'aria-selected',
	// 		'true'
	// 	);
	// 	await expect(page.getByText('Disbursement Dashboard Coming soon.')).toBeVisible();
	// });

	test('does not show a breadcrumb on any dashboard tab route', async ({ page }) => {
		await page.goto('/management');
		await expect(page.locator('nav[aria-label="breadcrumb"]')).toHaveCount(0);

		await page.goto('/management/collections');
		await expect(page.locator('nav[aria-label="breadcrumb"]')).toHaveCount(0);

		// await page.goto('/management/disbursements');
		// await expect(page.locator('nav[aria-label="breadcrumb"]')).toHaveCount(0);
	});
});
