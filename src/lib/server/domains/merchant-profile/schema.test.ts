import { describe, expect, it } from 'vitest';
import { branding, brandEmail } from '$lib/branding';
import * as v from 'valibot';
import { MerchantProfileResponseSchema } from './schema';

describe('MerchantProfileResponseSchema', () => {
	it('parses the merchant profile payload', () => {
		const result = v.safeParse(MerchantProfileResponseSchema, {
			data: [
				{
					orgId: 'ORG_2bV',
					companyName: branding.name,
					orgName: branding.name,
					email: brandEmail('raghul.r'),
					phone: '+916382303714',
					businessType: 'PRIVATE_LIMITED',
					country: 'India',
					registeredDate: '2026-07-21',
					website: branding.urls.website,
					username: branding.name,
					gstNumber: '29AABCU9603R1ZM'
				}
			],
			message: 'Organization profile fetched successfully',
			statusCode: 200
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.data[0]).toMatchObject({
				email: brandEmail('raghul.r'),
				phone: '+916382303714',
				gstNumber: '29AABCU9603R1ZM'
			});
		}
	});

	it('defaults gstNumber when omitted', () => {
		const result = v.safeParse(MerchantProfileResponseSchema, {
			data: [
				{
					orgId: 'ORG_2bV',
					companyName: branding.name,
					orgName: branding.name,
					email: brandEmail('raghul.r'),
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
			expect(result.output.data[0]?.gstNumber).toBe('');
		}
	});
});
