import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RefundInsightsCard from './refund-insights-card.svelte';

describe('RefundInsightsCard', () => {
	it('renders the section heading', async () => {
		const screen = render(RefundInsightsCard, { completed: 10, initiated: 3, failed: 2 });

		await expect.element(screen.getByText('Refund insights')).toBeVisible();
	});

	it('renders the total refund count', async () => {
		const screen = render(RefundInsightsCard, { completed: 10, initiated: 3, failed: 2 });

		await expect.element(screen.getByText('15 refunds')).toBeVisible();
	});

	it('renders each segment label, value, and percentage', async () => {
		const screen = render(RefundInsightsCard, { completed: 10, initiated: 5, failed: 5 });

		await expect.element(screen.getByText('Completed')).toBeVisible();
		await expect.element(screen.getByText('Initiated')).toBeVisible();
		await expect.element(screen.getByText('Failed')).toBeVisible();

		await expect.element(screen.getByText('(50%)')).toBeVisible();
		const twentyFivePercent = screen.container.textContent?.match(/\(25%\)/g);
		expect(twentyFivePercent?.length).toBe(2);
	});

	it('renders zero-value segments without dividing by zero', async () => {
		const screen = render(RefundInsightsCard, { completed: 0, initiated: 0, failed: 0 });

		await expect.element(screen.getByText('1 refunds')).toBeVisible();
		const zeroPercent = screen.container.textContent?.match(/\(0%\)/g);
		expect(zeroPercent?.length).toBe(3);
	});
});
