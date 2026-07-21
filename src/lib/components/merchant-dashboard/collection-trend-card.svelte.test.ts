import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CollectionTrendCard from './collection-trend-card.svelte';

const data = [
	{ label: '07-14', gross: 180000, net: 174960, transactionCount: 40 },
	{ label: '07-16', gross: 220000, net: 213840, transactionCount: 52 },
	{ label: '07-18', gross: 205000, net: 199260, transactionCount: 48 },
	{ label: '07-20', gross: 240000, net: 233280, transactionCount: 61 }
];

describe('CollectionTrendCard', () => {
	it('renders the chart labels and emits granularity changes', async () => {
		const onGranularityChange = vi.fn();
		const screen = render(CollectionTrendCard, {
			data,
			granularity: 'daily',
			onGranularityChange
		});
		const weekly = screen.getByRole('button', { name: 'Weekly' });

		await expect.element(screen.getByText('Collections Trend')).toBeVisible();
		await expect.element(screen.getByText('Gross vs Net (after fees)')).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: 'Daily' }))
			.toHaveAttribute('aria-pressed', 'true');

		await weekly.click();
		expect(onGranularityChange).toHaveBeenCalledWith('weekly');
	});
});
