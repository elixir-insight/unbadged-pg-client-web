import type { CognitoIdToken, MerchantSession } from './types';

/**
 * Maps a Cognito ID token into a normalized merchant session.
 * Pure function — no runes — so it can be unit-tested in a plain node environment.
 */
export function parseMerchantSession(token: CognitoIdToken): MerchantSession {
	const groups = token['cognito:groups'] ?? [];
	return {
		userId: token['custom:user_id'],
		organizationId: token['custom:org_id'],
		merchantName: token.preferred_username,
		email: token.email,
		permissions: {
			payin: groups.includes('Payin'),
			payout: groups.includes('Payout')
		},
		groups
	};
}
