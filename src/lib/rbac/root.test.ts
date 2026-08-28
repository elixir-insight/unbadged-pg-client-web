import { describe, expect, it } from 'vitest';
import { can } from './can';
import { isRootUser, rootUserPermissions } from './root';

describe('isRootUser', () => {
	it('detects ROOT userType regardless of casing', () => {
		expect(isRootUser('ROOT')).toBe(true);
		expect(isRootUser('root')).toBe(true);
		expect(isRootUser('Root')).toBe(true);
	});

	it('detects merchant-org ROOT via userType even when groups are MERCHANT-only', () => {
		expect(isRootUser('ROOT', ['MERCHANT'])).toBe(true);
	});

	it('detects ROOT on the gateway group claim', () => {
		expect(isRootUser('MEMBER', ['MERCHANT', 'ROOT'])).toBe(true);
	});

	it('returns false for non-root users', () => {
		expect(isRootUser('MEMBER', ['MANAGEMENT'])).toBe(false);
		expect(isRootUser(null, [])).toBe(false);
		expect(isRootUser(undefined)).toBe(false);
	});
});

describe('rootUserPermissions', () => {
	it('grants every action on every module', () => {
		const permissions = rootUserPermissions();

		expect(can(permissions, 'ORGANIZATION', 'approve')).toBe(true);
		expect(can(permissions, 'PAYINS', 'write-restricted')).toBe(true);
		expect(can(permissions, 'PAYOUTS', 'delete')).toBe(true);
		expect(can(permissions, 'PROFILE', 'write')).toBe(true);
		expect(can(permissions, 'REPORTS', 'read')).toBe(true);
		expect(can(permissions, 'ROLE_MANAGEMENT', 'write')).toBe(true);
		expect(can(permissions, 'USER_MANAGEMENT', 'delete')).toBe(true);
	});
});
