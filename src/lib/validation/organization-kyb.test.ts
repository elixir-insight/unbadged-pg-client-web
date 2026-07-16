import { describe, expect, it } from 'vitest';
import {
	firstValidationError,
	flattenCommunicationAddress,
	joinStreetAddress,
	validateAddressStep,
	validateLegalStep
} from './organization-kyb';

const validLegal = {
	gstin: '29ABCDE1234F1Z5',
	businessPan: 'ABCDE1234F',
	businessPhone: '9876543210',
	industry: 'Technology',
	organizationWebsite: 'https://www.example.com',
	registeredYear: 2018 as number | null,
	cin: '',
	tan: '',
	businessType: 'Partnership'
};

const validAddress = {
	line1: '10 Business Park Road',
	line2: 'Suite 100',
	city: 'Bengaluru',
	state: 'Karnataka',
	pincode: '560001',
	country: 'India'
};

describe('organization KYB validation', () => {
	it('accepts a valid legal payload', () => {
		expect(validateLegalStep(validLegal)).toEqual({});
	});

	it('rejects invalid GSTIN and PAN', () => {
		const errors = validateLegalStep({
			...validLegal,
			gstin: 'bad',
			businessPan: '123'
		});
		expect(errors.gstin).toBeTruthy();
		expect(errors.businessPan).toBeTruthy();
	});

	it('rejects invalid Indian mobile numbers', () => {
		const errors = validateLegalStep({ ...validLegal, businessPhone: '12345' });
		expect(errors.businessPhone).toContain('10-digit');
	});

	it('requires CIN for Private Limited companies', () => {
		const errors = validateLegalStep({
			...validLegal,
			businessType: 'Private Limited',
			cin: ''
		});
		expect(errors.cin).toBeTruthy();
	});

	it('validates CIN format when provided', () => {
		const errors = validateLegalStep({
			...validLegal,
			cin: 'INVALID'
		});
		expect(errors.cin).toBe('Enter a valid CIN');
	});

	it('accepts valid CIN and TAN', () => {
		expect(
			validateLegalStep({
				...validLegal,
				businessType: 'Private Limited',
				cin: 'U72900KA2018PTC100001',
				tan: 'BLRR12345A'
			})
		).toEqual({});
	});

	it('rejects out-of-range registered years', () => {
		const errors = validateLegalStep({ ...validLegal, registeredYear: 1700 });
		expect(errors.registeredYear).toBeTruthy();
	});

	it('rejects invalid websites', () => {
		const errors = validateLegalStep({ ...validLegal, organizationWebsite: 'not a url' });
		expect(errors.organizationWebsite).toBeTruthy();
	});

	it('accepts a valid address payload', () => {
		expect(
			validateAddressStep({
				registeredAddress: validAddress,
				communicationAddress: validAddress
			})
		).toEqual({});
	});

	it('rejects invalid pincode and missing country', () => {
		const errors = validateAddressStep({
			registeredAddress: { ...validAddress, pincode: '000001', country: '' },
			communicationAddress: validAddress
		});
		expect(errors['registeredAddress.pincode']).toBeTruthy();
		expect(errors['registeredAddress.country']).toBeTruthy();
	});

	it('returns the first validation error helper value', () => {
		const errors = { gstin: 'bad gstin', businessPan: 'bad pan' };
		expect(firstValidationError(errors)).toBe('bad gstin');
	});

	it('joins street and communication address strings', () => {
		expect(joinStreetAddress('Line 1', 'Line 2')).toBe('Line 1, Line 2');
		expect(joinStreetAddress('Line 1', '')).toBe('Line 1');
		expect(flattenCommunicationAddress(validAddress)).toBe(
			'10 Business Park Road, Suite 100, Bengaluru, Karnataka, 560001, India'
		);
	});
});
