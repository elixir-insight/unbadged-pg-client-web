import * as v from 'valibot';
import type { KycTab } from '../components/kyc/types';

const aadhaarSchema = v.pipe(
	v.string(),
	v.transform((value) => value.replace(/\D/g, '')),
	v.length(12, 'Aadhaar number must be exactly 12 digits.')
);

const panSchema = v.pipe(
	v.string(),
	v.transform((value) =>
		value
			.replace(/[^a-zA-Z0-9]/g, '')
			.slice(0, 10)
			.toUpperCase()
	),
	v.regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must match the format AAAAA9999A.')
);

export function validateKycInput(tab: KycTab, value: string): string | null {
	const schema = tab === 'aadhaar' ? aadhaarSchema : panSchema;
	const result = v.safeParse(schema, value);

	if (result.success) {
		return null;
	}

	return result.issues[0]?.message ?? 'Invalid input.';
}
