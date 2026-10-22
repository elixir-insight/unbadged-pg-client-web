import { describe, expect, it } from 'vitest';
import { branding } from '$lib/branding';
import { mapDashboardMerchantsToOptions } from './dashboard-merchants';
import type { DashboardMerchant } from '../../schema';

function merchant(overrides: Partial<DashboardMerchant> = {}): DashboardMerchant {
	return {
		affiliateId: '',
		businessType: 'PRIVATE_LIMITED',
		createdAt: '',
		createdBy: '',
		deletedAt: '',
		displayOrgId: 'ORG_2bV',
		email: branding.emails.demo,
		legalCompanyName: branding.name,
		phoneNumber: '',
		profileDescription: '',
		profileStatus: 'ACTIVE',
		profileType: 'MERCHANT',
		serviceTypes: ['PAYIN'],
		updatedAt: '',
		updatedBy: '',
		virtualAccounts: [],
		...overrides
	};
}

describe('mapDashboardMerchantsToOptions', () => {
	it('maps merchant orgs for the dropdown', () => {
		expect(mapDashboardMerchantsToOptions([merchant()])).toEqual([
			{ orgId: 'ORG_2bV', merchantName: branding.name }
		]);
	});

	it('skips non-merchant profiles', () => {
		expect(
			mapDashboardMerchantsToOptions([
				merchant({
					displayOrgId: 'ORG_2bU',
					profileType: 'MANAGEMENT',
					legalCompanyName: branding.name
				})
			])
		).toEqual([]);
	});
});
