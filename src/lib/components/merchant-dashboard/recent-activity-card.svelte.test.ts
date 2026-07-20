import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RecentActivityCard, { type RecentPayment } from './recent-activity-card.svelte';

function makePayments(count: number): RecentPayment[] {
	return Array.from({ length: count }, (_, i) => ({
		name: `Customer ${i}`,
		method: 'UPI',
		time: `${i + 1}m ago`,
		amount: `₹${(i + 1) * 100}`,
		status: (['success', 'pending', 'failed'] as const)[i % 3]
	}));
}

describe('RecentActivityCard', () => {
	it('renders the section heading', async () => {
		const screen = render(RecentActivityCard, { payments: makePayments(3) });

		await expect.element(screen.getByText('Recent transactions')).toBeVisible();
	});

	it('renders a link to the transactions page', async () => {
		const screen = render(RecentActivityCard, { payments: makePayments(1) });
		const link = screen.container.querySelector('a[href="/merchant/transactions"]');

		expect(link).not.toBeNull();
		expect(link?.textContent).toContain('View all');
	});

	it('renders payment name, method, time, amount, and initials', async () => {
		const payments: RecentPayment[] = [
			{ name: 'Jane Doe', method: 'Card', time: '2m ago', amount: '₹500', status: 'success' }
		];
		const screen = render(RecentActivityCard, { payments });

		await expect.element(screen.getByText('Jane Doe')).toBeVisible();
		await expect.element(screen.getByText('Card · 2m ago')).toBeVisible();
		await expect.element(screen.getByText('₹500')).toBeVisible();
		await expect.element(screen.getByText('JD')).toBeVisible();
	});

	it('renders the correct status label for each status', async () => {
		const payments: RecentPayment[] = [
			{ name: 'A B', method: 'UPI', time: '1m', amount: '₹1', status: 'success' },
			{ name: 'C D', method: 'UPI', time: '2m', amount: '₹2', status: 'pending' },
			{ name: 'E F', method: 'UPI', time: '3m', amount: '₹3', status: 'failed' }
		];
		const screen = render(RecentActivityCard, { payments });

		await expect.element(screen.getByText('Success')).toBeVisible();
		await expect.element(screen.getByText('Pending')).toBeVisible();
		await expect.element(screen.getByText('Failed')).toBeVisible();
	});

	it('shows at most 6 payments even when more are provided', async () => {
		const screen = render(RecentActivityCard, { payments: makePayments(10) });
		const rows = screen.container.querySelectorAll('.flex-1.flex-col.gap-2 > div');

		expect(rows.length).toBe(6);
	});

	it('renders no rows when payments is empty', async () => {
		const screen = render(RecentActivityCard, { payments: [] });
		const rows = screen.container.querySelectorAll('.flex-1.flex-col.gap-2 > div');

		expect(rows.length).toBe(0);
	});
});
