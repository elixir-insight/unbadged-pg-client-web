import { describe, expect, it } from 'vitest';
import { branding, brandEmail } from '$lib/branding';
import { mapMerchantProfile } from './profile';

describe('mapMerchantProfile', () => {
	it('maps API fields into the settings view model', () => {
		const profile = mapMerchantProfile({
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
		});

		expect(profile).toMatchObject({
			orgId: 'ORG_2bV',
			displayName: branding.name,
			companyName: branding.name,
			email: brandEmail('raghul.r'),
			phone: '+916382303714',
			businessType: 'Private Limited',
			country: 'India',
			registeredDate: '21/07/2026',
			website: branding.urls.website,
			gstNumber: '29AABCU9603R1ZM'
		});
	});

	it('defaults missing gstNumber to an empty string', () => {
		const profile = mapMerchantProfile({
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
			gstNumber: ''
		});

		expect(profile.gstNumber).toBe('');
	});
});
