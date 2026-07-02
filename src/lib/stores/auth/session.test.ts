import { describe, it, expect } from 'vitest';
import { parseMerchantSession } from './session';
import { mockCognitoToken } from './mock-token';
import type { CognitoIdToken } from './types';

function tokenWithGroups(groups: string[]): CognitoIdToken {
	return { ...mockCognitoToken, 'cognito:groups': groups };
}

describe('parseMerchantSession', () => {
	it('derives payin-only permissions', () => {
		const session = parseMerchantSession(tokenWithGroups(['Payin']));
		expect(session.permissions).toEqual({ payin: true, payout: false });
	});

	it('derives payout-only permissions', () => {
		const session = parseMerchantSession(tokenWithGroups(['Payout']));
		expect(session.permissions).toEqual({ payin: false, payout: true });
	});

	it('derives both permissions', () => {
		const session = parseMerchantSession(tokenWithGroups(['Payin', 'Payout']));
		expect(session.permissions).toEqual({ payin: true, payout: true });
	});

	it('derives no permissions when groups are empty', () => {
		const session = parseMerchantSession(tokenWithGroups([]));
		expect(session.permissions).toEqual({ payin: false, payout: false });
	});

	it('maps identity fields from the token', () => {
		const session = parseMerchantSession(mockCognitoToken);
		expect(session.userId).toBe(mockCognitoToken['custom:user_id']);
		expect(session.organizationId).toBe(mockCognitoToken['custom:org_id']);
		expect(session.merchantName).toBe(mockCognitoToken.preferred_username);
		expect(session.email).toBe(mockCognitoToken.email);
	});

	it('passes the groups array through', () => {
		const groups = ['Payin', 'Payout'];
		const session = parseMerchantSession(tokenWithGroups(groups));
		expect(session.groups).toEqual(groups);
	});
});
