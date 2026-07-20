import { describe, it, expect } from 'vitest';
import { canAccessPortalPath, normalizePortalGroups, resolvePortalHome } from './portal';

describe('normalizePortalGroups', () => {
	it('keeps only MERCHANT, PARTNER, MANAGEMENT', () => {
		expect(normalizePortalGroups(['MERCHANT', 'Payin', 'MANAGEMENT', 'Payout'])).toEqual([
			'MERCHANT',
			'MANAGEMENT'
		]);
	});

	it('expands ROOT to all portal groups', () => {
		expect(normalizePortalGroups(['ROOT'])).toEqual(['MERCHANT', 'PARTNER', 'MANAGEMENT']);
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
});

describe('canAccessPortalPath', () => {
	it('allows matching portal paths only', () => {
		expect(canAccessPortalPath('/merchant/funds', ['MERCHANT'])).toBe(true);
		expect(canAccessPortalPath('/management/onboarding', ['MERCHANT'])).toBe(false);
		expect(canAccessPortalPath('/partner', ['PARTNER'])).toBe(true);
		expect(canAccessPortalPath('/management', ['MANAGEMENT'])).toBe(true);
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
