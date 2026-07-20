import { describe, expect, it } from 'vitest';
import { firstValidationError, validateBankAccount } from './organization-bank';
import * as v from 'valibot';
import {
	buildAddOrganizationBankRequest,
	AddBankFormBodySchema
} from '$lib/server/domains/organization/mappers/to-api/bank-account';

const validBank = {
	accountHolderName: 'Acme Operations',
	accountNumber: '123456789012',
	ifscCode: 'HDFC0001234',
	bankName: 'HDFC Bank',
	branch: 'MG Road',
	accountType: 'CURRENT',
	status: 'ACTIVE'
};

describe('organization bank validation', () => {
	it('accepts a valid bank payload', () => {
		expect(validateBankAccount(validBank)).toEqual({});
	});

	it('rejects invalid account number and IFSC', () => {
		const errors = validateBankAccount({
			...validBank,
			accountNumber: '123',
			ifscCode: 'bad'
		});
		expect(errors.accountNumber).toBeTruthy();
		expect(errors.ifscCode).toBeTruthy();
	});

	it('rejects empty holder name', () => {
		const errors = validateBankAccount({ ...validBank, accountHolderName: '   ' });
		expect(errors.accountHolderName).toBe('Account holder name is required');
	});

	it('returns the first validation error', () => {
		expect(firstValidationError({ accountNumber: 'bad number' })).toBe('bad number');
	});
});

describe('buildAddOrganizationBankRequest', () => {
	it('maps UI fields to upstream bank payload', () => {
		const parsed = v.parse(AddBankFormBodySchema, {
			...validBank,
			ifscCode: 'hdfc0001234'
		});
		expect(buildAddOrganizationBankRequest(parsed)).toEqual({
			accountNumber: '123456789012',
			accountType: 'CURRENT',
			bankName: 'HDFC Bank',
			branchName: 'MG Road',
			holderName: 'Acme Operations',
			ifscCode: 'HDFC0001234',
			status: 'ACTIVE'
		});
	});
});
