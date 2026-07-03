import type { PartnerProfile, PartnerProfileFieldErrors } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(\+91)?[6-9]\d{9}$/;

function normalizePhone(value: string) {
	return value.replace(/[\s\-()]/g, '');
}

export function validateEmail(value: string): string | undefined {
	const trimmed = value.trim();
	if (!trimmed) return 'Email is required.';
	if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address.';
	return undefined;
}

export function validatePhone(value: string): string | undefined {
	const trimmed = value.trim();
	if (!trimmed) return 'Phone number is required.';
	if (!PHONE_PATTERN.test(normalizePhone(trimmed))) {
		return 'Enter a valid 10-digit phone number.';
	}
	return undefined;
}

export function validateWebsite(value: string): string | undefined {
	const trimmed = value.trim();
	if (!trimmed) return 'Website is required.';

	try {
		const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
		if (!url.hostname.includes('.')) return 'Enter a valid website URL.';
		return undefined;
	} catch {
		return 'Enter a valid website URL.';
	}
}

export function validateProfileFields(
	profile: Pick<PartnerProfile, 'email' | 'phone' | 'website'>
) {
	const errors: PartnerProfileFieldErrors = {};

	const emailError = validateEmail(profile.email);
	if (emailError) errors.email = emailError;

	const phoneError = validatePhone(profile.phone);
	if (phoneError) errors.phone = phoneError;

	const websiteError = validateWebsite(profile.website);
	if (websiteError) errors.website = websiteError;

	return errors;
}

export function hasProfileFieldErrors(errors: PartnerProfileFieldErrors) {
	return Boolean(errors.email || errors.phone || errors.website);
}
