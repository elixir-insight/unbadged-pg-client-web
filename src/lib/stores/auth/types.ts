export type MerchantService = 'payin' | 'payout';

/**  Portal apps driven by access-token cognito:groups. Payin/payout are separate. */
export type PortalGroup = 'MERCHANT' | 'PARTNER' | 'MANAGEMENT';

export type PortalHomePath = '/merchant' | '/partner' | '/management';

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
	userId: number;
	userName: string;
	userEmail: string;
	userType: string;
	iss: string;
	token_use: 'gateway';
	exp: number;
	iat: number;
	sub?: string;
}

export interface MerchantSession {
	userId: string;
	organizationId: string;
	merchantName: string;
	email: string;
	userType: string;
	/** Filled by a separate services API later; temporarily both true for MERCHANT UX.*/
	permissions: { payin: boolean; payout: boolean };
	groups: string[];
}
