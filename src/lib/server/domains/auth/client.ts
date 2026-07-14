import * as v from 'valibot';
import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { RefreshResponseSchema, SignInResponseSchema } from './schema';

export const authClient = {
	signIn: (
		fetchFn: typeof fetch,
		logger: Logger,
		userEmail: string,
		password: string,
		force = false
	) =>
		apiFetch('/api/v1/user/sign-in', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			skipAuth: true,
			body: { userEmail, password, force },
			schema: SignInResponseSchema
		}),

	refresh: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		refreshToken: string
	) =>
		apiFetch('/api/v1/user/refresh-token', {
			fetch: fetchFn,
			logger,
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
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		refreshToken: string
	) =>
		apiFetch('/api/v1/user/sign-out', {
			fetch: fetchFn,
			logger,
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
