import type { BrowserContext } from '@playwright/test';

function encodeJwtPart(value: Record<string, unknown>): string {
	return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createMockJwt(payload: Record<string, unknown>): string {
	return `${encodeJwtPart({ alg: 'none', typ: 'JWT' })}.${encodeJwtPart(payload)}.e2e-signature`;
}

function tokenExp(secondsFromNow = 60 * 60): number {
	return Math.floor(Date.now() / 1000) + secondsFromNow;
}

/** Non-expired session cookies for authenticated Playwright routes. */
export function createManagementSessionTokens() {
	const exp = tokenExp();
	const iat = Math.floor(Date.now() / 1000);

	return {
		accessToken: createMockJwt({
			sub: 'e2e-user',
			username: 'e2e-user',
			client_id: 'e2e-client',
			token_use: 'access',
			scope: 'openid',
			auth_time: iat,
			exp,
			iat,
			jti: 'e2e-access',
			iss: 'https://e2e.example.com',
			'cognito:groups': ['MANAGEMENT']
		}),
		gatewayToken: createMockJwt({
			orgId: 10001,
			userId: 100001,
			userName: 'E2E Admin',
			userEmail: 'e2e-admin@elixirpay.com',
			userType: 'MEMBER',
			serviceTypes: ['PAYIN', 'PAYOUT'],
			iss: 'https://e2e.example.com',
			token_use: 'gateway',
			exp,
			iat
		}),
		idToken: createMockJwt({
			sub: 'e2e-user',
			'cognito:groups': ['MANAGEMENT'],
			'custom:user_id': '100001',
			'custom:org_id': '10001',
			preferred_username: 'E2E Admin',
			email: 'e2e-admin@elixirpay.com',
			token_use: 'id',
			exp,
			iat
		}),
		refreshToken: 'e2e-refresh-token'
	};
}

export async function authenticateManagementSession(context: BrowserContext, baseURL: string) {
	const url = new URL(baseURL);
	const tokens = createManagementSessionTokens();

	await context.addCookies(
		(Object.entries(tokens) as [keyof typeof tokens, string][]).map(([name, value]) => ({
			name,
			value,
			domain: url.hostname,
			path: '/',
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'Strict' as const
		}))
	);
}
