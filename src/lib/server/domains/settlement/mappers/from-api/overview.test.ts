import { describe, expect, it } from 'vitest';
import { formatSettlementAmount, mapSettlementOverview } from './overview';

describe('formatSettlementAmount', () => {
	it('formats numeric strings as INR', () => {
		expect(formatSettlementAmount('486230')).toBe('₹4,86,230');
	});

	it('returns em dash for empty values', () => {
		expect(formatSettlementAmount('')).toBe('—');
		expect(formatSettlementAmount('   ')).toBe('—');
	});

	it('returns the original string when not numeric', () => {
		expect(formatSettlementAmount('n/a')).toBe('n/a');
	});
});

describe('mapSettlementOverview', () => {
	it('maps overview amounts and last settlement', () => {
		const view = mapSettlementOverview({
			totalSettledAmount: '1000000',
			awaitingSettlementAmount: '25000',
			lastSettlement: {
				amount: '75000',
				settlementId: 'STL-20260714-0001',
				settlementDatetime: '2026-07-14T10:30:00.000Z'
			}
		});

		expect(view.totalSettledAmount).toBe('₹10,00,000');
		expect(view.awaitingSettlementAmount).toBe('₹25,000');
		expect(view.lastSettlement?.amount).toBe('₹75,000');
		expect(view.lastSettlement?.settlementId).toBe('STL-20260714-0001');
		expect(view.lastSettlement?.settlementDatetime).toBeTruthy();
	});

	it('handles a null last settlement', () => {
		const view = mapSettlementOverview({
			totalSettledAmount: '0',
			awaitingSettlementAmount: '0',
			lastSettlement: null
		});

		expect(view.lastSettlement).toBeNull();
		expect(view.totalSettledAmount).toBe('₹0');
	});
});
