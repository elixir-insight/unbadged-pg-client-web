import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import OverviewTab from './overview-tab.svelte';

describe('OverviewTab', () => {
	it('renders every KPI tile with its label and value', async () => {
		const screen = render(OverviewTab);

		await expect.element(screen.getByText('Total Organizations')).toBeVisible();
		await expect.element(screen.getByText('1,930')).toBeVisible();
		await expect.element(screen.getByText('Pending Review')).toBeVisible();
		await expect.element(screen.getByText('210')).toBeVisible();
		await expect.element(screen.getByText('Action Required')).toBeVisible();
		await expect.element(screen.getByText('340')).toBeVisible();
		await expect.element(screen.getByText('New This Month')).toBeVisible();
		await expect.element(screen.getByText('128')).toBeVisible();
	});

	it('renders the pre- and post-approval status distribution cards', async () => {
		const screen = render(OverviewTab);

		await expect.element(screen.getByText('Organization Status — Pre Approval')).toBeVisible();
		await expect.element(screen.getByText('Organization Status — Post Approval')).toBeVisible();
	});

	it('renders the registration and activation trend cards', async () => {
		const screen = render(OverviewTab);

		await expect.element(screen.getByText('Organization Registration Trend')).toBeVisible();
		await expect.element(screen.getByText('Organization Activation Trend')).toBeVisible();
		expect(screen.container.querySelectorAll('svg').length).toBeGreaterThan(0);
	});
});
