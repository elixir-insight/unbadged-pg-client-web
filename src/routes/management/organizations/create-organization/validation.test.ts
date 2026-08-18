import { describe, expect, it } from 'vitest';
import { firstValidationError, validateCreateOrganization } from './validation';

const validBase = {
	selectedCategory: 'Merchant' as const,
	orgName: 'Acme Inc',
	orgPhone: '9876543210',
	orgEmail: 'acme@example.com',
	orgBusinessType: 'Private Limited',
	selectedServiceTypes: ['Pay-Ins'],
	servicePipelines: { 'Pay-Ins': 'HDFC Bank' }
};

describe('validateCreateOrganization', () => {
	it('returns no errors for a valid merchant payload', () => {
		expect(validateCreateOrganization(validBase)).toEqual({});
		expect(firstValidationError(validateCreateOrganization(validBase))).toBeNull();
	});

	it('returns no merchant-specific errors for a valid partner payload', () => {
		const errors = validateCreateOrganization({
			...validBase,
			selectedCategory: 'Partner',
			selectedServiceTypes: [],
			servicePipelines: {}
		});

		expect(errors).toEqual({});
	});

	it('returns no merchant-specific errors for a valid platform payload', () => {
		const errors = validateCreateOrganization({
			...validBase,
			selectedCategory: 'Platform',
			selectedServiceTypes: [],
			servicePipelines: {}
		});

		expect(errors).toEqual({});
	});

	it('requires organization name', () => {
		const errors = validateCreateOrganization({ ...validBase, orgName: '   ' });

		expect(errors.orgName).toBe('Organization name is required');
	});

	it('requires a valid email address', () => {
		const errors = validateCreateOrganization({ ...validBase, orgEmail: 'not-an-email' });

		expect(errors.orgEmail).toBe('Enter a valid email address');
	});

	it('requires at least one service type for merchants', () => {
		const errors = validateCreateOrganization({
			...validBase,
			selectedServiceTypes: [],
			servicePipelines: {}
		});

		expect(errors.serviceTypes).toBe('Select at least one service type');
	});

	it('requires a bank pipeline for each enabled merchant service type', () => {
		const errors = validateCreateOrganization({
			...validBase,
			selectedServiceTypes: ['Pay-Ins', 'Payouts'],
			servicePipelines: { 'Pay-Ins': 'HDFC Bank' }
		});

		expect(errors['bankPipeline_Payouts']).toBe('Select a bank pipeline');
	});

	it('returns the first validation error message', () => {
		const errors = validateCreateOrganization({
			...validBase,
			orgName: '',
			orgEmail: 'bad-email'
		});

		expect(firstValidationError(errors)).toBe('Organization name is required');
	});
});
