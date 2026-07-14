import type { CognitoIdToken, MerchantService, MerchantSession } from './types';
import { mockCognitoToken } from './mock-token';
import { parseMerchantSession } from './session';

export function createSessionStore() {
	let session = $state<MerchantSession | null>(null);
	let loading = $state(true);

	return {
		get session() {
			return session;
		},
		get loading() {
			return loading;
		},

		/** Kept for Storybook/tests using a raw mock token. */
		initialize(token: CognitoIdToken = mockCognitoToken) {
			if (session) return;
			session = parseMerchantSession(token);
			loading = false;
		},

		/** Real-auth path. Server already parsed the session; the raw idToken never reaches client JS. */
		hydrate(serverSession: MerchantSession | null) {
			session = serverSession;
			loading = false;
		},

		hasPayinAccess: () => session?.permissions.payin ?? false,
		hasPayoutAccess: () => session?.permissions.payout ?? false,
		hasBothServices: () => (session?.permissions.payin && session?.permissions.payout) ?? false,
		hasService: (s: MerchantService) => session?.permissions[s] ?? false
	};
}

export const merchantSession = createSessionStore();
