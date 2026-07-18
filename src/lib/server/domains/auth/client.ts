import * as v from 'valibot';
import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	RefreshResponseSchema,
	SignInResponseSchema,
	ForgotPasswordRequestSchema,
	ForgotPasswordResponseSchema,
	ConfirmPasswordRequestSchema,
	ConfirmPasswordResponseSchema
} from './schema';

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

	/** Completes the temporary-password challenge returned by sign-in (202). */
	setPassword: (
		fetchFn: typeof fetch,
		logger: Logger,
		userEmail: string,
		challengeSession: string,
		newPassword: string
	) =>
		apiFetch('/api/v1/user/password/set', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			skipAuth: true,
			body: { userEmail, challengeSession, newPassword },
			schema: v.nullable(v.looseObject({ message: v.optional(v.string()) }))
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
		}),

	forgotPassword: (fetchFn: typeof fetch, logger: Logger, userEmail: string) =>
		apiFetch('/api/v1/user/password/forgot', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			skipAuth: true,
			body: { userEmail } satisfies v.InferOutput<typeof ForgotPasswordRequestSchema>,
			schema: ForgotPasswordResponseSchema
		}),

	confirmPassword: (
		fetchFn: typeof fetch,
		logger: Logger,
		userEmail: string,
		confirmationCode: string,
		newPassword: string
	) =>
		apiFetch('/api/v1/user/password/confirm', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			skipAuth: true,
			body: {
				userEmail,
				confirmationCode,
				newPassword
			} satisfies v.InferOutput<typeof ConfirmPasswordRequestSchema>,
			schema: ConfirmPasswordResponseSchema
		})
};
