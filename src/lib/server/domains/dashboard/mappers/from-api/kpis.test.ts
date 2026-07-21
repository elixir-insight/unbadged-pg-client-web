import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { DashboardKpisResponseSchema } from '../../schema';
import { emptyDashboardKpis, mapDashboardKpis } from './kpis';

describe('mapDashboardKpis', () => {
	it('formats KPI amounts and change percents for the cards', () => {
		const view = mapDashboardKpis({
			totalCollections: { amount: 4830000, changePercent: 12.4 },
			avgTransactionValue: { amount: 2184, changePercent: -3.1 },
			successRate: 96.42,
			totalSettled: 44800000,
			awaitingSettlement: 342180
		});

		expect(view.totalCollections.amount).toContain('48.3');
		expect(view.totalCollections.changePercent).toBe(12.4);
		expect(view.avgTransactionValue.amount).toContain('2,184');
		expect(view.avgTransactionValue.changePercent).toBe(-3.1);
		expect(view.successRate).toBe('96.4%');
		expect(view.totalSettled).toContain('4.5');
		expect(view.awaitingSettlement).toContain('3,42,180');
	});

	it('parses the live upstream string/array response shape', () => {
		const parsed = v.parse(DashboardKpisResponseSchema, {
			data: [
				{
					totalCollections: {
						changePercent: '-40.26226946467409',
						amount: '102452'
					},
					avgTransactionValue: {
						changePercent: '-31.72830795962753',
						amount: '2927.2'
					},
					successRate: '81.3953488372093',
					awaitingSettlement: '85908',
					totalSettled: '84913.69'
				}
			],
			message: 'Dashboard KPIs fetched successfully',
			statusCode: 200
		});

		const view = mapDashboardKpis(parsed.data[0]);
		expect(view.totalCollections.amount).toContain('1');
		expect(view.totalCollections.changePercent).toBe(-40.3);
		expect(view.avgTransactionValue.changePercent).toBe(-31.7);
		expect(view.successRate).toBe('81.4%');
		expect(view.awaitingSettlement).toContain('85,908');
	});

	it('returns placeholder empty values', () => {
		expect(emptyDashboardKpis().totalCollections.amount).toBe('—');
		expect(emptyDashboardKpis().successRate).toBe('—');
	});
});
