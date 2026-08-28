import { describe, expect, it } from 'vitest';
import {
	buildReferralsStatusCounts,
	filterReferralsByEmail,
	filterReferralsByName,
	mapProfileStatusToReferralStatus,
	mapReferralMerchant,
	mapReferralMerchantsResponse,
	mapUiStatusToApiStatuses
} from './referral-merchants';

describe('mapProfileStatusToReferralStatus', () => {
	it('maps upstream profile statuses onto referral UI statuses', () => {
		expect(mapProfileStatusToReferralStatus('ACTIVE')).toBe('active');
		expect(mapProfileStatusToReferralStatus('APPROVED')).toBe('active');
		expect(mapProfileStatusToReferralStatus('IN_PROGRESS')).toBe('pending');
		expect(mapProfileStatusToReferralStatus('ON_HOLD')).toBe('inactive');
		expect(mapProfileStatusToReferralStatus('FROZEN')).toBe('inactive');
		expect(mapProfileStatusToReferralStatus('REJECTED')).toBe('rejected');
	});
});

describe('mapUiStatusToApiStatuses', () => {
	it('maps UI filter values to API statuses query param', () => {
		expect(mapUiStatusToApiStatuses('active')).toBe('ACTIVE,APPROVED');
		expect(mapUiStatusToApiStatuses('pending')).toBe('IN_PROGRESS');
		expect(mapUiStatusToApiStatuses('inactive')).toBe('ON_HOLD,FROZEN');
		expect(mapUiStatusToApiStatuses('rejected')).toBe('REJECTED');
	});
});

describe('mapReferralMerchant', () => {
	it('maps API merchant fields onto referral table rows', () => {
		expect(
			mapReferralMerchant({
				affiliateId: 'aff-1',
				brandName: 'BlueCart Retail',
				companyName: 'BlueCart Retail Pvt Ltd',
				createdAt: '2026-01-12T10:00:00.000Z',
				email: 'ops@bluecart.in',
				orgId: 'org-10021',
				businessType: 'SOLE_PROPRIETORSHIP',
				profileStatus: 'ACTIVE'
			})
		).toEqual({
			id: 'aff-1',
			name: 'BlueCart Retail',
			brandName: 'BlueCart Retail',
			companyName: 'BlueCart Retail Pvt Ltd',
			merchantId: 'org-10021',
			email: 'ops@bluecart.in',
			status: 'active',
			businessType: 'SOLE_PROPRIETORSHIP',
			referredOn: '2026-01-12T10:00:00.000Z',
			volume: 0,
			commissionEarned: 0
		});
	});
});

describe('mapReferralMerchantsResponse', () => {
	it('normalizes 0-based API pagination to 1-based UI pagination', () => {
		const mapped = mapReferralMerchantsResponse(
			{
				data: [
					{
						orgId: 'org-1',
						createdAt: '2026-01-12T10:00:00.000Z',
						profileStatus: 'IN_PROGRESS',
						companyName: 'Pending Merchant'
					}
				],
				pagination: { limit: 8, page: 0, total: 12 }
			},
			8,
			0
		);

		expect(mapped.merchants).toHaveLength(1);
		expect(mapped.pagination).toEqual({ limit: 8, page: 1, total: 12 });
	});
});

describe('buildReferralsStatusCounts', () => {
	it('counts referral statuses from mapped merchants', () => {
		expect(
			buildReferralsStatusCounts([
				{
					id: '1',
					name: 'A',
					brandName: 'A',
					companyName: 'A Pvt Ltd',
					merchantId: 'org-1',
					email: 'a@example.com',
					status: 'active',
					businessType: 'PARTNERSHIP',
					referredOn: '2026-01-01',
					volume: 0,
					commissionEarned: 0
				},
				{
					id: '2',
					name: 'B',
					brandName: 'B',
					companyName: 'B Pvt Ltd',
					merchantId: 'org-2',
					email: 'b@example.com',
					status: 'pending',
					businessType: 'PRIVATE_LIMITED',
					referredOn: '2026-01-02',
					volume: 0,
					commissionEarned: 0
				}
			])
		).toEqual({
			all: 2,
			active: 1,
			pending: 1,
			inactive: 0,
			rejected: 0
		});
	});
});

describe('filterReferralsByEmail', () => {
	it('filters referral merchants by email on the client when API has no email query', () => {
		const merchants = [
			{
				id: '1',
				name: 'A',
				brandName: 'A',
				companyName: 'A Pvt Ltd',
				merchantId: 'org-1',
				email: 'ops@bluecart.in',
				status: 'active' as const,
				businessType: 'SOLE_PROPRIETORSHIP',
				referredOn: '2026-01-01',
				volume: 0,
				commissionEarned: 0
			},
			{
				id: '2',
				name: 'B',
				brandName: 'B',
				companyName: 'B Pvt Ltd',
				merchantId: 'org-2',
				email: 'finance@novahealth.io',
				status: 'pending' as const,
				businessType: 'PARTNERSHIP',
				referredOn: '2026-01-02',
				volume: 0,
				commissionEarned: 0
			}
		];

		expect(filterReferralsByEmail(merchants, 'novahealth')).toHaveLength(1);
	});
});

describe('filterReferralsByName', () => {
	it('matches brand name, company name, and merchant id', () => {
		const merchants = [
			{
				id: '1',
				name: 'BlueCart Retail',
				brandName: 'BlueCart Retail',
				companyName: 'BlueCart Retail Pvt Ltd',
				merchantId: 'org-10021',
				email: 'ops@bluecart.in',
				status: 'active' as const,
				businessType: 'SOLE_PROPRIETORSHIP',
				referredOn: '2026-01-01',
				volume: 0,
				commissionEarned: 0
			},
			{
				id: '2',
				name: 'Nova Health',
				brandName: 'Nova Health',
				companyName: 'Nova Health Labs LLP',
				merchantId: 'org-10034',
				email: 'finance@novahealth.io',
				status: 'pending' as const,
				businessType: 'LIMITED_LIABILITY_PARTNERSHIP',
				referredOn: '2026-01-02',
				volume: 0,
				commissionEarned: 0
			}
		];

		expect(filterReferralsByName(merchants, 'bluecart')).toHaveLength(1);
		expect(filterReferralsByName(merchants, 'Pvt Ltd')).toHaveLength(1);
		expect(filterReferralsByName(merchants, 'org-10034')).toHaveLength(1);
	});
});
