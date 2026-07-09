import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ReviewSummaryCard from './ReviewSummaryCard.svelte';
import { Wallet } from '$lib/assets/icons';

describe('ReviewSummaryCard', () => {
	it('renders the title', async () => {
		const screen = render(ReviewSummaryCard, {
			title: 'Source account',
			icon: Wallet,
			rows: []
		});

		await expect.element(screen.getByText('Source account')).toBeVisible();
	});

	it('renders every row label and value', async () => {
		const rows = [
			{ label: 'Number', value: '•••• 0123' },
			{ label: 'Balance', value: '₹48,75,000' }
		];
		const screen = render(ReviewSummaryCard, {
			title: 'Source account',
			icon: Wallet,
			rows
		});

		for (const row of rows) {
			await expect.element(screen.getByText(row.label)).toBeVisible();
			await expect.element(screen.getByText(row.value)).toBeVisible();
		}
	});

	it('renders no rows when the list is empty', () => {
		const screen = render(ReviewSummaryCard, {
			title: 'Reference',
			icon: Wallet,
			rows: []
		});

		expect(screen.container.querySelectorAll('.space-y-2 > div').length).toBe(0);
	});
});
