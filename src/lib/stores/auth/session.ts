import type { CognitoIdToken, GatewayTokenPayload, MerchantSession } from './types';

/**
 * Temporary payin/payout flags until the dedicated services-access API exists.
 * Do not derive these from `cognito:groups` — groups are portal-only (MERCHANT/PARTNER/MANAGEMENT).
 */
const TEMP_SERVICE_PERMISSIONS = { payin: true, payout: true } as const;

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
		permissions: { ...TEMP_SERVICE_PERMISSIONS },
		groups
	};
}

/**
 * Live path — same MerchantSession output shape, different input,
 * so nothing downstream (hydrate(), hasPayinAccess(), etc.) needs to change.
 *
 * `cognito:groups` = portal access only. Payin/payout come from a separate API later.
 */
export function parseMerchantSessionFromGateway(token: GatewayTokenPayload): MerchantSession {
	const groups = token['cognito:groups'] ?? [];
	return {
		userId: String(token.userId),
		organizationId: String(token.orgId),
		merchantName: token.userName,
		email: token.userEmail,
		permissions: { ...TEMP_SERVICE_PERMISSIONS },
		groups
	};
}
