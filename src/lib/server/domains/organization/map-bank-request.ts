import * as v from 'valibot';
import { AddOrganizationBankRequestSchema, type AddOrganizationBankRequest } from './schema';
import { AddBankFormBodySchema, type AddBankFormBody } from '$lib/validation/organization-bank';

export { AddBankFormBodySchema };
export type { AddBankFormBody };

export function buildAddOrganizationBankRequest(
	input: AddBankFormBody
): AddOrganizationBankRequest {
	return v.parse(AddOrganizationBankRequestSchema, {
		accountNumber: input.accountNumber,
		accountType: input.accountType,
		bankName: input.bankName,
		branchName: input.branch,
		holderName: input.accountHolderName,
		ifscCode: input.ifscCode,
		status: input.status
	});
}

/** Same payload shape as add — reused for partial bank updates. */
export const buildUpdateOrganizationBankRequest = buildAddOrganizationBankRequest;
