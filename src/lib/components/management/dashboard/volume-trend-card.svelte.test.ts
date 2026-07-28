import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import VolumeTrendCard, { type VolumePoint } from './volume-trend-card.svelte';

const data: VolumePoint[] = [
	{ label: '08-07', value: 4200000 },
	{ label: '09-07', value: 3800000 },
	{ label: '10-07', value: 6200000 }
];

describe('VolumeTrendCard', () => {
	it('renders the title and description', async () => {
		const screen = render(VolumeTrendCard, {
			title: 'Volume Trend',
			description: 'Daily collection volume',
			data
		});

		await expect.element(screen.getByText('Volume Trend', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Daily collection volume')).toBeVisible();
	});

	it('renders the legend with the value label and a Trend entry', async () => {
		const screen = render(VolumeTrendCard, {
			title: 'Volume Trend',
			description: 'desc',
			data,
			valueLabel: 'Collection Volume'
		});

		expect(screen.container.textContent).toContain('Collection Volume');
		expect(screen.container.textContent).toContain('Trend');
	});

	it('renders bar and line marks', async () => {
		const screen = render(VolumeTrendCard, { title: 'Volume Trend', description: 'desc', data });

		await expect.element(screen.getByText('Volume Trend', { exact: true })).toBeVisible();
		expect(screen.container.querySelectorAll('.lc-bars-g rect, rect').length).toBeGreaterThan(0);
		expect(screen.container.querySelector('.lc-line')).not.toBeNull();
	});
});
