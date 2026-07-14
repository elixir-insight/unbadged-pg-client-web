import type { CognitoIdToken, GatewayTokenPayload, MerchantSession } from './types';

/**
 * Maps a Cognito ID token into a normalized merchant session.
 * Kept for Storybook/mock-token tests — no longer the live auth path.
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

/**
 * Live path — same MerchantSession output shape, different input,
 * so nothing downstream (hydrate(), hasPayinAccess(), etc.) needs to change.
 */
export function parseMerchantSessionFromGateway(token: GatewayTokenPayload): MerchantSession {
	const groups = token['cognito:groups'] ?? [];
	return {
		userId: String(token.userId),
		organizationId: String(token.orgId),
		merchantName: token.userName,
		email: token.userEmail,
		permissions: {
			payin: groups.includes('Payin'),
			payout: groups.includes('Payout')
		},
		groups
	};
}
