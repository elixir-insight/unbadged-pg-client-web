import { describe, expect, it } from 'vitest';
import { mapMerchantProfile } from './profile';

describe('mapMerchantProfile', () => {
	it('maps API fields into the settings view model', () => {
		const profile = mapMerchantProfile({
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
		});

		expect(profile).toMatchObject({
			orgId: 'ORG_2bV',
			displayName: 'Elixir global',
			companyName: 'Elixir global',
			email: 'raghul.r@elixirpay.in',
			phone: '+916382303714',
			businessType: 'Private Limited',
			country: 'India',
			registeredDate: '21/07/2026',
			website: 'https://www.elixirglobal.in'
		});
	});
});
