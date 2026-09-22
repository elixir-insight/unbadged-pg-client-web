import { describe, expect, it } from 'vitest';
import { GST_STATE_CODES, gstinStateName } from './gst-states';
import {
	allRequiredComplete,
	bankDetailsAreComplete,
	directorsAreComplete,
	isCinValid,
	isIdentityComplete,
	isProfileComplete,
	isStepDataComplete,
	isValidAadhaar,
	isValidGstin,
	isValidPan,
	isValidRegisteredYear,
	maskAccountNumber,
	requiredDocumentsUploaded
} from './validation';
import { parseEntityType, type OnboardingFormData } from '$lib/types/onboarding';

const address = {
	line1: '12 Business Park',
	line2: '',
	city: 'Bengaluru',
	state: 'KA',
	pincode: '560001'
};

function validForm(): OnboardingFormData {
	return {
		businessPan: 'ABCDE1234F',
		entityType: 'private_limited',
		entityName: 'Private Limited',
		gstin: '27ABCDE1234F1Z5',
		gstinList: [],
		businessDetails: {
			companyType: 'Private Limited',
			cin: 'U12345KA2018PTC123456',
			tan: '',
			industry: 'Retail',
			registeredYear: 2018,
			communicationAddress: '12 Business Park, Bengaluru',
			address: { ...address },
			phone: '9876543210',
			website: 'https://acme.test',
			brandName: 'Acme'
		},
		bankDetails: {
			accountHolderName: 'Acme',
			accountNumber: '123456789012',
			confirmAccountNumber: '123456789012',
			ifscCode: 'HDFC0000123',
			bankName: 'HDFC Bank',
			branchName: 'Fort',
			accountType: 'CURRENT'
		},
		directors: [
			{
				name: 'Ada',
				pan: 'PQRST2345P',
				aadhaar: '234567890123',
				email: 'ada@acme.test',
				phone: '9876543211'
			}
		],
		documents: {
			gstCertificate: { uploaded: false, required: true },
			certificateOfIncorporation: { uploaded: false, required: true },
			shopActLicence: { uploaded: false, required: false },
			bankStatement: { uploaded: false, required: true },
			addressProof: { uploaded: false, required: true }
		}
	};
}

describe('GST state codes', () => {
	it('covers every current 2-digit code from 01 to 38', () => {
		for (let code = 1; code <= 38; code += 1) {
			const key = String(code).padStart(2, '0');
			expect(GST_STATE_CODES[key]).toBeTruthy();
		}
	});

	it('falls back for an unmapped code without throwing', () => {
		expect(gstinStateName('00ABCDE1234F1Z5')).toBe('State code 00');
	});
});

describe('field validators', () => {
	it('accepts a valid PAN and GSTIN', () => {
		expect(isValidPan('ABCDE1234F')).toBe(true);
		expect(isValidGstin('27ABCDE1234F1Z5')).toBe(true);
	});

	it('validates Aadhaar as 12 digits not starting with 0 or 1', () => {
		expect(isValidAadhaar('234567890123')).toBe(true);
		expect(isValidAadhaar('134567890123')).toBe(false);
		expect(isValidAadhaar('23456789012')).toBe(false);
	});

	it('bounds the registered year', () => {
		expect(isValidRegisteredYear(2018, 2026)).toBe(true);
		expect(isValidRegisteredYear(1799, 2026)).toBe(false);
		expect(isValidRegisteredYear(2027, 2026)).toBe(false);
		expect(isValidRegisteredYear(null, 2026)).toBe(false);
	});

	it('requires CIN only for private limited companies', () => {
		expect(isCinValid('', 'private_limited')).toBe(false);
		expect(isCinValid('', 'proprietorship')).toBe(true);
		expect(isCinValid('U12345KA2018PTC123456', 'private_limited')).toBe(true);
		expect(isCinValid('nonsense', 'llp')).toBe(false);
	});

	it('masks account numbers without revealing short values', () => {
		expect(maskAccountNumber('12')).toBe('••');
		expect(maskAccountNumber('123456789012')).toBe('••••••••9012');
	});
});

describe('step completeness', () => {
	it('accepts a fully filled form on every step', () => {
		const data = validForm();
		for (const slot of Object.values(data.documents)) slot.uploaded = true;
		expect(isIdentityComplete(data)).toBe(true);
		expect(isProfileComplete(data)).toBe(true);
		expect(bankDetailsAreComplete(data)).toBe(true);
		expect(directorsAreComplete(data)).toBe(true);
		expect(allRequiredComplete(data)).toBe(true);
	});

	it('flags identity gaps', () => {
		const data = validForm();
		data.businessDetails.industry = ' ';
		expect(isIdentityComplete(data)).toBe(false);
		expect(isStepDataComplete(1, data)).toBe(false);
	});

	it('requires the bank account type and matching account numbers', () => {
		const data = validForm();
		data.bankDetails.accountType = '';
		expect(bankDetailsAreComplete(data)).toBe(false);
		data.bankDetails.accountType = 'SAVINGS';
		data.bankDetails.confirmAccountNumber = '123456789013';
		expect(bankDetailsAreComplete(data)).toBe(false);
	});

	it('requires every director field, and at least one director', () => {
		const data = validForm();
		data.directors[0].aadhaar = '';
		expect(directorsAreComplete(data)).toBe(false);
		data.directors = [];
		expect(directorsAreComplete(data)).toBe(false);
	});

	it('blocks on required documents that have a confirmed backend field, exempting those that do not', () => {
		const { documents } = validForm();
		// gstCertificate, certificateOfIncorporation and bankStatement are required and supported.
		// addressProof is required but has no confirmed backend field yet, so it must not block.
		expect(requiredDocumentsUploaded(documents)).toBe(false);
		documents.gstCertificate.uploaded = true;
		documents.certificateOfIncorporation.uploaded = true;
		documents.bankStatement.uploaded = true;
		expect(requiredDocumentsUploaded(documents)).toBe(true);
	});

	it('accepts an injected support predicate, e.g. once more document types are confirmed', () => {
		const { documents } = validForm();
		expect(requiredDocumentsUploaded(documents, () => false)).toBe(true);
		expect(requiredDocumentsUploaded(documents, () => true)).toBe(false);
		for (const slot of Object.values(documents)) slot.uploaded = true;
		expect(requiredDocumentsUploaded(documents, () => true)).toBe(true);
	});
});

describe('entity type', () => {
	it('maps the previous combined company value to private limited', () => {
		expect(parseEntityType('company')).toBe('private_limited');
	});

	it('accepts the four current entity types', () => {
		expect(parseEntityType('proprietorship')).toBe('proprietorship');
		expect(parseEntityType('partnership')).toBe('partnership');
		expect(parseEntityType('llp')).toBe('llp');
		expect(parseEntityType('private_limited')).toBe('private_limited');
	});
});
