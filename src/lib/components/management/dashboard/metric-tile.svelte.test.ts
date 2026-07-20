import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MetricTile, { type MetricTileData } from './metric-tile.svelte';
import { Wallet } from '$lib/assets/icons';

type Props = MetricTileData & { variant?: 'default' | 'glass' | 'stat'; class?: string };

function baseData(overrides: Partial<Props> = {}): Props {
	return {
		label: 'Total Collection Value',
		value: '₹ 4,82,30,120',
		subtitle: 'vs last 7 days',
		icon: Wallet,
		variant: 'stat',
		...overrides
	};
}

describe('MetricTile', () => {
	it('renders label and value', async () => {
		const screen = render(MetricTile, baseData());

		await expect.element(screen.getByText('Total Collection Value')).toBeVisible();
		await expect.element(screen.getByText('₹ 4,82,30,120')).toBeVisible();
	});

	it('renders an upward trend with subtitle', async () => {
		const screen = render(
			MetricTile,
			baseData({ trend: '+12.4%', trendDirection: 'up', subtitle: 'vs last month' })
		);

		await expect.element(screen.getByText('+12.4%')).toBeVisible();
		await expect.element(screen.getByText('vs last month')).toBeVisible();
	});

	it('renders a downward trend', async () => {
		const screen = render(MetricTile, baseData({ trend: '-4.1%', trendDirection: 'down' }));

		await expect.element(screen.getByText('-4.1%')).toBeVisible();
	});

	it('prefers the highlight over the trend when both are present', async () => {
		const screen = render(
			MetricTile,
			baseData({ highlight: '0.65% Rate', trend: '+12.4%', trendDirection: 'up' })
		);

		await expect.element(screen.getByText('0.65% Rate')).toBeVisible();
		expect(screen.container.textContent).not.toContain('+12.4%');
	});

	it('does not render an info tooltip trigger when no info is provided', async () => {
		const screen = render(MetricTile, baseData());

		expect(screen.container.querySelector('svg.lucide-info')).toBeNull();
	});

	it('renders an info tooltip trigger when info is provided', async () => {
		const screen = render(MetricTile, baseData({ info: 'Helpful context' }));

		expect(screen.container.querySelector('svg.lucide-info')).not.toBeNull();
	});

	it('renders the default (non-stat) variant without a trend/highlight branch', async () => {
		const screen = render(
			MetricTile,
			baseData({ variant: 'default', trend: '+12.4%', trendDirection: 'up' })
		);

		await expect.element(screen.getByText('Total Collection Value')).toBeVisible();
		await expect.element(screen.getByText('+12.4%')).toBeVisible();
	});
});
