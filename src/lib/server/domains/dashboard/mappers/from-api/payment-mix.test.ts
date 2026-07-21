import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { PaymentMixResponseSchema } from '../../schema';
import { mapPaymentMix } from './payment-mix';

describe('mapPaymentMix', () => {
	it('maps method volumes into chart segments with percentages', () => {
		const parsed = v.parse(PaymentMixResponseSchema, {
			data: [
				{
					paymentMethods: [
						{ method: 'UPI', volume: 580000 },
						{ method: 'CREDIT_CARD', volume: 240000 },
						{ method: 'NET_BANKING', volume: 120000 },
						{ method: 'WALLET', volume: 60000 }
					],
					totalVolume: 1000000
				}
			],
			message: 'Payment mix fetched successfully',
			statusCode: 200
		});

		expect(mapPaymentMix(parsed.data[0])).toEqual([
			{ label: 'UPI', amount: 580000, percentage: 58, color: 'var(--chart-1)' },
			{ label: 'Credit card', amount: 240000, percentage: 24, color: 'var(--chart-2)' },
			{ label: 'Netbanking', amount: 120000, percentage: 12, color: 'var(--chart-3)' },
			{ label: 'Wallet', amount: 60000, percentage: 6, color: 'var(--chart-4)' }
		]);
	});

	it('omits zero-volume methods and returns empty when total is zero', () => {
		expect(
			mapPaymentMix({
				paymentMethods: [
					{ method: 'UPI', volume: 0 },
					{ method: 'CARD', volume: 0 }
				],
				totalVolume: 0
			})
		).toEqual([]);
	});
});
