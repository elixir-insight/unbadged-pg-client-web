import { describe, it, expect } from 'vitest';
import { normalizeUserPermissions, portalGroupKeyFromPathname } from './normalize';

describe('normalizeUserPermissions', () => {
	it('flattens the group-scoped API shape into module → Set<action>', () => {
		const raw = [
			{
				MANAGEMENT: {
					PAYOUTS: ['read', 'write', 'approve'],
					REPORTS: ['read']
				}
			}
		];

		const result = normalizeUserPermissions(raw, 'MANAGEMENT');

		expect(result.PAYOUTS?.has('read')).toBe(true);
		expect(result.PAYOUTS?.has('write')).toBe(true);
		expect(result.PAYOUTS?.has('approve')).toBe(true);
		expect(result.PAYOUTS?.has('delete')).toBe(false);
		expect(result.REPORTS?.has('read')).toBe(true);
	});

	it('ignores groups that do not match groupKey', () => {
		const raw = [
			{
				MERCHANT: { PAYOUTS: ['read'] },
				MANAGEMENT: { PAYOUTS: ['approve'] }
			}
		];

		const result = normalizeUserPermissions(raw, 'MERCHANT');

		expect(result.PAYOUTS?.has('read')).toBe(true);
		expect(result.PAYOUTS?.has('approve')).toBe(false);
	});

	it('merges all groups when groupKey is omitted', () => {
		const raw = [
			{
				MERCHANT: { PAYOUTS: ['read'] },
				MANAGEMENT: { PAYOUTS: ['approve'] }
			}
		];

		const result = normalizeUserPermissions(raw);

		expect(result.PAYOUTS?.has('read')).toBe(true);
		expect(result.PAYOUTS?.has('approve')).toBe(true);
	});

	it('returns an empty object for null/undefined/empty input', () => {
		expect(normalizeUserPermissions(null)).toEqual({});
		expect(normalizeUserPermissions(undefined)).toEqual({});
		expect(normalizeUserPermissions([])).toEqual({});
	});
});

describe('portalGroupKeyFromPathname', () => {
	it('maps portal path prefixes to their upstream group key', () => {
		expect(portalGroupKeyFromPathname('/management')).toBe('MANAGEMENT');
		expect(portalGroupKeyFromPathname('/management/role-management')).toBe('MANAGEMENT');
		expect(portalGroupKeyFromPathname('/merchant/settings')).toBe('MERCHANT');
		expect(portalGroupKeyFromPathname('/partner')).toBe('PARTNER');
		expect(portalGroupKeyFromPathname('/login')).toBeUndefined();
		expect(portalGroupKeyFromPathname('/')).toBeUndefined();
	});
});
