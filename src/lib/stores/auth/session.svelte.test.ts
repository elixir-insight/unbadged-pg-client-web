import { describe, it, expect } from 'vitest';
import { createSessionStore } from './session.svelte';
import { mockCognitoToken } from './mock-token';
import type { MerchantSession } from './types';

function sessionWithPermissions(
	permissions: MerchantSession['permissions'],
	groups: string[] = ['MERCHANT']
): MerchantSession {
	return {
		userId: 'user-1',
		organizationId: 'org-1',
		displayOrgId: 'ORG_1',
		merchantName: 'Acme',
		email: 'acme@example.com',
		userType: 'MEMBER',
		permissions,
		groups
	};
}

describe('createSessionStore', () => {
	it('starts in a loading state with no session', () => {
		const store = createSessionStore();
		expect(store.loading).toBe(true);
		expect(store.session).toBeNull();
	});

	it('helpers return false before initialization', () => {
		const store = createSessionStore();
		expect(store.hasPayinAccess()).toBe(false);
		expect(store.hasPayoutAccess()).toBe(false);
		expect(store.hasBothServices()).toBe(false);
		expect(store.hasService('payin')).toBe(false);
	});

	it('initializes from a mock token with temporary both-service access', () => {
		const store = createSessionStore();
		store.initialize(mockCognitoToken);
		expect(store.loading).toBe(false);
		expect(store.hasPayinAccess()).toBe(true);
		expect(store.hasPayoutAccess()).toBe(true);
		expect(store.hasBothServices()).toBe(true);
	});

	it('is idempotent — a second initialize is ignored', () => {
		const store = createSessionStore();
		store.initialize(mockCognitoToken);
		store.initialize({
			...mockCognitoToken,
			'custom:user_id': 'other-user'
		});
		expect(store.session?.userId).toBe(mockCognitoToken['custom:user_id']);
	});

	it('hydrates a server-parsed session', () => {
		const store = createSessionStore();
		const serverSession = sessionWithPermissions({ payin: true, payout: false }, ['MERCHANT']);
		store.hydrate(serverSession);
		expect(store.loading).toBe(false);
		expect(store.session).toEqual(serverSession);
		expect(store.hasPayinAccess()).toBe(true);
		expect(store.hasPayoutAccess()).toBe(false);
	});

	it('hydrates payin-only and payout-only permissions', () => {
		const payinOnly = createSessionStore();
		payinOnly.hydrate(sessionWithPermissions({ payin: true, payout: false }));
		expect(payinOnly.hasService('payin')).toBe(true);
		expect(payinOnly.hasService('payout')).toBe(false);

		const payoutOnly = createSessionStore();
		payoutOnly.hydrate(sessionWithPermissions({ payin: false, payout: true }));
		expect(payoutOnly.hasService('payin')).toBe(false);
		expect(payoutOnly.hasService('payout')).toBe(true);
	});

	it('hydrates a null session (signed out)', () => {
		const store = createSessionStore();
		store.hydrate(null);
		expect(store.loading).toBe(false);
		expect(store.session).toBeNull();
		expect(store.hasPayinAccess()).toBe(false);
	});

	it('clear() wipes a hydrated session', () => {
		const store = createSessionStore();
		store.hydrate(sessionWithPermissions({ payin: true, payout: true }, ['MERCHANT']));
		store.clear();
		expect(store.session).toBeNull();
		expect(store.loading).toBe(false);
		expect(store.hasBothServices()).toBe(false);
	});
});
