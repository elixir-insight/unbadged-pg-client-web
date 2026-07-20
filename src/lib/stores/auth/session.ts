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
		userType: 'MEMBER',
		permissions: { ...TEMP_SERVICE_PERMISSIONS },
		groups
	};
}

/** Display name when gateway `userName` is null/blank — prefer email local-part. */
export function resolveMerchantDisplayName(
	userName: string | null | undefined,
	userEmail: string | null | undefined
): string {
	const name = userName?.trim();
	if (name) return name;

	const email = userEmail?.trim();
	if (email) {
		const localPart = email.split('@')[0]?.trim();
		if (localPart) return localPart;
	}

	return 'User';
}

/**
 * Live path — identity from gateway token, portal groups from access token.
 * Payin/payout come from a separate API later.
 */
export function parseMerchantSessionFromGateway(
	token: GatewayTokenPayload,
	accessGroups: string[]
): MerchantSession {
	return {
		userId: String(token.userId),
		organizationId: String(token.orgId),
		merchantName: resolveMerchantDisplayName(token.userName, token.userEmail),
		email: token.userEmail,
		userType: token.userType,
		permissions: { ...TEMP_SERVICE_PERMISSIONS },
		groups: accessGroups
	};
}
