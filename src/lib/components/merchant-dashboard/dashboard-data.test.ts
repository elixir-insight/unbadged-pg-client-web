import { describe, expect, it } from 'vitest';
import { formatDashboardCurrency, getDashboardSnapshot } from './dashboard-data';

describe('merchant dashboard data', () => {
	it('returns the snapshot for the selected preset', () => {
		expect(getDashboardSnapshot('today').transactionCount).toBe(2218);
		expect(getDashboardSnapshot('7d').transactionCount).toBe(13260);
		expect(getDashboardSnapshot('30d').transactionCount).toBe(82410);
	});

	it('maps custom ranges to the closest supported mock granularity', () => {
		expect(getDashboardSnapshot('custom', 1)).toBe(getDashboardSnapshot('today'));
		expect(getDashboardSnapshot('custom', 5)).toBe(getDashboardSnapshot('7d'));
		expect(getDashboardSnapshot('custom', 20)).toBe(getDashboardSnapshot('30d'));
	});

	it('keeps payment mix percentages complete', () => {
		const totalPercentage = getDashboardSnapshot('30d').paymentMix.reduce(
			(total, item) => total + item.percentage,
			0
		);

		expect(totalPercentage).toBe(100);
	});

	it('formats Indian rupee values', () => {
		expect(formatDashboardCurrency(2184)).toContain('2,184');
		expect(formatDashboardCurrency(183000000, true)).toContain('Cr');
	});
});
