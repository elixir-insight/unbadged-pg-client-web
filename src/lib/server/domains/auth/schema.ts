import * as v from 'valibot';
import { PasswordSchema } from '$lib/validation/password';

export const AuthTokensSchema = v.object({
	accessToken: v.string(),
	gatewayToken: v.string(),
	idToken: v.string(),
	refreshToken: v.string()
});

const SignInTokensResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(AuthTokensSchema)
});

export type AuthTokens = v.InferOutput<typeof AuthTokensSchema>;
export type SignInTokensResponse = v.InferOutput<typeof SignInTokensResponseSchema>;

const SignInSessionExistsResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(
		v.object({
			sessionAlreadyExists: v.literal(true)
		})
	)
});

// 202 "Password change required" — user signed in with a temporary password.
export const SignInPasswordChangeResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(
		v.object({
			challengeSession: v.string(),
			requiresPasswordChange: v.literal(true)
		})
	)
});

/** Tokens on success, or session-conflict / password-change payload on 202. */
export const SignInResponseSchema = v.union([
	SignInTokensResponseSchema,
	SignInSessionExistsResponseSchema,
	SignInPasswordChangeResponseSchema
]);

/** Refresh only returns tokens — not the session-conflict union. */
export const RefreshResponseSchema = SignInTokensResponseSchema;

/** Password set may return auth tokens (same envelope as sign-in) or an ack-only payload. */
export const SetPasswordResponseSchema = v.union([
	SignInTokensResponseSchema,
	v.object({
		message: v.string(),
		statusCode: v.number(),
		data: v.array(v.unknown())
	})
]);
export type SetPasswordResponse = v.InferOutput<typeof SetPasswordResponseSchema>;

/** Auth emails are case-insensitive — normalize before upstream calls. */
const AuthEmailSchema = v.pipe(
	v.string(),
	v.trim(),
	v.toLowerCase(),
	v.minLength(1, 'Email is required'),
	v.email('Enter a valid email')
);

export const SignInBodySchema = v.object({
	userEmail: AuthEmailSchema,
	password: v.pipe(v.string(), v.trim(), v.minLength(1, 'Password is required')),
	force: v.optional(v.boolean(), false)
});

export const ForgotPasswordRequestSchema = v.object({
	userEmail: AuthEmailSchema
});

export const ForgotPasswordResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(v.unknown())
});
export type ForgotPasswordResponse = v.InferOutput<typeof ForgotPasswordResponseSchema>;

export const ConfirmPasswordRequestSchema = v.object({
	userEmail: AuthEmailSchema,
	confirmationCode: v.pipe(
		v.string(),
		v.trim(),
		v.length(6, 'Enter the 6-digit code sent to your email')
	),
	newPassword: PasswordSchema
});

export const ConfirmPasswordResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(v.unknown())
});
export type ConfirmPasswordResponse = v.InferOutput<typeof ConfirmPasswordResponseSchema>;
