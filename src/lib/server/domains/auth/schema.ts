import * as v from 'valibot';
import { PasswordSchema } from '$lib/validation/password';
import { SIGN_UP_BUSINESS_TYPE_VALUES, SignUpBodySchema } from '$lib/validation/sign-up';

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

export const MfaChallengeNameSchema = v.picklist(['EMAIL_OTP', 'SMS_MFA']);
export type MfaChallengeName = v.InferOutput<typeof MfaChallengeNameSchema>;

export const SignInMfaChallengeItemSchema = v.object({
	challengeName: MfaChallengeNameSchema,
	challengeSession: v.string(),
	challengeDestination: v.string(),
	challengeExpiresIn: v.number()
});

// 202 "OTP verification required" — MFA challenge after password sign-in.
export const SignInMfaChallengeResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(SignInMfaChallengeItemSchema)
});

/** Tokens on success, or session-conflict / password-change / MFA challenge on 202. */
export const SignInResponseSchema = v.union([
	SignInTokensResponseSchema,
	SignInSessionExistsResponseSchema,
	SignInPasswordChangeResponseSchema,
	SignInMfaChallengeResponseSchema
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

/** Authenticated password change from settings (old + new). */
export const ResetPasswordRequestSchema = v.object({
	oldPassword: v.pipe(v.string(), v.minLength(1, 'Current password is required')),
	newPassword: PasswordSchema
});

export const ResetPasswordResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(v.unknown())
});
export type ResetPasswordResponse = v.InferOutput<typeof ResetPasswordResponseSchema>;

export const MfaMethodSchema = v.picklist(['EMAIL', 'SMS']);
export type MfaMethod = v.InferOutput<typeof MfaMethodSchema>;

export const MfaConfigSchema = v.object({
	method: v.optional(MfaMethodSchema),
	configured: v.boolean(),
	enabled: v.boolean()
});
export type MfaConfig = v.InferOutput<typeof MfaConfigSchema>;

export const MfaConfigResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number(),
	data: v.array(MfaConfigSchema)
});
export type MfaConfigResponse = v.InferOutput<typeof MfaConfigResponseSchema>;

export const CreateMfaRequestSchema = v.object({
	method: MfaMethodSchema
});

export const CreateMfaResponseSchema = v.object({
	statusCode: v.number(),
	message: v.optional(v.string()),
	data: v.optional(v.array(MfaConfigSchema))
});

export const UpdateMfaRequestSchema = v.pipe(
	v.object({
		enabled: v.optional(v.boolean()),
		method: v.optional(MfaMethodSchema)
	}),
	v.check(
		(input) => input.enabled !== undefined || input.method !== undefined,
		'Provide enabled or method to update'
	)
);

export const VerifyMfaRequestSchema = v.object({
	userEmail: AuthEmailSchema,
	challengeName: MfaChallengeNameSchema,
	challengeSession: v.string(),
	code: v.pipe(v.string(), v.trim(), v.length(6, 'Enter the 6-digit verification code'))
});

export const VerifyMfaResponseSchema = SignInTokensResponseSchema;

export const SignUpRequestSchema = SignUpBodySchema;
export type SignUpRequest = v.InferOutput<typeof SignUpRequestSchema>;

export const SignUpApiBodySchema = v.object({
	legalCompanyName: v.string(),
	businessType: v.picklist(SIGN_UP_BUSINESS_TYPE_VALUES),
	userEmail: v.string(),
	phoneNumber: v.string(),
	password: v.string(),
	affiliateId: v.string()
});
export type SignUpApiBody = v.InferOutput<typeof SignUpApiBodySchema>;

export const SignUpResponseSchema = v.object({
	data: v.array(
		v.object({
			orgId: v.string(),
			userEmail: v.string()
		})
	),
	message: v.string(),
	statusCode: v.number()
});
export type SignUpResponse = v.InferOutput<typeof SignUpResponseSchema>;

export const ConfirmSignUpRequestSchema = v.object({
	userEmail: AuthEmailSchema,
	confirmationCode: v.pipe(v.string(), v.trim(), v.length(6, 'Enter the 6-digit code.'))
});
export type ConfirmSignUpRequest = v.InferOutput<typeof ConfirmSignUpRequestSchema>;

export const ResendSignUpConfirmationRequestSchema = v.object({
	userEmail: AuthEmailSchema
});
export type ResendSignUpConfirmationRequest = v.InferOutput<
	typeof ResendSignUpConfirmationRequestSchema
>;

export const ConfirmSignUpResponseSchema = v.object({
	data: v.array(v.unknown()),
	message: v.string(),
	statusCode: v.number()
});
export type ConfirmSignUpResponse = v.InferOutput<typeof ConfirmSignUpResponseSchema>;
