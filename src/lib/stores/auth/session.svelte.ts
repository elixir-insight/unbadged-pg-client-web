import type { CognitoIdToken, MerchantService } from './types';
import { mockCognitoToken } from './mock-token';
import { parseMerchantSession } from './session';

export function createSessionStore() {
	let session = $state<ReturnType<typeof parseMerchantSession> | null>(null);
	let loading = $state(true);

	return {
		get session() {
			return session;
		},
		get loading() {
			return loading;
		},

		initialize(token: CognitoIdToken = mockCognitoToken) {
			if (session) return;
			// Swap the default token for the real Cognito token when auth is ready:
			session = parseMerchantSession(token);
			loading = false;
		},

		hasPayinAccess: () => session?.permissions.payin ?? false,
		hasPayoutAccess: () => session?.permissions.payout ?? false,
		hasBothServices: () => (session?.permissions.payin && session?.permissions.payout) ?? false,
		hasService: (s: MerchantService) => session?.permissions[s] ?? false
	};
}

export const merchantSession = createSessionStore();
