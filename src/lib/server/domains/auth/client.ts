import * as v from 'valibot';
import { apiFetch } from '../../http/fetchClient';
import { RefreshResponseSchema, SignInResponseSchema } from './schema';

export const authClient = {
	signIn: (fetchFn: typeof fetch, userEmail: string, password: string, force = false) =>
		apiFetch('/api/v1/user/sign-in', {
			fetch: fetchFn,
			method: 'POST',
			skipAuth: true,
			body: { userEmail, password, force },
			schema: SignInResponseSchema
		}),

	/**
	 * Swagger: POST /api/v1/user/refresh-token — three headers, no body.
	 */
	refresh: (
		fetchFn: typeof fetch,
		accessToken: string,
		gatewayToken: string,
		refreshToken: string
	) =>
		apiFetch('/api/v1/user/refresh-token', {
			fetch: fetchFn,
			method: 'POST',
			skipAuth: true,
			extraHeaders: {
				Authorization: `Bearer ${accessToken}`,
				'X-Gateway-Token': gatewayToken,
				'X-Refresh-Token': refreshToken
			},
			schema: RefreshResponseSchema
		}),

	signOut: (
		fetchFn: typeof fetch,
		accessToken: string,
		gatewayToken: string,
		refreshToken: string
	) =>
		apiFetch('/api/v1/user/sign-out', {
			fetch: fetchFn,
			method: 'POST',
			skipAuth: true,
			extraHeaders: {
				Authorization: `Bearer ${accessToken}`,
				'X-Gateway-Token': gatewayToken,
				'X-Refresh-Token': refreshToken
			},
			schema: v.optional(v.object({ message: v.string() }))
		})
};
