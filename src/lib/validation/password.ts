import * as v from 'valibot';

/**
 * Single source of truth for password rules — imported by both the server-side
 * request schema (lib/server/domains/auth/schema.ts) and client components that
 * need to show field-specific errors before submitting.
 */
export const PasswordSchema = v.pipe(
	v.string(),
	v.minLength(12, 'Password must be at least 12 characters'),
	v.regex(/[A-Z]/, 'Password must include an uppercase letter'),
	v.regex(/[a-z]/, 'Password must include a lowercase letter'),
	v.regex(/[0-9]/, 'Password must include a number'),
	v.regex(/[^A-Za-z0-9]/, 'Password must include a special character')
);

export const NewPasswordFormSchema = v.pipe(
	v.object({
		newPassword: PasswordSchema,
		confirmPassword: v.pipe(v.string(), v.minLength(1, 'Please re-enter your password'))
	}),
	v.forward(
		v.partialCheck(
			[['newPassword'], ['confirmPassword']],
			(input) => input.newPassword === input.confirmPassword,
			'Passwords do not match'
		),
		['confirmPassword']
	)
);
