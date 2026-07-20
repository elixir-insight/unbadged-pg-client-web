import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CollectionsTab from './collections-tab.svelte';

describe('CollectionsTab', () => {
	it('renders every KPI tile', async () => {
		const screen = render(CollectionsTab);

		await expect.element(screen.getByText('Total Collection Value')).toBeVisible();
		await expect.element(screen.getByText('Refunds')).toBeVisible();
		await expect.element(screen.getByText('Settlements', { exact: true }).first()).toBeVisible();
		await expect.element(screen.getByText('Chargeback')).toBeVisible();
		await expect.element(screen.getByText('0.65% Rate')).toBeVisible();
	});

	it('renders the volume trend chart and quick access links', async () => {
		const screen = render(CollectionsTab);

		await expect.element(screen.getByText('Volume Trend', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Quick Access', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Transactions')).toBeVisible();
		await expect.element(screen.getByText('Download report')).toBeVisible();
		await expect.element(screen.getByText('Settlements', { exact: true }).first()).toBeVisible();
	});

	it('renders the bank pipeline table and status distribution', async () => {
		const screen = render(CollectionsTab);

		await expect.element(screen.getByText('Bank pipeline breakdown')).toBeVisible();
		await expect.element(screen.getByText('HDFC Bank')).toBeVisible();
		await expect.element(screen.getByText('Status Distribution')).toBeVisible();
		await expect.element(screen.getByText('Successful')).toBeVisible();
	});
});
