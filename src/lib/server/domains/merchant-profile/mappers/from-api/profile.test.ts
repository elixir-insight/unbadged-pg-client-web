import { describe, expect, it } from 'vitest';
import { brandEmail, branding } from '$lib/branding';
import { mapMerchantProfile } from './profile';

describe('mapMerchantProfile', () => {
	it('maps API fields into the settings view model', () => {
		const email = brandEmail('raghul.r');
		const profile = mapMerchantProfile({
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
		});

		expect(profile).toMatchObject({
			orgId: 'ORG_2bV',
			displayName: branding.name,
			companyName: branding.name,
			email,
			phone: '+916382303714',
			businessType: 'Private Limited',
			country: 'India',
			registeredDate: '21/07/2026',
			website: branding.urls.website
		});
	});
});
