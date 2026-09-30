import { describe, expect, it } from 'vitest';
import { mapSaveError, routeSaveErrorToStep } from './saveErrorRouting';

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

describe('mapSaveError', () => {
	it('marks the one identity field an error names', () => {
		expect(mapSaveError('Invalid GST Format', { currentStep: 1 })).toEqual({
			step: 1,
			fields: ['kyb.gstNumber']
		});
		expect(mapSaveError('CIN format is invalid').fields).toEqual(['kyb.cin']);
		expect(mapSaveError('Website is unreachable').fields).toEqual(['kyb.organizationWebsite']);
	});

	it('marks both GSTIN and TAN for the duplicate-registration error', () => {
		expect(
			mapSaveError('GST number or TAN is already registered to another organization', {
				currentStep: 1
			})
		).toEqual({ step: 1, fields: ['kyb.gstNumber', 'kyb.tan'] });
	});

	it('leaves an error naming no field at step level', () => {
		expect(mapSaveError('Something went wrong. Please try again.', { currentStep: 2 })).toEqual({
			step: null,
			fields: []
		});
	});

	it('marks registered address fields, or the communication ones while "Same as" is ticked', () => {
		expect(mapSaveError('Invalid pincode', { currentStep: 2 }).fields).toEqual([
			'addressDetails.pinCode'
		]);
		expect(
			mapSaveError('City and state are required', { currentStep: 2, sameAsCommunication: true })
				.fields
		).toEqual(['kyb.communicationAddress.city', 'kyb.communicationAddress.state']);
		expect(mapSaveError('Communication address is required', { currentStep: 2 }).fields).toEqual([
			'kyb.communicationAddress'
		]);
	});

	it("marks the director the message quotes, and only that director's field", () => {
		const directors = [
			{ name: 'Ada', email: 'ada@x.test', pan: 'PQRST2345P', phone: '9876543210' },
			{ name: 'Bo', email: 'bo@x.test', pan: 'PQRST2345Q', phone: '9876543211' }
		];
		expect(
			mapSaveError('Director email bo@x.test already exists', { currentStep: 4, directors })
		).toEqual({ step: 4, fields: ['directors[1].email'] });
		// Can't tell which of two directors — step level.
		expect(mapSaveError('Invalid PAN', { currentStep: 4, directors }).fields).toEqual([]);
		expect(
			mapSaveError('Invalid PAN', { currentStep: 4, directors: [directors[0]] }).fields
		).toEqual(['directors[0].pan']);
	});

	it('does not mark an identity field for a director or bank error', () => {
		expect(mapSaveError('Director PAN is invalid').fields).toEqual([]);
		expect(mapSaveError('Bank account PAN mismatch')).toEqual({ step: 3, fields: [] });
	});

	it('sends the missing-documents submit error to the documents step, not the TAN field', () => {
		const message =
			'required onboarding documents are incomplete: business TAN, articles of association, memorandum of association';
		expect(mapSaveError(message, { currentStep: 6 })).toEqual({ step: 5, fields: [] });
	});

	it("uses the backend's field key when it sends one", () => {
		expect(mapSaveError('Already taken', { field: 'kyb.tan' })).toEqual({
			step: 1,
			fields: ['kyb.tan']
		});
		expect(
			mapSaveError('Invalid', { field: 'addressDetails.city', sameAsCommunication: true })
		).toEqual({ step: 2, fields: ['kyb.communicationAddress.city'] });
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
		expect(mapSaveError(message, { currentStep: 6 }).fields).toEqual(['brandName']);
	});
});
