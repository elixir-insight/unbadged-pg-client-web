import { describe, expect, it } from 'vitest';
import {
	addressField,
	bankField,
	directorDoc,
	directorField,
	docField,
	ORGANIZATION_FIELD_MAP
} from './verificationFields';

describe('verification field names', () => {
	it('maps organization details keys to verification fieldNames', () => {
		expect(ORGANIZATION_FIELD_MAP.gstNumber).toBe('kyb.gstNumber');
		expect(ORGANIZATION_FIELD_MAP.orgTan).toBe('kyb.tan');
		expect(ORGANIZATION_FIELD_MAP.orgPan).toBe('kyb.businessPan');
		expect(ORGANIZATION_FIELD_MAP.brandName).toBe('brandName');
	});

	it('keys directors by id, never index', () => {
		expect(directorField('100107', 'pan')).toBe('directors.100107.pan');
		expect(directorField('100107', 'phoneNumber')).toBe('directors.100107.phoneNumber');
		expect(directorDoc('100107', 'aadhar')).toBe('directors.100107.documents.aadhar');
	});

	it('builds bank, document and address fieldNames', () => {
		expect(bankField('55', 'holderName')).toBe('bankAccounts.55.holderName');
		expect(docField('brDocument')).toBe('documents.brDocument');
		expect(addressField('pinCode')).toBe('addressDetails.pinCode');
	});
});
