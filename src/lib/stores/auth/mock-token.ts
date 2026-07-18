import type { CognitoIdToken } from './types';

export const mockCognitoToken: CognitoIdToken = {
	sub: '2183adaa-1041-701a-34df-ff1d32f11e85',
	'cognito:groups': ['MERCHANT'],
	email_verified: true,
	iss: 'https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_3dJPlaFsP',
	'custom:user_id': '100001',
	phone_number_verified: true,
	'custom:org_id': '10001',
	'cognito:username': '2183adaa-1041-701a-34df-ff1d32f11e85',
	preferred_username: 'Sabari srinvasan',
	origin_jti: 'af649aad-3404-4b16-b807-9350b70f2c74',
	aud: '2bdd24o8s1vuf0l4c1fivgtckb',
	event_id: '1aa253eb-ac5b-40b2-9d9f-e6bb78424d80',
	token_use: 'id',
	auth_time: 1782710474,
	phone_number: '+916382303714',
	exp: 1782711374,
	iat: 1782710474,
	jti: 'b50f547e-2423-4502-8710-4b71082face3',
	email: 'merchant@elixirpay.com'
};
