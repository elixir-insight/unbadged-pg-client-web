import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	ChargeConfigurationMutationResponseSchema,
	CreateChargeConfigurationsRequestSchema,
	ListChargeConfigurationsResponseSchema,
	UpdateChargeConfigurationRequestSchema
} from './schema';

describe('charge-configuration schemas', () => {
	it('parses create request payload', () => {
		const parsed = v.safeParse(CreateChargeConfigurationsRequestSchema, {
			chargeConfig: [
				{
					baseAmount: '10000',
					chargeRate: '1.80',
					chargeType: 'PERCENTAGE',
					gstExclusive: true,
					gstPercentage: '18',
					methodConfigId: 1,
					pipelineCode: 'TEST',
					vaNumber: 'TEST202610019122'
				}
			]
		});

		expect(parsed.success).toBe(true);
	});

	it('parses update request payload', () => {
		const parsed = v.safeParse(UpdateChargeConfigurationRequestSchema, {
			baseAmount: '10000',
			chargeRate: '1.80',
			chargeType: 'PERCENTAGE',
			gstExclusive: true,
			gstPercentage: '18'
		});

		expect(parsed.success).toBe(true);
	});

	it('parses upstream list response', () => {
		const parsed = v.safeParse(ListChargeConfigurationsResponseSchema, {
			data: [
				{
					baseAmount: '1000000',
					chargeRate: '1.80',
					chargeType: 'PERCENTAGE',
					createdAt: '2026-07-28T09:07:14.965313Z',
					createdBy: 100012,
					effectiveFrom: '2026-07-28T09:07:14.96373Z',
					effectiveTo: null,
					gstExclusive: true,
					gstPercentage: '18',
					id: 1,
					methodConfigId: 1,
					pipelineCode: 'TEST',
					updatedAt: null,
					updatedBy: 0,
					vaNumber: 'TEST202610019122'
				}
			],
			message: 'Charge configurations retrieved successfully',
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
	});

	it('parses mutation responses', () => {
		expect(
			v.safeParse(ChargeConfigurationMutationResponseSchema, {
				data: [],
				message: 'Successfully created charges configuration',
				statusCode: 201
			}).success
		).toBe(true);

		expect(
			v.safeParse(ChargeConfigurationMutationResponseSchema, {
				data: 'ok',
				message: 'Charge configuration updated successfully',
				statusCode: 200
			}).success
		).toBe(true);
	});
});
