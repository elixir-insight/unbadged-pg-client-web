export type MerchantService = 'payin' | 'payout';

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

export interface MerchantSession {
	userId: string;
	organizationId: string;
	merchantName: string;
	email: string;
	permissions: { payin: boolean; payout: boolean };
	groups: string[];
}
