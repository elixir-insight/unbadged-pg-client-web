import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TransactionVolumeChart, {
	type TransactionVolumePoint
} from './transaction-volume-chart.svelte';

const data: TransactionVolumePoint[] = [
	{ day: 'Mon', payin: 100000, payout: 50000 },
	{ day: 'Tue', payin: 150000, payout: 70000 },
	{ day: 'Wed', payin: 120000, payout: 60000 }
];

describe('TransactionVolumeChart', () => {
	it('renders the default title', async () => {
		const screen = render(TransactionVolumeChart, { data });

		await expect.element(screen.getByText('Transaction volume')).toBeVisible();
	});

	it('renders a custom title', async () => {
		const screen = render(TransactionVolumeChart, { data, title: 'Collections trend' });

		await expect.element(screen.getByText('Collections trend')).toBeVisible();
	});

	it('renders the range selector options', async () => {
		const screen = render(TransactionVolumeChart, { data });

		await expect.element(screen.getByText('Today')).toBeVisible();
		await expect.element(screen.getByText('7 Days')).toBeVisible();
		await expect.element(screen.getByText('30 Days')).toBeVisible();
	});

	it('marks "Today" as the active range by default', async () => {
		const screen = render(TransactionVolumeChart, { data });

		await expect.element(screen.getByText('Today')).toHaveClass(/bg-background/);
	});

	it('switches the active range when a different option is clicked', async () => {
		const screen = render(TransactionVolumeChart, { data });

		await screen.getByText('7 Days').click();

		await expect.element(screen.getByText('7 Days')).toHaveClass(/bg-background/);
		await expect.element(screen.getByText('Today')).not.toHaveClass(/bg-background/);
	});

	it('renders a chart svg', async () => {
		const screen = render(TransactionVolumeChart, { data });
		const svg = screen.container.querySelector('svg');

		expect(svg).not.toBeNull();
	});
});
