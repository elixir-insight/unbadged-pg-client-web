import * as v from 'valibot';

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_PATTERN = /^[0-9]{9,18}$/;
const HOLDER_NAME_PATTERN = /^[A-Za-z .'-]+$/;
const BRANCH_PATTERN = /^[A-Za-z0-9 .,&/-]+$/;

export const ACCOUNT_TYPE_VALUES = [
	'SAVINGS',
	'CURRENT',
	'NODAL',
	'ESCROW',
	'FOREIGN_CURRENCY'
] as const;

export const ACCOUNT_STATUS_VALUES = [
	'ACTIVE',
	'ON_HOLD',
	'INACTIVE',
	'BLOCKED',
	'CLOSED'
] as const;

export type AccountTypeValue = (typeof ACCOUNT_TYPE_VALUES)[number];
export type AccountStatusValue = (typeof ACCOUNT_STATUS_VALUES)[number];

function normalizeIfsc(value: string): string {
	return value.trim().toUpperCase();
}

export const holderNameSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Account holder name is required'),
	v.check((val) => HOLDER_NAME_PATTERN.test(val), 'Enter a valid account holder name')
);

export const accountNumberSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Account number is required'),
	v.check((val) => ACCOUNT_NUMBER_PATTERN.test(val), 'Enter a valid 9–18 digit account number')
);

export const ifscCodeSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'IFSC code is required'),
	v.transform(normalizeIfsc),
	v.check((val) => IFSC_PATTERN.test(val), 'Enter a valid 11-character IFSC code')
);

export const branchNameSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Branch is required'),
	v.check((val) => BRANCH_PATTERN.test(val), 'Enter a valid branch name')
);

export const bankNameSchema = v.pipe(v.string(), v.trim(), v.minLength(1, 'Bank name is required'));

export const accountTypeSchema = v.picklist(ACCOUNT_TYPE_VALUES, 'Select a valid account type');

export const bankStatusSchema = v.picklist(ACCOUNT_STATUS_VALUES, 'Select a valid account status');

export const AddBankFormBodySchema = v.object({
	accountHolderName: holderNameSchema,
	accountNumber: accountNumberSchema,
	ifscCode: ifscCodeSchema,
	bankName: bankNameSchema,
	branch: branchNameSchema,
	accountType: accountTypeSchema,
	status: bankStatusSchema
});

export type AddBankFormBody = v.InferOutput<typeof AddBankFormBodySchema>;

function collectIssues(issues: v.BaseIssue<unknown>[]): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const issue of issues) {
		const path = issue.path?.map((part) => String(part.key)).join('.') ?? '';
		if (path && !errors[path]) {
			errors[path] = issue.message;
		}
	}
	return errors;
}

export function validateBankAccount(input: {
	accountHolderName: string;
	accountNumber: string;
	ifscCode: string;
	bankName: string;
	branch: string;
	accountType: string;
	status: string;
}): Record<string, string> {
	const result = v.safeParse(AddBankFormBodySchema, input);
	return result.success ? {} : collectIssues(result.issues);
}

export function firstValidationError(errors: Record<string, string>): string | null {
	const values = Object.values(errors);
	return values.length === 0 ? null : values[0];
}
