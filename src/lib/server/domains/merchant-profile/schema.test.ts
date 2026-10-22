import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { brandEmail, branding } from '$lib/branding';
import { MerchantProfileResponseSchema } from './schema';

describe('MerchantProfileResponseSchema', () => {
	it('parses the merchant profile payload', () => {
		const email = brandEmail('raghul.r');
		const result = v.safeParse(MerchantProfileResponseSchema, {
			data: [
				{
					orgId: 'ORG_2bV',
					companyName: branding.name,
					orgName: branding.name,
					email,
					phone: '+916382303714',
					businessType: 'PRIVATE_LIMITED',
					country: 'India',
					registeredDate: '2026-07-21',
					website: branding.urls.website,
					username: branding.name
				}
			],
			message: 'Organization profile fetched successfully',
			statusCode: 200
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.data[0]).toMatchObject({
				email,
				phone: '+916382303714'
			});
		}
	});
});
