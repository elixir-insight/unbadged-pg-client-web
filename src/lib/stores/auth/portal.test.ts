import { describe, it, expect } from 'vitest';
import {
	canAccessPortalPath,
	collectPortalGroups,
	isPlatformPortal,
	normalizePortalGroups,
	resolvePortalHome
} from './portal';

describe('normalizePortalGroups', () => {
	it('keeps only MERCHANT, PARTNER, MANAGEMENT', () => {
		expect(normalizePortalGroups(['MERCHANT', 'Payin', 'MANAGEMENT', 'Payout'])).toEqual([
			'MERCHANT',
			'MANAGEMENT'
		]);
	});

	it('maps PLATFORM to PARTNER', () => {
		expect(normalizePortalGroups(['PLATFORM'])).toEqual(['PARTNER']);
	});

	it('expands ROOT to all portal groups', () => {
		expect(normalizePortalGroups(['ROOT'])).toEqual(['MERCHANT', 'PARTNER', 'MANAGEMENT']);
	});
});

describe('isPlatformPortal', () => {
	it('detects PLATFORM in session groups', () => {
		expect(isPlatformPortal(['ROOT', 'PLATFORM'])).toBe(true);
		expect(isPlatformPortal(['PARTNER'])).toBe(false);
		expect(isPlatformPortal(null)).toBe(false);
	});
});

describe('collectPortalGroups', () => {
	it('merges access groups with gateway group', () => {
		expect(collectPortalGroups(['ROOT'], 'PLATFORM')).toEqual(['ROOT', 'PLATFORM']);
	});

	it('ignores blank gateway group', () => {
		expect(collectPortalGroups(['PARTNER'], '  ')).toEqual(['PARTNER']);
	});
});

describe('resolvePortalHome', () => {
	it('prefers MANAGEMENT over PARTNER and MERCHANT', () => {
		expect(resolvePortalHome(['MERCHANT', 'PARTNER', 'MANAGEMENT'])).toBe('/management');
	});

	it('prefers PARTNER over MERCHANT', () => {
		expect(resolvePortalHome(['MERCHANT', 'PARTNER'])).toBe('/partner');
	});

	it('returns merchant home for MERCHANT-only', () => {
		expect(resolvePortalHome(['MERCHANT'])).toBe('/merchant');
	});

	it('falls back to merchant when no portal groups', () => {
		expect(resolvePortalHome([])).toBe('/merchant');
	});

	it('sends ROOT users to management', () => {
		expect(resolvePortalHome(['ROOT'])).toBe('/management');
	});

	it('sends PLATFORM users to partner even with ROOT', () => {
		expect(resolvePortalHome(['ROOT', 'PLATFORM'])).toBe('/partner');
		expect(resolvePortalHome(['PLATFORM'])).toBe('/partner');
	});
});

describe('canAccessPortalPath', () => {
	it('allows matching portal paths only', () => {
		expect(canAccessPortalPath('/merchant/funds', ['MERCHANT'])).toBe(true);
		expect(canAccessPortalPath('/management/onboarding', ['MERCHANT'])).toBe(false);
		expect(canAccessPortalPath('/partner', ['PARTNER'])).toBe(true);
		expect(canAccessPortalPath('/management', ['MANAGEMENT'])).toBe(true);
	});

	it('allows PLATFORM users on the partner portal', () => {
		expect(canAccessPortalPath('/partner', ['PLATFORM'])).toBe(true);
		expect(canAccessPortalPath('/partner/merchants', ['PLATFORM'])).toBe(true);
		expect(canAccessPortalPath('/management', ['PLATFORM'])).toBe(false);
	});

	it('allows ROOT users on all portals', () => {
		expect(canAccessPortalPath('/merchant', ['ROOT'])).toBe(true);
		expect(canAccessPortalPath('/partner', ['ROOT'])).toBe(true);
		expect(canAccessPortalPath('/management', ['ROOT'])).toBe(true);
	});

	it('allows non-portal paths', () => {
		expect(canAccessPortalPath('/api/roles', ['MERCHANT'])).toBe(true);
	});
});
