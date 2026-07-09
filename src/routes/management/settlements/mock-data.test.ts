import { describe, expect, it } from 'vitest';
import {
	buildSettlementId,
	getMoneySummaryForDate,
	getOrderStatsForDate,
	getSettlementDetail,
	getSettlementsForDate,
	parseSettlementId
} from './mock-data';

const DATE = '2026-07-08';

describe('buildSettlementId / parseSettlementId', () => {
	it('round-trips merchant code and date', () => {
		const id = buildSettlementId('MER01', DATE);
		expect(parseSettlementId(id)).toEqual({ merchantCode: 'MER01', date: DATE });
	});

	it('returns null for a malformed id', () => {
		expect(parseSettlementId('not-a-settlement-id')).toBeNull();
	});
});

describe('getSettlementsForDate', () => {
	it('returns exactly one settlement per merchant for the day', () => {
		const settlements = getSettlementsForDate(DATE);
		const merchantIds = settlements.map((s) => s.merchantId);
		expect(new Set(merchantIds).size).toBe(merchantIds.length);
		expect(settlements.length).toBeGreaterThan(0);
	});

	it('is deterministic for the same date', () => {
		expect(getSettlementsForDate(DATE)).toEqual(getSettlementsForDate(DATE));
	});

	it('differs across dates', () => {
		const a = getSettlementsForDate('2026-07-01');
		const b = getSettlementsForDate('2026-07-02');
		expect(a).not.toEqual(b);
	});

	it('only gives completed settlements a bank reference', () => {
		for (const s of getSettlementsForDate(DATE)) {
			if (s.status === 'completed') {
				expect(s.bankReference).not.toBeNull();
			} else {
				expect(s.bankReference).toBeNull();
			}
		}
	});
});

describe('getSettlementDetail', () => {
	it('regenerates the same amounts and status as the matching list row', () => {
		const [listItem] = getSettlementsForDate(DATE);
		const detail = getSettlementDetail(listItem.settlementId);

		expect(detail).not.toBeNull();
		expect(detail?.merchantId).toBe(listItem.merchantId);
		expect(detail?.saleAmount).toBe(listItem.saleAmount);
		expect(detail?.deductions).toBe(listItem.deductions);
		expect(detail?.netPayout).toBe(listItem.netPayout);
		expect(detail?.status).toBe(listItem.status);
	});

	it('returns null for an unknown settlement id', () => {
		expect(getSettlementDetail(buildSettlementId('NOPE', DATE))).toBeNull();
	});

	it('sums transaction net amounts to the settlement net payout', () => {
		const [listItem] = getSettlementsForDate(DATE);
		const detail = getSettlementDetail(listItem.settlementId);
		const sum = detail?.transactions.reduce((total, t) => total + t.netAmount, 0) ?? 0;
		expect(Math.round(sum * 100) / 100).toBe(detail?.netPayout);
	});

	it('renders refund and chargeback transactions with a negative net amount', () => {
		const detail = getSettlementDetail(buildSettlementId('MER01', DATE));
		for (const t of detail?.transactions ?? []) {
			if (t.type === 'refund' || t.type === 'chargeback') {
				expect(t.netAmount).toBeLessThan(0);
			} else {
				expect(t.netAmount).toBeGreaterThanOrEqual(0);
			}
		}
	});
});

describe('getOrderStatsForDate', () => {
	it('breaks down orders into statuses that sum back to the total', () => {
		const stats = getOrderStatsForDate(DATE);
		expect(stats.successful + stats.pending + stats.created + stats.failed).toBe(stats.orders);
		expect(stats.orders).toBeGreaterThan(0);
	});
});

describe('getMoneySummaryForDate', () => {
	it('aggregates sale amount and pending count consistently with the list', () => {
		const settlements = getSettlementsForDate(DATE);
		const summary = getMoneySummaryForDate(DATE);

		const expectedSale =
			Math.round(settlements.reduce((sum, s) => sum + s.saleAmount, 0) * 100) / 100;
		const expectedPending = settlements.filter((s) => s.status === 'pending').length;

		expect(summary.totalSaleAmount).toBe(expectedSale);
		expect(summary.merchantsPending).toBe(expectedPending);
	});
});
