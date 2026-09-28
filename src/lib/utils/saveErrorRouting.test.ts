import { describe, expect, it } from 'vitest';
import { routeSaveErrorToField, routeSaveErrorToStep } from './saveErrorRouting';

describe('routeSaveErrorToStep', () => {
	it('routes the reported GST/TAN conflict to the identity step', () => {
		expect(
			routeSaveErrorToStep('GST number or TAN is already registered to another organization')
		).toBe(1);
	});

	it('routes other identity fields (PAN, CIN, industry, registered year, brand, website, phone)', () => {
		expect(routeSaveErrorToStep('This PAN is already registered')).toBe(1);
		expect(routeSaveErrorToStep('CIN format is invalid')).toBe(1);
		expect(routeSaveErrorToStep('Industry is not recognised')).toBe(1);
		expect(routeSaveErrorToStep('Registered year cannot be in the future')).toBe(1);
		expect(routeSaveErrorToStep('Brand name is already taken')).toBe(1);
		expect(routeSaveErrorToStep('Website is unreachable')).toBe(1);
		expect(routeSaveErrorToStep('Business phone is invalid')).toBe(1);
	});

	it('routes contact/address fields to the profile step', () => {
		expect(routeSaveErrorToStep('Business email is already in use')).toBe(2);
		expect(routeSaveErrorToStep('Communication address is incomplete')).toBe(2);
	});

	it('routes bank fields to the bank step', () => {
		expect(routeSaveErrorToStep('IFSC code not found')).toBe(3);
		expect(routeSaveErrorToStep('Bank account number already linked to another org')).toBe(3);
	});

	it('routes director fields to the directors step ahead of a bare "account" match', () => {
		expect(routeSaveErrorToStep('Director Aadhaar does not match PAN records')).toBe(4);
	});

	it('returns null for a message that names no known field', () => {
		expect(routeSaveErrorToStep('Something went wrong. Please try again.')).toBeNull();
	});
});

describe('routeSaveErrorToField', () => {
	it('pins an error naming one identity field to that field', () => {
		expect(routeSaveErrorToField('Invalid GST Format')).toBe('kyb.gstNumber');
		expect(routeSaveErrorToField('CIN format is invalid')).toBe('kyb.cin');
		expect(routeSaveErrorToField('Website is unreachable')).toBe('kyb.organizationWebsite');
	});

	it('leaves errors naming several fields, or none, at step level', () => {
		expect(
			routeSaveErrorToField('GST number or TAN is already registered to another organization')
		).toBeNull();
		expect(routeSaveErrorToField('Something went wrong')).toBeNull();
	});

	it('does not pin a director or bank error to an identity field', () => {
		expect(routeSaveErrorToField('Director PAN is invalid')).toBeNull();
		expect(routeSaveErrorToField('Bank account PAN mismatch')).toBeNull();
	});
});

describe('routeSaveErrorToStep from the step that saved', () => {
	it('keeps a PAN/email/phone error from the directors save on the directors step', () => {
		expect(routeSaveErrorToStep('Invalid PAN', 4)).toBe(4);
		expect(routeSaveErrorToStep('Email already exists', 4)).toBe(4);
		expect(routeSaveErrorToStep('Phone number is invalid', 4)).toBe(4);
	});

	it('still sends an error about another step there', () => {
		expect(routeSaveErrorToStep('Invalid GST Format', 4)).toBe(1);
		expect(routeSaveErrorToStep('Invalid PAN', 2)).toBe(1);
		expect(routeSaveErrorToStep('Company name is required', 4)).toBe(2);
	});
});

describe('brand name', () => {
	it('routes the backend submit error to the brand name field on step 1', () => {
		const message = 'required organization fields are incomplete: brandName';
		expect(routeSaveErrorToStep(message, 6)).toBe(1);
		expect(routeSaveErrorToField(message)).toBe('brandName');
	});
});
