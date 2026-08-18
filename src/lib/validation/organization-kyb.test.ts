import { describe, expect, it } from 'vitest';
import {
	addressStepFieldsEqual,
	directorsStepFieldsEqual,
	firstValidationError,
	flattenCommunicationAddress,
	joinStreetAddress,
	legalStepFieldsEqual,
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

	it('does not require brand name for merchants', () => {
		expect(validateLegalStep({ ...validLegal, category: 'MERCHANT', brandName: '' })).toEqual({});
	});

	it('requires a valid brand name for partners', () => {
		expect(validateLegalStep({ ...validLegal, category: 'PARTNER', brandName: '' }).brandName).toBe(
			'Brand name is required'
		);
		expect(
			validateLegalStep({ ...validLegal, category: 'PARTNER', brandName: '@@@' }).brandName
		).toBe('Enter a valid brand name');
		expect(
			validateLegalStep({ ...validLegal, category: 'PARTNER', brandName: 'Lumen Health' })
		).toEqual({});
	});

	it('requires a valid brand name for platforms', () => {
		expect(
			validateLegalStep({ ...validLegal, category: 'PLATFORM', brandName: '' }).brandName
		).toBe('Brand name is required');
		expect(
			validateLegalStep({ ...validLegal, category: 'PLATFORM', brandName: 'NexaPay' })
		).toEqual({});
	});

	it('accepts business PAN with spaces and lowercase', () => {
		expect(validateLegalStep({ ...validLegal, businessPan: 'abcde 1234 f' })).toEqual({});
	});

	it('accepts a redacted business PAN returned from GET details', () => {
		expect(validateLegalStep({ ...validLegal, businessPan: '**********' })).toEqual({});
	});

	it('still rejects a partially edited masked PAN', () => {
		expect(
			validateLegalStep({ ...validLegal, businessPan: '*********F' }).businessPan
		).toBeTruthy();
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

	it('accepts Indian mobile numbers with +91 prefix', () => {
		expect(validateLegalStep({ ...validLegal, businessPhone: '+91 9876543210' })).toEqual({});
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

	it('treats legal fields as equal when phone formatting differs after GET', () => {
		expect(
			legalStepFieldsEqual(validLegal, {
				...validLegal,
				businessPhone: '+91 9876543210'
			})
		).toBe(true);
		expect(
			legalStepFieldsEqual(validLegal, {
				...validLegal,
				businessPan: 'abcde1234f'
			})
		).toBe(true);
	});

	it('detects legal field changes', () => {
		expect(
			legalStepFieldsEqual(validLegal, {
				...validLegal,
				gstin: '29ABCDE1234F1Z6'
			})
		).toBe(false);
	});

	it('treats address fields as equal when same-as-registered is unchanged', () => {
		expect(
			addressStepFieldsEqual(
				{ registeredAddress: validAddress, communicationAddress: validAddress },
				{ registeredAddress: validAddress, communicationAddress: validAddress },
				true,
				true
			)
		).toBe(true);
	});

	it('detects address changes and same-as-registered toggles', () => {
		expect(
			addressStepFieldsEqual(
				{ registeredAddress: validAddress, communicationAddress: validAddress },
				{
					registeredAddress: validAddress,
					communicationAddress: { ...validAddress, city: 'Mumbai' }
				},
				false,
				false
			)
		).toBe(false);
		expect(
			addressStepFieldsEqual(
				{ registeredAddress: validAddress, communicationAddress: validAddress },
				{ registeredAddress: validAddress, communicationAddress: validAddress },
				true,
				false
			)
		).toBe(false);
	});

	it('treats director fields as equal when formatting differs after GET', () => {
		const directors = [
			{
				name: 'Jane Doe',
				pan: 'ABCDE1234F',
				email: 'jane@example.com',
				phone: '9876543210',
				aadhar: '2345 6789 0123'
			}
		];
		expect(
			directorsStepFieldsEqual(directors, [
				{
					...directors[0],
					phone: '+919876543210',
					aadhar: '234567890123'
				}
			])
		).toBe(true);
	});
});
