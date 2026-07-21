import { describe, it, expect } from 'vitest';
import { parseMerchantSession, parseMerchantSessionFromGateway } from './session';
import { mockCognitoToken } from './mock-token';
import type { CognitoIdToken, GatewayTokenPayload } from './types';

function tokenWithGroups(groups: string[]): CognitoIdToken {
	return { ...mockCognitoToken, 'cognito:groups': groups };
}

function gatewayToken(overrides: Partial<GatewayTokenPayload> = {}): GatewayTokenPayload {
	return {
		orgId: 10002,
		userId: 100002,
		userName: 'Elixir Pay',
		userEmail: 'admin@elixirpay.com',
		userType: 'ROOT',
		group: 'MERCHANT',
		serviceTypes: ['PAYIN'],
		iss: 'Elixir Pay',
		token_use: 'gateway',
		exp: 1_784_059_619,
		iat: 1_784_056_019,
		sub: '100002',
		...overrides
	};
}

describe('parseMerchantSession', () => {
	it('does not derive payin/payout from groups (temporary both true)', () => {
		const session = parseMerchantSession(tokenWithGroups(['MERCHANT']));
		expect(session.permissions).toEqual({ payin: true, payout: true });
	});

	it('maps identity fields from the token', () => {
		const session = parseMerchantSession(mockCognitoToken);
		expect(session.userId).toBe(mockCognitoToken['custom:user_id']);
		expect(session.organizationId).toBe(mockCognitoToken['custom:org_id']);
		expect(session.merchantName).toBe(mockCognitoToken.preferred_username);
		expect(session.email).toBe(mockCognitoToken.email);
	});

	it('passes the portal groups array through', () => {
		const groups = ['MERCHANT', 'PARTNER'];
		const session = parseMerchantSession(tokenWithGroups(groups));
		expect(session.groups).toEqual(groups);
	});
});

describe('parseMerchantSessionFromGateway', () => {
	it('maps identity fields and stringifies numeric ids', () => {
		const session = parseMerchantSessionFromGateway(gatewayToken(), ['MANAGEMENT']);
		expect(session.userId).toBe('100002');
		expect(session.organizationId).toBe('10002');
		expect(session.merchantName).toBe('Elixir Pay');
		expect(session.email).toBe('admin@elixirpay.com');
		expect(session.userType).toBe('ROOT');
	});

	it('uses portal groups from the access token only', () => {
		const session = parseMerchantSessionFromGateway(gatewayToken(), ['MANAGEMENT']);
		expect(session.groups).toEqual(['MANAGEMENT']);
	});

	it('derives merchant service access from the gateway token', () => {
		const payinSession = parseMerchantSessionFromGateway(gatewayToken(), ['MERCHANT']);
		expect(payinSession.permissions).toEqual({ payin: true, payout: false });

		const payoutSession = parseMerchantSessionFromGateway(
			gatewayToken({ serviceTypes: ['PAYOUT'] }),
			['MERCHANT']
		);
		expect(payoutSession.permissions).toEqual({ payin: false, payout: true });

		const bothServicesSession = parseMerchantSessionFromGateway(
			gatewayToken({ serviceTypes: ['PAYIN', 'PAYOUT'] }),
			['MERCHANT']
		);
		expect(bothServicesSession.permissions).toEqual({ payin: true, payout: true });
	});

	it('denies merchant service access when serviceTypes is absent', () => {
		const session = parseMerchantSessionFromGateway(gatewayToken({ serviceTypes: undefined }), [
			'MERCHANT'
		]);
		expect(session.permissions).toEqual({ payin: false, payout: false });
	});

	it('falls back to email local-part when userName is null', () => {
		const session = parseMerchantSessionFromGateway(
			gatewayToken({ userName: null, userEmail: 'Abdullah.a@elixirpay.in' }),
			['MERCHANT']
		);
		expect(session.merchantName).toBe('Abdullah.a');
		expect(session.email).toBe('Abdullah.a@elixirpay.in');
	});

	it('falls back to User when userName and email are blank', () => {
		const session = parseMerchantSessionFromGateway(
			gatewayToken({ userName: null, userEmail: '' }),
			['MERCHANT']
		);
		expect(session.merchantName).toBe('User');
	});
});
