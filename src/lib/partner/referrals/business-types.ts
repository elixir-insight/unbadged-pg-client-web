export const REFERRAL_BUSINESS_TYPES = [
	{ value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
	{ value: 'PARTNERSHIP', label: 'Partnership' },
	{ value: 'LIMITED_LIABILITY_PARTNERSHIP', label: 'LLP' },
	{ value: 'PRIVATE_LIMITED', label: 'Private Limited' }
] as const;

export type ReferralBusinessType = (typeof REFERRAL_BUSINESS_TYPES)[number]['value'];

const BUSINESS_TYPE_VALUES = new Set<string>(REFERRAL_BUSINESS_TYPES.map((option) => option.value));

export function parseReferralBusinessType(
	value: string | null | undefined
): ReferralBusinessType | undefined {
	const normalized = value?.trim();
	if (!normalized || !BUSINESS_TYPE_VALUES.has(normalized)) return undefined;
	return normalized as ReferralBusinessType;
}

export function formatReferralBusinessType(value: string): string {
	const match = REFERRAL_BUSINESS_TYPES.find((option) => option.value === value);
	if (match) return match.label;

	return value
		.split('_')
		.map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}
