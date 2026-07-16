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

const SignInSessionExistsResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(
		v.object({
			sessionAlreadyExists: v.literal(true)
		})
	)
});

/** Tokens on success, or session-conflict payload on 202. */
export const SignInResponseSchema = v.union([
	SignInTokensResponseSchema,
	SignInSessionExistsResponseSchema
]);

/** Refresh only returns tokens — not the session-conflict union. */
export const RefreshResponseSchema = SignInTokensResponseSchema;

export const SignInBodySchema = v.object({
	userEmail: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Email is required'),
		v.email('Enter a valid email')
	),
	password: v.pipe(v.string(), v.trim(), v.minLength(1, 'Password is required')),
	force: v.optional(v.boolean(), false)
});

export const ForgotPasswordRequestSchema = v.object({
	userEmail: v.pipe(v.string(), v.trim(), v.email('Enter a valid email'))
});

export const ForgotPasswordResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(v.unknown())
});
export type ForgotPasswordResponse = v.InferOutput<typeof ForgotPasswordResponseSchema>;

export const ConfirmPasswordRequestSchema = v.object({
	userEmail: v.pipe(v.string(), v.trim(), v.email('Enter a valid email')),
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
