import { expect, test } from '@playwright/test';

test.describe('Management dashboard tabs', () => {
	test('shows the overview tab by default', async ({ page }) => {
		await page.goto('/management');

		await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(page.getByText('Total Organizations')).toBeVisible();
	});

	test('switches to the collections tab without navigating away from /management', async ({
		page
	}) => {
		await page.goto('/management');

		await page.getByRole('tab', { name: 'Collections' }).click();

		await expect(page.getByRole('tab', { name: 'Collections' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(page.getByText('Total Collection Value')).toBeVisible();
		await expect(page).toHaveURL(/\/management\/?$/);
	});

	test('switches to the disbursements tab', async ({ page }) => {
		await page.goto('/management');

		await page.getByRole('tab', { name: 'Disbursements' }).click();

		await expect(page.getByRole('tab', { name: 'Disbursements' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(page.getByText('Disbursement Dashboard Coming soon.')).toBeVisible();
	});
});
