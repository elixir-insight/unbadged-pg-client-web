import { describe, expect, it } from 'vitest';
import { GST_STATE_CODES, gstinStateName } from './gst-states';
import {
	allRequiredComplete,
	bankAccountsAreComplete,
	directorFieldIssues,
	directorPanError,
	directorsAreComplete,
	businessPanError,
	gstinError,
	isCinValid,
	isIdentityComplete,
	isIdentityFilled,
	isProfileComplete,
	isStepDataComplete,
	isValidAadhaar,
	isValidBusinessPan,
	isValidDirectorAadhaar,
	isValidDirectorPan,
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
		businessPan: 'ABCPE1234F',
		entityType: 'private_limited',
		entityName: 'Private Limited',
		gstin: '27ABCPE1234F1ZB',
		gstinList: [],
		businessDetails: {
			companyType: 'Private Limited',
			cin: 'U12345KA2018PTC123456',
			tan: '',
			industry: 'Retail',
			registeredYear: 2018,
			communicationAddress: { ...address },
			sameAsCommunication: false,
			address: { ...address },
			phone: '9876543210',
			website: 'https://acme.test',
			brandName: 'Acme'
		},
		bankAccounts: [
			{
				accountHolderName: 'Acme',
				accountNumber: '123456789012',
				confirmAccountNumber: '123456789012',
				ifscCode: 'HDFC0000123',
				bankName: 'HDFC Bank',
				branchName: 'Fort',
				accountType: 'CURRENT'
			}
		],
		directors: [
			{
				name: 'Ada',
				pan: 'PQRPT2345P',
				aadhaar: '234567890123',
				email: 'ada@acme.test',
				phone: '9876543211',
				aadhaarDocument: 'aadhaar.pdf',
				panDocument: 'pan.pdf'
			}
		],
		documents: {
			organizationLogo: { uploaded: false, required: true },
			gstCertificate: { uploaded: false, required: true },
			businessPanCard: { uploaded: false, required: true },
			uboDeclaration: { uploaded: false, required: true },
			boardResolution: { uploaded: false, required: true },
			businessCertificate: { uploaded: false, required: true },
			proofOfFunds: { uploaded: false, required: true },
			addressProof: { uploaded: false, required: true },
			businessTan: { uploaded: false, required: false },
			aoa: { uploaded: false, required: false },
			moa: { uploaded: false, required: false }
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
		expect(isValidGstin('27ABCPE1234F1ZB')).toBe(true);
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

describe('GSTIN — same rules as management onboarding', () => {
	it('checks the 15-character format only', () => {
		expect(gstinError('')).toBe('GSTIN is required');
		expect(gstinError('27ABC')).toBe('Enter a valid 15-character GSTIN');
		// The values from the bug report — right format, so accepted like management does.
		expect(isValidGstin('29ABCDP1234F1ZW')).toBe(true);
		expect(isValidGstin('27ABCDE1234F1Z8')).toBe(true);
	});
});

describe('business PAN — same rules as management onboarding', () => {
	it('checks the 10-character format only', () => {
		expect(businessPanError('')).toBe('Business PAN is required');
		expect(businessPanError('ABC')).toBe('Enter a valid PAN (e.g. ABCDE1234F)');
		// From the bug report: 4th character D is no longer rejected.
		expect(isValidBusinessPan('ABCDP1234F')).toBe(true);
		expect(isValidBusinessPan('ABCPE1234F')).toBe(true);
	});
});

describe('masked values from the saved organization', () => {
	it('treats a masked PAN / Aadhaar as already saved', () => {
		expect(isValidBusinessPan('**********')).toBe(true);
		expect(isValidDirectorPan('**********')).toBe(true);
		expect(isValidDirectorAadhaar('************')).toBe(true);
	});

	it('lets a resumed application with a masked business PAN pass step 1', () => {
		const data = validForm();
		data.businessPan = '**********';
		expect(isIdentityComplete(data)).toBe(true);
	});

	it('lets masked director PAN / Aadhaar pass the directors step', () => {
		const data = validForm();
		data.directors[0].pan = '**********';
		data.directors[0].aadhaar = '************';
		expect(directorsAreComplete(data)).toBe(true);
	});
});

describe('brand name', () => {
	// Backend submit: "required organization fields are incomplete: brandName".
	it('is required to finish tax and registration', () => {
		const data = validForm();
		data.businessDetails.brandName = '  ';
		expect(isIdentityFilled(data)).toBe(false);
		expect(isIdentityComplete(data)).toBe(false);
	});
});

describe('director PAN', () => {
	// The backend: "Personal PAN must be valid and have holder type P".
	it('accepts only a personal PAN (4th character P) or a saved, masked one', () => {
		expect(directorPanError('ABCPE1234F')).toBe('');
		expect(directorPanError('**********')).toBe('');
		expect(directorPanError('ABCDE1234F')).toMatch(/4th character must be P/);
		expect(directorPanError('ABCCE1234F')).toMatch(/4th character must be P/);
		expect(directorPanError('ABC12')).toBe('Enter a valid 10-character PAN.');
	});

	it('names PAN as the field to fix before documents can upload', () => {
		const director = { ...validForm().directors[0], pan: 'ABCDE1234F' };
		expect(directorFieldIssues(director)).toEqual(['PAN']);
	});
});

describe('director field issues', () => {
	it('is empty for a complete director', () => {
		expect(directorFieldIssues(validForm().directors[0])).toEqual([]);
	});

	it('names each missing or invalid field in form order', () => {
		const director = { ...validForm().directors[0], name: ' ', aadhaar: '123', phone: '12345' };
		expect(directorFieldIssues(director)).toEqual(['Name', 'Aadhaar', 'Phone']);
	});
});

describe('step completeness', () => {
	it('accepts a fully filled form on every step', () => {
		const data = validForm();
		for (const slot of Object.values(data.documents)) slot.uploaded = true;
		expect(isIdentityComplete(data)).toBe(true);
		expect(isProfileComplete(data)).toBe(true);
		expect(bankAccountsAreComplete(data)).toBe(true);
		expect(directorsAreComplete(data)).toBe(true);
		expect(allRequiredComplete(data)).toBe(true);
	});

	it('keeps the directors step incomplete until both director documents are uploaded', () => {
		const data = validForm();
		expect(isStepDataComplete(4, data)).toBe(true);
		data.directors[0].panDocument = '';
		expect(directorsAreComplete(data)).toBe(true);
		expect(isStepDataComplete(4, data)).toBe(false);
	});

	it('flags identity gaps', () => {
		const data = validForm();
		data.businessDetails.industry = ' ';
		expect(isIdentityComplete(data)).toBe(false);
		expect(isStepDataComplete(1, data)).toBe(false);
	});

	it('requires the bank account type and matching account numbers', () => {
		const data = validForm();
		data.bankAccounts[0].accountType = '';
		expect(bankAccountsAreComplete(data)).toBe(false);
		data.bankAccounts[0].accountType = 'SAVINGS';
		data.bankAccounts[0].confirmAccountNumber = '123456789013';
		expect(bankAccountsAreComplete(data)).toBe(false);
	});

	it('requires at least one bank account, and every field on each one', () => {
		const data = validForm();
		data.bankAccounts.push({
			accountHolderName: '',
			accountNumber: '',
			confirmAccountNumber: '',
			ifscCode: '',
			bankName: '',
			branchName: '',
			accountType: ''
		});
		expect(bankAccountsAreComplete(data)).toBe(false);
		data.bankAccounts = [];
		expect(bankAccountsAreComplete(data)).toBe(false);
	});

	it('requires every director field, and at least one director', () => {
		const data = validForm();
		data.directors[0].aadhaar = '';
		expect(directorsAreComplete(data)).toBe(false);
		data.directors = [];
		expect(directorsAreComplete(data)).toBe(false);
	});

	it('blocks until every required document is uploaded, ignoring optional ones', () => {
		const { documents } = validForm();
		expect(requiredDocumentsUploaded(documents)).toBe(false);
		for (const slot of Object.values(documents)) if (slot.required) slot.uploaded = true;
		// businessTan / aoa / moa are not required outside private limited.
		expect(requiredDocumentsUploaded(documents)).toBe(true);
		documents.addressProof.uploaded = false;
		expect(requiredDocumentsUploaded(documents)).toBe(false);
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
