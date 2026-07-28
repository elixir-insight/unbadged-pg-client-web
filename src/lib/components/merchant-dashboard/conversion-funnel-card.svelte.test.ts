import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ConversionFunnelCard from './conversion-funnel-card.svelte';
import { getDashboardSnapshot } from './dashboard-data';

describe('ConversionFunnelCard', () => {
	it('renders stages, conversion changes, and terminal outcomes', async () => {
		const dashboard = getDashboardSnapshot('7d');
		const screen = render(ConversionFunnelCard, {
			stages: dashboard.funnel,
			outcomes: dashboard.funnelOutcomes
		});

		await expect.element(screen.getByText('Conversion Funnel')).toBeVisible();
		await expect.element(screen.getByText('Created')).toBeVisible();
		await expect.element(screen.getByText('Captured')).toBeVisible();
		await expect.element(screen.getByText('Failed')).toBeVisible();
		await expect.element(screen.getByText('Expired')).toBeVisible();
		await expect.element(screen.getByText('Cancelled')).toBeVisible();
	});
});
