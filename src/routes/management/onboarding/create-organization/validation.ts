import * as v from 'valibot';
import type { ClientType } from './constants';

const orgSchema = v.object({
	orgName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Organization name is required')),
	orgPhone: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Mobile number is required'),
		v.check(
			(val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, '')),
			'Enter a valid 10-digit Indian mobile number'
		)
	),
	orgEmail: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Email address is required'),
		v.email('Enter a valid email address')
	),
	orgBusinessType: v.pipe(v.string(), v.minLength(1, 'Business type is required'))
});

export interface CreateOrganizationInput {
	selectedCategory: ClientType | null;
	orgName: string;
	orgPhone: string;
	orgEmail: string;
	orgBusinessType: string;
	selectedServiceTypes: string[];
}

export function validateCreateOrganization(input: CreateOrganizationInput): Record<string, string> {
	const e: Record<string, string> = {};

	const result = v.safeParse(orgSchema, {
		orgName: input.orgName,
		orgPhone: input.orgPhone,
		orgEmail: input.orgEmail,
		orgBusinessType: input.orgBusinessType
	});

	if (!result.success) {
		for (const issue of result.issues) {
			const key = issue.path?.[0]?.key as string | undefined;
			if (key && !e[key]) e[key] = issue.message;
		}
	}

	if (input.selectedCategory === 'MERCHANT') {
		if (input.selectedServiceTypes.length === 0) {
			e.serviceTypes = 'Select at least one service type';
		}
	}

	return e;
}

export function firstValidationError(errors: Record<string, string>): string | null {
	const values = Object.values(errors);
	return values.length === 0 ? null : values[0];
}
