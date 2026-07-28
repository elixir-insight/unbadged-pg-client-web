import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { ConversionFunnelResponseSchema } from '../../schema';
import { mapConversionFunnel } from './conversion-funnel';

describe('mapConversionFunnel', () => {
	it('maps stages and terminal outcomes into funnel view models', () => {
		const parsed = v.parse(ConversionFunnelResponseSchema, {
			data: [
				{
					overallConversionRate: 86.2,
					overallConversionRateChange: 1.4,
					previousOverallConversionRate: 84.8,
					stages: [
						{ id: 'CREATED', count: 15420, conversionRate: 100, dropOffRate: 0 },
						{ id: 'INITIATED', count: 14768, conversionRate: 95.8, dropOffRate: 4.2 },
						{ id: 'AUTHORIZED', count: 14031, conversionRate: 91, dropOffRate: 5 },
						{ id: 'CAPTURED', count: 13260, conversionRate: 86, dropOffRate: 5.5 }
					],
					terminalStatuses: [
						{ id: 'FAILED', count: 1892 },
						{ id: 'EXPIRED', count: 812 },
						{ id: 'CANCELLED', count: 782 },
						{ id: 'CREATED', count: 10 }
					]
				}
			],
			message: 'Conversion funnel fetched successfully',
			statusCode: 200
		});

		expect(mapConversionFunnel(parsed.data[0])).toEqual({
			stages: [
				{ label: 'Created', count: 15420, percentage: 100, change: null },
				{ label: 'Initiated', count: 14768, percentage: 95.8, change: -4.2 },
				{ label: 'Authorized', count: 14031, percentage: 91, change: -5 },
				{ label: 'Captured', count: 13260, percentage: 86, change: -5.5 }
			],
			outcomes: [
				{ label: 'Failed', count: 1892 },
				{ label: 'Expired', count: 812 },
				{ label: 'Cancelled', count: 782 }
			],
			overallConversionRate: 86.2,
			overallConversionRateChange: 1.4
		});
	});
});
