import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TrendAreaCard, { type TrendPoint } from './trend-area-card.svelte';

const data: TrendPoint[] = [
	{ label: '08-07', value: 18 },
	{ label: '09-07', value: 20 },
	{ label: '10-07', value: 22 }
];

describe('TrendAreaCard', () => {
	it('renders the title and description', async () => {
		const screen = render(TrendAreaCard, {
			title: 'Organization Registration Trend',
			description: 'Last 30 days',
			data
		});

		await expect.element(screen.getByText('Organization Registration Trend')).toBeVisible();
		await expect.element(screen.getByText('Last 30 days')).toBeVisible();
	});

	it('renders a chart svg', async () => {
		const screen = render(TrendAreaCard, { title: 'Trend', description: 'desc', data });

		await expect.element(screen.getByText('Trend')).toBeVisible();
		expect(screen.container.querySelector('svg')).not.toBeNull();
	});

	it('renders a filled area path by default', async () => {
		const screen = render(TrendAreaCard, { title: 'Trend', description: 'desc', data });

		await expect.element(screen.getByText('Trend')).toBeVisible();
		expect(screen.container.querySelector('.lc-area-path')).not.toBeNull();
	});

	it('renders a line (no fill) when filled is false', async () => {
		const screen = render(TrendAreaCard, {
			title: 'Trend',
			description: 'desc',
			data,
			filled: false
		});

		await expect.element(screen.getByText('Trend')).toBeVisible();
		expect(screen.container.querySelector('.lc-area-path')).toBeNull();
		expect(screen.container.querySelector('.lc-line')).not.toBeNull();
	});
});
