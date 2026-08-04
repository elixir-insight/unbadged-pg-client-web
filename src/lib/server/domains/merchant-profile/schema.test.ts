import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { MerchantProfileResponseSchema } from './schema';

describe('MerchantProfileResponseSchema', () => {
	it('parses the merchant profile payload', () => {
		const result = v.safeParse(MerchantProfileResponseSchema, {
			data: [
				{
					orgId: 'ORG_2bV',
					companyName: 'Elixir global',
					orgName: 'Elixir global',
					email: 'raghul.r@elixirpay.in',
					phone: '+916382303714',
					businessType: 'PRIVATE_LIMITED',
					country: 'India',
					registeredDate: '2026-07-21',
					website: 'https://www.elixirglobal.in',
					username: 'Elixir global'
				}
			],
			message: 'Organization profile fetched successfully',
			statusCode: 200
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.data[0]).toMatchObject({
				email: 'raghul.r@elixirpay.in',
				phone: '+916382303714'
			});
		}
	});
});
