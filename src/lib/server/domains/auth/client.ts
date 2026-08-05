import * as v from 'valibot';
import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	RefreshResponseSchema,
	SignInResponseSchema,
	SetPasswordResponseSchema,
	ForgotPasswordRequestSchema,
	ForgotPasswordResponseSchema,
	ConfirmPasswordRequestSchema,
	ConfirmPasswordResponseSchema,
	ResetPasswordRequestSchema,
	ResetPasswordResponseSchema,
	CreateMfaRequestSchema,
	CreateMfaResponseSchema,
	MfaConfigResponseSchema,
	UpdateMfaRequestSchema,
	type MfaMethod
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
			schema: SetPasswordResponseSchema
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
		}),

	/** Authenticated password change (settings) — requires a valid session. */
	resetPassword: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		oldPassword: string,
		newPassword: string
	) =>
		apiFetch('/api/v1/user/password/reset', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body: {
				oldPassword,
				newPassword
			} satisfies v.InferOutput<typeof ResetPasswordRequestSchema>,
			schema: ResetPasswordResponseSchema
		}),

	getMfa: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/user/mfa', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: MfaConfigResponseSchema
		}),

	createMfa: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		method: MfaMethod
	) =>
		apiFetch('/api/v1/user/mfa', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body: { method } satisfies v.InferOutput<typeof CreateMfaRequestSchema>,
			schema: CreateMfaResponseSchema
		}),

	updateMfa: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: v.InferOutput<typeof UpdateMfaRequestSchema>
	) =>
		apiFetch('/api/v1/user/mfa', {
			fetch: fetchFn,
			logger,
			method: 'PATCH',
			accessToken,
			gatewayToken,
			body,
			schema: MfaConfigResponseSchema
		})
};
