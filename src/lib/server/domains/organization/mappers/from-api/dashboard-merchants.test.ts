import { describe, expect, it } from 'vitest';
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
		email: 'merchant@example.com',
		legalCompanyName: 'Elixir global',
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
			{ orgId: 'ORG_2bV', merchantName: 'Elixir global' }
		]);
	});

	it('skips non-merchant profiles', () => {
		expect(
			mapDashboardMerchantsToOptions([
				merchant({
					displayOrgId: 'ORG_2bU',
					profileType: 'MANAGEMENT',
					legalCompanyName: 'ElixirPay'
				})
			])
		).toEqual([]);
	});
});
