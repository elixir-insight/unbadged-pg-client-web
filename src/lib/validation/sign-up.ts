import * as v from 'valibot';
import { normalizeIndianMobilePhone } from '$lib/validation/organization-kyb';

export const SIGN_UP_BUSINESS_TYPES = [
	{ value: 'PRIVATE_LIMITED', label: 'Private limited' },
	{ value: 'SOLE_PROPRIETORSHIP', label: 'Proprietorship' },
	{ value: 'PARTNERSHIP', label: 'Partnership' },
	{ value: 'LIMITED_LIABILITY_PARTNERSHIP', label: 'LLP' }
] as const;

export const SIGN_UP_BUSINESS_TYPE_VALUES = [
	'PRIVATE_LIMITED',
	'SOLE_PROPRIETORSHIP',
	'PARTNERSHIP',
	'LIMITED_LIABILITY_PARTNERSHIP'
] as const;

export type SignUpBusinessType = (typeof SIGN_UP_BUSINESS_TYPE_VALUES)[number];

export const SIGN_UP_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SIGN_UP_PHONE_REGEX = /^[6-9]\d{9}$/;
export const SIGN_UP_PASSWORD_ERROR =
	'Password must be 12-50 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.';
export const SIGN_UP_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,50}$/;

export const SIGN_UP_FIELD_ORDER = [
	'legalCompanyName',
	'businessType',
	'userEmail',
	'phoneNumber',
	'password'
] as const;

export type SignUpField = (typeof SIGN_UP_FIELD_ORDER)[number] | 'affiliateId';

export type SignUpInput = {
	legalCompanyName: string;
	businessType: string;
	userEmail: string;
	phoneNumber: string;
	password: string;
	affiliateId: string;
};

export const SignUpBodySchema = v.object({
	legalCompanyName: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, "Enter your company's legal name.")
	),
	businessType: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Select a business type.'),
		v.picklist(SIGN_UP_BUSINESS_TYPE_VALUES, 'Select a business type.')
	),
	userEmail: v.pipe(
		v.string(),
		v.trim(),
		v.toLowerCase(),
		v.check((val) => SIGN_UP_EMAIL_REGEX.test(val), 'Enter a valid email address.')
	),
	phoneNumber: v.pipe(
		v.string(),
		v.trim(),
		v.transform(normalizeIndianMobilePhone),
		v.check((val) => SIGN_UP_PHONE_REGEX.test(val), 'Enter a valid 10-digit mobile number.')
	),
	password: v.pipe(
		v.string(),
		v.check((val) => SIGN_UP_PASSWORD_REGEX.test(val), SIGN_UP_PASSWORD_ERROR)
	),
	affiliateId: v.pipe(v.string(), v.trim())
});

export type SignUpBody = v.InferOutput<typeof SignUpBodySchema>;

export function validateSignUp(values: SignUpInput): Partial<Record<SignUpField, string>> {
	const parsed = v.safeParse(SignUpBodySchema, values);
	if (parsed.success) return {};

	const errors: Partial<Record<SignUpField, string>> = {};
	for (const issue of parsed.issues) {
		const key = issue.path?.[0]?.key;
		if (typeof key === 'string' && !(key in errors)) {
			errors[key as SignUpField] = issue.message;
		}
	}
	return errors;
}

export function validateSignUpField(field: SignUpField, values: SignUpInput): string {
	return validateSignUp(values)[field] ?? '';
}

export function isSignUpFormValid(values: SignUpInput): boolean {
	return v.safeParse(SignUpBodySchema, values).success;
}

export function firstInvalidSignUpField(
	errors: Partial<Record<SignUpField, string>>
): SignUpField | null {
	for (const field of SIGN_UP_FIELD_ORDER) {
		if (errors[field]) return field;
	}
	return null;
}

export function getPasswordStrength(password: string): 'empty' | 'weak' | 'strong' {
	if (!password) return 'empty';
	return SIGN_UP_PASSWORD_REGEX.test(password) ? 'strong' : 'weak';
}
