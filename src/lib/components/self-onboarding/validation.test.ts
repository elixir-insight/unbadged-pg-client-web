import { describe, expect, it } from 'vitest';
import { GST_STATE_CODES, gstinStateName } from './gst-states';
import { flooredProgressPercent, STEPS } from './steps';
import { allRequiredComplete, isValidGstin, isValidPan, maskAccountNumber } from './validation';
import { parseEntityType, type OnboardingFormData } from '$lib/types/onboarding';

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

describe('progress floor', () => {
	it('never shows 0% on step 1', () => {
		expect(flooredProgressPercent(0, 1)).toBe(Math.round(100 / STEPS.length));
	});

	it('does not floor later steps', () => {
		expect(flooredProgressPercent(0, 2)).toBe(0);
		expect(flooredProgressPercent(14, 3)).toBe(14);
	});
});

describe('onboarding validation', () => {
	it('accepts a valid PAN and GSTIN', () => {
		expect(isValidPan('ABCDE1234F')).toBe(true);
		expect(isValidGstin('27ABCDE1234F1Z5')).toBe(true);
	});

	it('masks account numbers without revealing short values', () => {
		expect(maskAccountNumber('12')).toBe('••');
		expect(maskAccountNumber('123456789012')).toBe('••••••••9012');
	});

	it('rejects submit when required documents are missing', () => {
		const data = {
			businessPan: 'ABCDE1234F',
			entityType: 'private_limited',
			entityName: 'Private Limited',
			gstin: '27ABCDE1234F1Z5',
			gstinList: [],
			businessDetails: {
				companyName: 'Acme',
				companyType: 'Private Limited Company',
				cin: '',
				address: { line1: '', line2: '', city: '', state: '', pincode: '' },
				currentAddress: { line1: '', line2: '', city: '', state: '', pincode: '' },
				currentAddressSameAsContact: false,
				phone: '',
				email: '',
				website: '',
				brandName: ''
			},
			bankDetails: {
				accountHolderName: 'Acme',
				accountNumber: '123456789012',
				confirmAccountNumber: '123456789012',
				ifscCode: 'HDFC0000123',
				bankName: 'HDFC Bank',
				branchName: 'Fort'
			},
			directors: [{ name: 'Ada', pan: 'PQRST2345P', status: 'pending' }],
			documents: {
				gstCertificate: { uploaded: true, required: true },
				panCardCopy: { uploaded: true, required: true },
				certificateOfIncorporation: { uploaded: false, required: true },
				shopActLicence: { uploaded: false, required: false },
				bankStatement: { uploaded: true, required: true },
				addressProof: { uploaded: true, required: true }
			}
		} satisfies OnboardingFormData;

		expect(allRequiredComplete(data)).toBe(false);
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
