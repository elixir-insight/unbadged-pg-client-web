import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { GetReferralMerchantsResponseSchema } from './schema';

describe('GetReferralMerchantsResponseSchema', () => {
	it('parses swagger referral merchant payload', () => {
		const parsed = v.parse(GetReferralMerchantsResponseSchema, {
			statusCode: 200,
			message: 'Referral merchants retrieved successfully',
			data: [
				{
					affiliateId: 'aff-1',
					brandName: 'BlueCart Retail',
					businessType: 'SOLE_PROPRIETORSHIP',
					companyName: 'BlueCart Retail Pvt Ltd',
					createdAt: '2026-01-12T10:00:00.000Z',
					createdBy: 'user-1',
					email: 'ops@bluecart.in',
					orgId: 'org-10021',
					phoneNumber: '+919876543210',
					profileDescription: 'Retail merchant',
					profileStatus: 'ACTIVE',
					profileType: 'MERCHANT',
					serviceTypes: ['PAYIN'],
					updatedAt: '2026-01-12T10:00:00.000Z',
					updatedBy: 'user-1'
				}
			],
			pagination: {
				limit: 8,
				page: 0,
				total: 1
			}
		});

		expect(parsed.data).toHaveLength(1);
		expect(parsed.pagination).toEqual({ limit: 8, page: 0, total: 1 });
	});
});
