import * as v from 'valibot';
import { PasswordSchema } from '$lib/validation/password';

export const SignInResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(
		v.object({
			accessToken: v.string(),
			gatewayToken: v.string(),
			idToken: v.string(),
			refreshToken: v.string()
		})
	)
});

/** Identical shape to sign-in — aliased so the two can't silently drift apart. */
export const RefreshResponseSchema = SignInResponseSchema;

export const SignInBodySchema = v.object({
	userEmail: v.pipe(v.string(), v.email('Enter a valid email')),
	password: v.pipe(v.string(), v.minLength(1, 'Password is required')),
	force: v.optional(v.boolean(), false)
});

export const ForgotPasswordRequestSchema = v.object({
	userEmail: v.pipe(v.string(), v.email('Enter a valid email'))
});

export const ForgotPasswordResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(v.unknown())
});
export type ForgotPasswordResponse = v.InferOutput<typeof ForgotPasswordResponseSchema>;

export const ConfirmPasswordRequestSchema = v.object({
	userEmail: v.pipe(v.string(), v.email('Enter a valid email')),
	confirmationCode: v.pipe(v.string(), v.length(6, 'Enter the 6-digit code sent to your email')),
	newPassword: PasswordSchema
});

export const ConfirmPasswordResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(v.unknown())
});
export type ConfirmPasswordResponse = v.InferOutput<typeof ConfirmPasswordResponseSchema>;
