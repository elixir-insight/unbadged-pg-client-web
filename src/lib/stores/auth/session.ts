import type { CognitoIdToken, GatewayTokenPayload, MerchantSession } from './types';

const MOCK_SERVICE_PERMISSIONS = { payin: true, payout: true } as const;

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
		displayOrgId: token['custom:org_id'],
		merchantName: token.preferred_username,
		email: token.email,
		userType: 'MEMBER',
		permissions: { ...MOCK_SERVICE_PERMISSIONS },
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
 * Live path — identity and merchant services from the gateway token,
 * portal groups from the Cognito access token.
 */
export function parseMerchantSessionFromGateway(
	token: GatewayTokenPayload,
	accessGroups: string[]
): MerchantSession {
	const serviceTypes = new Set(token.serviceTypes ?? []);

	const organizationId = String(token.orgId);
	const displayOrgId = token.displayOrgId?.trim() || organizationId;

	return {
		userId: String(token.userId),
		organizationId,
		displayOrgId,
		merchantName: resolveMerchantDisplayName(token.userName, token.userEmail),
		email: token.userEmail,
		userType: token.userType,
		permissions: {
			payin: serviceTypes.has('PAYIN'),
			payout: serviceTypes.has('PAYOUT')
		},
		groups: accessGroups
	};
}
