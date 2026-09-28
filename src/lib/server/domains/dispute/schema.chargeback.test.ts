import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { GetDisputeChargebackResponseSchema } from './schema';

describe('GetDisputeChargebackResponseSchema', () => {
	it('keeps chargeback fields when data is a one-item array', () => {
		const parsed = v.safeParse(GetDisputeChargebackResponseSchema, {
			data: [
				{
					id: '10',
					disputeId: 'DSP_Frdr40yOLg',
					principalAmount: '1000',
					chargebackAmount: '100',
					additionalFees: '10',
					currency: 'INR',
					bankReference: 'BANKREF - 011',
					notes: 'Test',
					recordedBy: '',
					createdAt: '2026-09-15T18:04:41.797214+05:30',
					updatedAt: '2026-09-15T18:04:41.797214+05:30'
				}
			],
			message: 'Dispute chargeback fetched successfully',
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
		if (!parsed.success) return;

		expect(Array.isArray(parsed.output.data)).toBe(true);
		const item = Array.isArray(parsed.output.data) ? parsed.output.data[0] : parsed.output.data;
		expect(item?.id).toBe('10');
		expect(item?.disputeId).toBe('DSP_Frdr40yOLg');
		expect(item?.chargebackAmount).toBe('100');
		expect(item?.currency).toBe('INR');
	});

	it('accepts a single chargeback object in data', () => {
		const parsed = v.safeParse(GetDisputeChargebackResponseSchema, {
			data: {
				id: '10',
				disputeId: 'DSP_Frdr40yOLg',
				chargebackAmount: '100',
				currency: 'INR'
			},
			message: 'ok',
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
		if (!parsed.success) return;
		expect(Array.isArray(parsed.output.data)).toBe(false);
		if (Array.isArray(parsed.output.data)) return;
		expect(parsed.output.data?.id).toBe('10');
	});
});
