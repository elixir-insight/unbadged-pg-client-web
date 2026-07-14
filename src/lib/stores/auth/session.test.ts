import { describe, it, expect } from 'vitest';
import { parseMerchantSession, parseMerchantSessionFromGateway } from './session';
import { mockCognitoToken } from './mock-token';
import type { CognitoIdToken, GatewayTokenPayload } from './types';

function tokenWithGroups(groups: string[]): CognitoIdToken {
	return { ...mockCognitoToken, 'cognito:groups': groups };
}

function gatewayToken(overrides: Partial<GatewayTokenPayload> = {}): GatewayTokenPayload {
	return {
		orgId: 42,
		userId: 7,
		userName: 'Acme Merchant',
		userEmail: 'acme@example.com',
		userType: 'merchant',
		'cognito:groups': ['Payin'],
		iss: 'ElixirPay',
		token_use: 'gateway',
		exp: 1_700_000_000,
		iat: 1_699_000_000,
		...overrides
	};
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

describe('parseMerchantSessionFromGateway', () => {
	it('maps identity fields and stringifies numeric ids', () => {
		const session = parseMerchantSessionFromGateway(gatewayToken());
		expect(session.userId).toBe('7');
		expect(session.organizationId).toBe('42');
		expect(session.merchantName).toBe('Acme Merchant');
		expect(session.email).toBe('acme@example.com');
	});

	it('derives permissions from cognito groups', () => {
		const session = parseMerchantSessionFromGateway(
			gatewayToken({ 'cognito:groups': ['Payin', 'Payout'] })
		);
		expect(session.permissions).toEqual({ payin: true, payout: true });
		expect(session.groups).toEqual(['Payin', 'Payout']);
	});
});
