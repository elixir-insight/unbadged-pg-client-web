import { describe, it, expect } from 'vitest';
import { createSessionStore } from './session.svelte';
import { mockCognitoToken } from './mock-token';
import type { CognitoIdToken } from './types';

function tokenWithGroups(groups: string[]): CognitoIdToken {
	return { ...mockCognitoToken, 'cognito:groups': groups };
}

const payinToken = tokenWithGroups(['Payin']);
const payoutToken = tokenWithGroups(['Payout']);
const bothToken = tokenWithGroups(['Payin', 'Payout']);

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

	it('initializes a payin-only session', () => {
		const store = createSessionStore();
		store.initialize(payinToken);
		expect(store.loading).toBe(false);
		expect(store.hasPayinAccess()).toBe(true);
		expect(store.hasPayoutAccess()).toBe(false);
		expect(store.hasBothServices()).toBe(false);
		expect(store.hasService('payin')).toBe(true);
		expect(store.hasService('payout')).toBe(false);
	});

	it('initializes a payout-only session', () => {
		const store = createSessionStore();
		store.initialize(payoutToken);
		expect(store.hasPayinAccess()).toBe(false);
		expect(store.hasPayoutAccess()).toBe(true);
		expect(store.hasBothServices()).toBe(false);
		expect(store.hasService('payout')).toBe(true);
	});

	it('initializes a session with both services', () => {
		const store = createSessionStore();
		store.initialize(bothToken);
		expect(store.hasBothServices()).toBe(true);
		expect(store.hasService('payin')).toBe(true);
		expect(store.hasService('payout')).toBe(true);
	});

	it('is idempotent — a second initialize is ignored', () => {
		const store = createSessionStore();
		store.initialize(payinToken);
		store.initialize(bothToken);
		expect(store.hasPayinAccess()).toBe(true);
		expect(store.hasPayoutAccess()).toBe(false);
	});

	it('hydrates a server-parsed session', () => {
		const store = createSessionStore();
		const serverSession = {
			userId: 'user-1',
			organizationId: 'org-1',
			merchantName: 'Acme',
			email: 'acme@example.com',
			permissions: { payin: true, payout: false },
			groups: ['Payin']
		};
		store.hydrate(serverSession);
		expect(store.loading).toBe(false);
		expect(store.session).toEqual(serverSession);
		expect(store.hasPayinAccess()).toBe(true);
		expect(store.hasPayoutAccess()).toBe(false);
	});

	it('hydrates a null session (signed out)', () => {
		const store = createSessionStore();
		store.hydrate(null);
		expect(store.loading).toBe(false);
		expect(store.session).toBeNull();
		expect(store.hasPayinAccess()).toBe(false);
	});
});
