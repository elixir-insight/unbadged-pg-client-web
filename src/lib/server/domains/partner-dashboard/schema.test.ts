import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	CommissionChartResponseSchema,
	CommissionTrendResponseSchema,
	PartnerKpisResponseSchema
} from './schema';

describe('PartnerKpisResponseSchema', () => {
	it('parses the swagger KPI payload', () => {
		const raw = {
			statusCode: 200,
			message: 'Dashboard KPIs fetched successfully',
			data: [
				{
					totalCommission: { changePercent: '-100', amount: '0' },
					totalVolume: { changePercent: '-100', amount: '0' },
					successRate: '0',
					activeMerchants: 1
				}
			]
		};

		const result = v.safeParse(PartnerKpisResponseSchema, raw);
		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.output.data[0]?.totalCommission).toEqual({ amount: 0, changePercent: -100 });
		expect(result.output.data[0]?.totalVolume).toEqual({ amount: 0, changePercent: -100 });
		expect(result.output.data[0]?.successRate).toBe(0);
		expect(result.output.data[0]?.activeMerchants).toBe(1);
	});
});

describe('CommissionTrendResponseSchema', () => {
	it('parses the swagger trend payload', () => {
		const raw = {
			statusCode: 200,
			message: 'ok',
			data: [
				{ date: '2024-08-19T00:00:00+05:30', commissionAmount: '0' },
				{ date: '2024-08-24T00:00:00+05:30', commissionAmount: 0 }
			]
		};

		const result = v.safeParse(CommissionTrendResponseSchema, raw);
		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.output.data).toHaveLength(2);
		expect(result.output.data[0]?.commissionAmount).toBe(0);
		expect(result.output.data[0]?.date).toBe('2024-08-19T00:00:00+05:30');
	});
});

describe('CommissionChartResponseSchema', () => {
	it('parses the swagger chart payload', () => {
		const raw = {
			statusCode: 200,
			message: 'Commission chart fetched successfully',
			data: [{ transactionTypes: [], totalCommission: 0 }]
		};

		const result = v.safeParse(CommissionChartResponseSchema, raw);
		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.output.data[0]?.transactionTypes).toEqual([]);
		expect(result.output.data[0]?.totalCommission).toBe(0);
	});

	it('normalizes transaction type labels and amounts', () => {
		const raw = {
			statusCode: 200,
			message: 'ok',
			data: [
				{
					transactionTypes: [
						{ transactionType: 'PAYIN', commissionAmount: '420000' },
						{ type: 'PAYOUT', amount: 280000 }
					],
					totalCommission: '700000'
				}
			]
		};

		const result = v.safeParse(CommissionChartResponseSchema, raw);
		expect(result.success).toBe(true);
		if (!result.success) return;

		expect(result.output.data[0]?.transactionTypes).toEqual([
			{ label: 'PAYIN', value: 420000 },
			{ label: 'PAYOUT', value: 280000 }
		]);
		expect(result.output.data[0]?.totalCommission).toBe(700000);
	});
});
