import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { getDashboardSnapshot } from './dashboard-data';
import RecentTransactionsTable from './recent-transactions-table.svelte';

describe('RecentTransactionsTable', () => {
	it('renders recent transactions and collection statuses', async () => {
		const screen = render(RecentTransactionsTable, {
			transactions: getDashboardSnapshot('30d').transactions
		});

		await expect.element(screen.getByText('Recent transactions')).toBeVisible();
		await expect.element(screen.getByText('ORD_28910')).toBeVisible();
		await expect.element(screen.getByText('Captured').first()).toBeVisible();
		await expect.element(screen.getByText('Pending')).toBeVisible();
		await expect.element(screen.getByText('Failed')).toBeVisible();
		expect(screen.container.querySelectorAll('tbody tr')).toHaveLength(6);
	});

	it('renders an empty state', async () => {
		const screen = render(RecentTransactionsTable, { transactions: [] });

		await expect.element(screen.getByText('No recent transactions.')).toBeVisible();
	});
});
