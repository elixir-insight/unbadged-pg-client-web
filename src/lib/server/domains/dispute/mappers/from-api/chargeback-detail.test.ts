import { describe, expect, it } from 'vitest';
import { mapChargebackDetailItem } from './chargeback-detail';

describe('mapChargebackDetailItem', () => {
	it('formats amounts, timestamps, and fallbacks for the detail table', () => {
		const row = mapChargebackDetailItem({
			id: 'CB_1',
			disputeId: 'DSP_1',
			additionalFees: '25',
			bankReference: 'UTR123',
			chargebackAmount: '1500',
			createdAt: '2026-01-15T10:30:00.000Z',
			currency: 'INR',
			notes: 'Bank initiated',
			principalAmount: '1400',
			recordedBy: 'ops-user',
			updatedAt: ''
		});

		expect(row.id).toBe('CB_1');
		expect(row.disputeId).toBe('DSP_1');
		expect(row.additionalFees).toBe('25 INR');
		expect(row.chargebackAmount).toBe('1,500 INR');
		expect(row.principalAmount).toBe('1,400 INR');
		expect(row.bankReference).toBe('UTR123');
		expect(row.recordedBy).toBe('ops-user');
		expect(row.notes).toBe('Bank initiated');
		expect(row.updatedAt).toBe('—');
		expect(row.createdAt).not.toBe('—');
	});
});
