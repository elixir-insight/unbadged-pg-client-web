const ACRONYMS = new Set(['LLP']);

export const BUSINESS_TYPES = [
	'PARTNERSHIP',
	'PRIVATE_LIMITED',
	'LLP',
	'SOLE_PROPRIETORSHIP'
] as const;

export const ORG_CATEGORIES = ['MERCHANT', 'PARTNER'] as const;

export const PROFILE_STATUSES = [
	'PENDING',
	'IN_REVIEW',
	'IN_PROGRESS',
	'APPROVED',
	'ACTIVE'
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type OrgCategory = (typeof ORG_CATEGORIES)[number];
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

const ENUM_VALUE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

export function isEnumValue(value: string): boolean {
	return ENUM_VALUE_PATTERN.test(value);
}

export function formatStatusLabel(status: string): string {
	if (!status || status === '—') return status;

	const normalized = status.toUpperCase().replace(/\s+/g, '_');

	return normalized
		.split('_')
		.map((word) =>
			ACRONYMS.has(word) ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()
		)
		.join(' ');
}

export function enumToDropdownOptions<T extends string>(
	values: readonly T[]
): { value: T; label: string }[] {
	return values.map((value) => ({ value, label: formatStatusLabel(value) }));
}
