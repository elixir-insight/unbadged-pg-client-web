export type MerchantService = 'payin' | 'payout';
export type GatewayServiceType = 'PAYIN' | 'PAYOUT';

/** Portal apps from Cognito groups + gateway `group` (PLATFORM → Partner). Payin/payout are separate. */
export type PortalGroup = 'MERCHANT' | 'PARTNER' | 'MANAGEMENT';

export type PortalHomePath = '/merchant' | '/partner' | '/management' | '/self-onboarding';

export interface CognitoIdToken {
	sub: string;
	'cognito:groups': string[];
	'custom:user_id': string;
	'custom:org_id': string;
	preferred_username: string;
	email: string;
	email_verified: boolean;
	phone_number: string;
	phone_number_verified: boolean;
	'cognito:username': string;
	iss: string;
	aud: string;
	token_use: string;
	auth_time: number;
	exp: number;
	iat: number;
	jti: string;
	origin_jti: string;
	event_id: string;
}

/** Cognito access token — source of portal cognito:groups. */
export interface AccessTokenPayload {
	sub: string;
	username: string;
	client_id: string;
	token_use: 'access';
	scope: string;
	auth_time: number;
	exp: number;
	iat: number;
	jti: string;
	iss: string;
	event_id?: string;
	'cognito:groups'?: string[];
}

export interface GatewayTokenPayload {
	orgId: number;
	/** Human-readable org identifier for UI (e.g. ORG_2bV). */
	displayOrgId?: string;
	userId: number;
	/** Backend may return null for ROOT / incomplete profiles. */
	userName: string | null;
	userEmail: string;
	userType: string;
	group?: string;
	serviceTypes?: GatewayServiceType[];
	iss: string;
	token_use: 'gateway';
	exp: number;
	iat: number;
	sub?: string;
}

export interface MerchantSession {
	userId: string;
	organizationId: string;
	/** Human-readable org identifier shown in merchant UI. */
	displayOrgId: string;
	merchantName: string;
	email: string;
	userType: string;
	/** Merchant app access derived from the gateway token's serviceTypes claim. */
	permissions: { payin: boolean; payout: boolean };
	groups: string[];
}
