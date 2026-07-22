import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { SettlementListItemSchema } from '../../../settlement/schema';
import { mapDashboardSettlement, mapDashboardSettlements } from './settlements';

describe('mapDashboardSettlements', () => {
	it('maps a settlement list item into a dashboard settlement row', () => {
		const row = mapDashboardSettlement(
			v.parse(SettlementListItemSchema, {
				settlementId: 'STL-1',
				grossAmount: '10000',
				netSettledAmount: '9500',
				refundAmount: '200',
				status: 'SETTLED',
				settlementDatetime: '2026-07-19T10:00:00.000Z',
				bankReference: 'HDFC0001'
			})
		);

		expect(row).toEqual({
			id: 'STL-1',
			date: expect.any(String),
			grossAmount: 10000,
			netAmount: 9500,
			refunds: 200,
			status: 'settled',
			utr: 'HDFC0001'
		});
		expect(row.date).not.toBe('—');
	});

	it('maps pending and failed statuses', () => {
		const rows = mapDashboardSettlements([
			v.parse(SettlementListItemSchema, {
				settlementId: 'STL-2',
				grossAmount: '1',
				netSettledAmount: '1',
				status: 'PENDING'
			}),
			v.parse(SettlementListItemSchema, {
				settlementId: 'STL-3',
				grossAmount: '1',
				netSettledAmount: '1',
				status: 'FAILED'
			})
		]);

		expect(rows.map((row) => row.status)).toEqual(['pending', 'failed']);
		expect(rows[0]?.utr).toBeNull();
	});
});
