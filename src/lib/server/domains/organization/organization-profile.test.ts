import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { GetOrganizationProfileResponseSchema } from './schema';

describe('GetOrganizationProfileResponseSchema', () => {
	it('parses organization contact details', () => {
		const result = v.safeParse(GetOrganizationProfileResponseSchema, {
			data: [
				{
					orgId: 'ORG_2c7',
					companyName: 'Priority.Co',
					orgName: 'Priority.Co',
					email: 'Vidyasri.d@elixirpay.in',
					phone: '+919841656800',
					businessType: 'PRIVATE_LIMITED',
					country: 'India',
					registeredDate: '2026-07-21',
					website: 'https://example.com',
					username: 'Priority.Co'
				}
			],
			message: 'Organization profile fetched successfully',
			statusCode: 200
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.data[0]).toMatchObject({
				email: 'Vidyasri.d@elixirpay.in',
				phone: '+919841656800'
			});
		}
	});
});
