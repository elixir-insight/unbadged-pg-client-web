import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { ListPaymentMethodConfigurationsResponseSchema } from './schema';

describe('ListPaymentMethodConfigurationsResponseSchema', () => {
	it('parses upstream payment method configuration list', () => {
		const parsed = v.safeParse(ListPaymentMethodConfigurationsResponseSchema, {
			data: [
				{
					createdAt: '2026-07-28T09:07:14.965313Z',
					updatedAt: null,
					effectiveFrom: '2026-07-28T09:07:14.96373Z',
					effectiveTo: null,
					pipelineCode: 'TEST',
					serviceType: 'PAYIN',
					instrument: 'CREDIT_CARD',
					paymentRail: 'VISA',
					description: 'test',
					id: 1,
					createdBy: 100012,
					updatedBy: 0
				}
			],
			message: 'Payment method configurations retrieved successfully',
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
	});
});
