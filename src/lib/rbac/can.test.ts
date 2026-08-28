import { describe, it, expect } from 'vitest';
import { can, canAny, canAll, canAccessModule } from './can';
import type { RbacPermissions } from './types';

const permissions: RbacPermissions = {
	PAYOUTS: new Set(['read', 'write']),
	REPORTS: new Set(['read'])
};

describe('can', () => {
	it('returns true when the action is granted', () => {
		expect(can(permissions, 'PAYOUTS', 'read')).toBe(true);
	});

	it('returns false when the action is not granted', () => {
		expect(can(permissions, 'PAYOUTS', 'delete')).toBe(false);
	});

	it('returns false for a module with no grants at all', () => {
		expect(can(permissions, 'ORGANIZATION', 'read')).toBe(false);
	});

	it('fails closed on null/undefined permissions', () => {
		expect(can(null, 'PAYOUTS', 'read')).toBe(false);
		expect(can(undefined, 'PAYOUTS', 'read')).toBe(false);
	});
});

describe('canAny', () => {
	it('returns true if at least one action is granted', () => {
		expect(canAny(permissions, 'PAYOUTS', ['delete', 'write'])).toBe(true);
	});

	it('returns false if none are granted', () => {
		expect(canAny(permissions, 'PAYOUTS', ['delete', 'approve'])).toBe(false);
	});
});

describe('canAll', () => {
	it('returns true only when every action is granted', () => {
		expect(canAll(permissions, 'PAYOUTS', ['read', 'write'])).toBe(true);
		expect(canAll(permissions, 'PAYOUTS', ['read', 'delete'])).toBe(false);
	});
});

describe('canAccessModule', () => {
	it('returns true when the module has any grants', () => {
		expect(canAccessModule(permissions, 'PAYOUTS')).toBe(true);
	});

	it('returns false when the module is absent', () => {
		expect(canAccessModule(permissions, 'ORGANIZATION')).toBe(false);
	});
});
