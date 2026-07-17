import * as v from 'valibot';

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
