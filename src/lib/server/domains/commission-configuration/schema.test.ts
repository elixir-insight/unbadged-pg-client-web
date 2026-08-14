import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	CreateCommissionConfigurationsRequestSchema,
	ListCommissionConfigurationsResponseSchema
} from './schema';

describe('commission-configuration schemas', () => {
	it('parses upstream list response', () => {
		const parsed = v.safeParse(ListCommissionConfigurationsResponseSchema, {
			data: [
				{
					baseAmount: '2000',
					chargeRate: '30',
					chargeType: 'PERCENTAGE',
					createdAt: '2026-07-28T09:07:14.965313Z',
					createdBy: 100012,
					effectiveFrom: '2026-07-28T09:07:14.96373Z',
					effectiveTo: null,
					gstExclusive: false,
					gstPercentage: '18',
					id: 1,
					methodConfigId: 1,
					pipelineCode: 'TEST',
					updatedAt: null,
					updatedBy: 0,
					vaNumber: 'TEST202610019122'
				}
			],
			message: 'Commission configurations retrieved successfully',
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
	});

	it('parses create request payload', () => {
		const parsed = v.safeParse(CreateCommissionConfigurationsRequestSchema, {
			commissionConfig: [
				{
					baseAmount: '5000',
					commissionType: 'FLAT',
					feeRate: '1000',
					gstExclusive: true,
					gstPercentage: '18',
					methodConfigId: 1,
					pipelineCode: 'TEST',
					vaNumber: 'VA123'
				}
			]
		});

		expect(parsed.success).toBe(true);
	});
});
