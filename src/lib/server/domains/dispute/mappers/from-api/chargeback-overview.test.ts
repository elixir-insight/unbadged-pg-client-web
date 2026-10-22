import { describe, expect, it } from 'vitest';
import { formatChargebackRatio, mapChargebackOverviewItem } from './chargeback-overview';

describe('formatChargebackRatio', () => {
	it('appends a percent sign to numeric strings', () => {
		expect(formatChargebackRatio('0.65')).toBe('0.65%');
		expect(formatChargebackRatio('1.5')).toBe('1.50%');
	});

	it('keeps values that already include a percent sign', () => {
		expect(formatChargebackRatio('6.48%')).toBe('6.48%');
	});

	it('returns an em dash for empty values', () => {
		expect(formatChargebackRatio('')).toBe('—');
		expect(formatChargebackRatio('   ')).toBe('—');
	});
});

describe('mapChargebackOverviewItem', () => {
	it('formats amounts and ratio for the table', () => {
		const row = mapChargebackOverviewItem({
			orgId: 'ORG_2bV',
			overallAmount: '4823012',
			principalAmount: '312450',
			chargebackRatio: '0.65'
		});

		expect(row.orgId).toBe('ORG_2bV');
		expect(row.overallAmount).toBe('48,23,012 INR');
		expect(row.principalAmount).toBe('3,12,450 INR');
		expect(row.chargebackRatio).toBe('0.65%');
	});
});
