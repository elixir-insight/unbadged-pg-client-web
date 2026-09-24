import { describe, expect, it } from 'vitest';
import { routeSaveErrorToStep } from './saveErrorRouting';

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
