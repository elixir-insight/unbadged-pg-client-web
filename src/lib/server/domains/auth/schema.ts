import * as v from 'valibot';

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
