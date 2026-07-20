import { describe, expect, it } from 'vitest';
import { isMembersApiPortal, membersBasePath, resolveMembersApiPortal } from './portal';

describe('membersApiPortal', () => {
	it('builds the upstream base path', () => {
		expect(membersBasePath('management')).toBe('/api/v1/management');
		expect(membersBasePath('merchant')).toBe('/api/v1/merchant');
	});

	it('accepts only known portal values', () => {
		expect(isMembersApiPortal('merchant')).toBe(true);
		expect(isMembersApiPortal('management')).toBe(true);
		expect(isMembersApiPortal('partner')).toBe(false);
	});

	it('prefers an explicit portal query param', () => {
		expect(
			resolveMembersApiPortal({
				portalParam: 'merchant',
				referer: 'https://app.example/management/user-management',
				groups: ['MANAGEMENT']
			})
		).toBe('merchant');
	});

	it('falls back to the referer path', () => {
		expect(
			resolveMembersApiPortal({
				portalParam: null,
				referer: 'https://app.example/merchant/user-management',
				groups: ['MANAGEMENT', 'MERCHANT']
			})
		).toBe('merchant');
	});

	it('falls back to session groups when referer is missing', () => {
		expect(
			resolveMembersApiPortal({
				portalParam: null,
				referer: null,
				groups: ['MERCHANT']
			})
		).toBe('merchant');

		expect(
			resolveMembersApiPortal({
				portalParam: null,
				referer: null,
				groups: ['MANAGEMENT']
			})
		).toBe('management');
	});
});
