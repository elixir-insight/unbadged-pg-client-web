import { describe, expect, it } from 'vitest';
import { DUMMY_REMARKED_ORG } from '$lib/components/self-onboarding/dummy-org-response';
import {
	allRoutedRemarks,
	bankFieldRemark,
	bankRemarkAccountId,
	directorDocumentRemark,
	directorFieldRemark,
	directorRemarkId,
	directorRemarkIndex,
	organizationDocumentRemark,
	remarkDocument,
	remarksForStep,
	routeToStep,
	routeVerificationKey
} from './remarkRouting';

describe('routeVerificationKey', () => {
	it('routes kyb.businessPan to Business identity', () => {
		expect(routeVerificationKey('kyb.businessPan')).toEqual({ step: 1, field: 'Business PAN' });
	});

	it('routes identity kyb fields to step 1', () => {
		expect(routeToStep('kyb.gstNumber')).toBe(1);
		expect(routeToStep('kyb.cin')).toBe(1);
		expect(routeToStep('kyb.industry')).toBe(1);
		expect(routeToStep('kyb.registeredYear')).toBe(1);
		expect(routeVerificationKey('kyb.cin')).toEqual({ step: 1, field: 'CIN' });
	});

	it('routes tan aliases to step 1', () => {
		expect(routeToStep('kyb.tan')).toBe(1);
		expect(routeToStep('orgTan')).toBe(1);
		expect(routeVerificationKey('kyb.tan').field).toBe('TAN');
	});

	it('routes brand, phone and website keys to Tax and registration', () => {
		expect(routeToStep('brandName')).toBe(1);
		expect(routeToStep('kyb.businessPhone')).toBe(1);
		expect(routeToStep('kyb.organizationWebsite')).toBe(1);
	});

	it('routes communication and registered address keys to Business profile', () => {
		expect(routeVerificationKey('kyb.communicationAddress')).toEqual({
			step: 2,
			field: 'Communication address'
		});
		expect(routeVerificationKey('addressDetails.city')).toEqual({ step: 2, field: 'City' });
		expect(routeVerificationKey('addressDetails.pinCode').field).toBe('Pincode');
	});

	it('routes bankDetails keys to Bank details', () => {
		expect(routeVerificationKey('bankDetails.ifscCode')).toEqual({ step: 3, field: 'IFSC' });
	});

	it('routes management bankAccounts.{id}.* keys to Bank details', () => {
		expect(routeVerificationKey('bankAccounts.55.ifscCode')).toEqual({ step: 3, field: 'IFSC' });
		expect(routeVerificationKey('bankAccounts.55.holderName')).toEqual({
			step: 3,
			field: 'Account holder name'
		});
		expect(bankRemarkAccountId('bankAccounts.55.ifscCode')).toBe('55');
	});

	it('routes directors[n].* to that director field', () => {
		expect(routeVerificationKey('directors[0].pan')).toEqual({
			step: 4,
			field: 'Director 1 — PAN'
		});
		expect(directorRemarkIndex('directors[2].email')).toBe(2);
	});

	it('routes management directors.{id}.* keys to the directors step', () => {
		expect(routeVerificationKey('directors.100107.pan')).toEqual({
			step: 4,
			field: 'Director — PAN'
		});
		expect(routeToStep('directors.100107.email')).toBe(4);
		expect(directorRemarkId('directors.100107.pan')).toBe('100107');
	});

	it('falls back to Business profile for unknown keys', () => {
		expect(routeToStep('kyb.somethingNew')).toBe(2);
		expect(routeToStep('somethingElse')).toBe(2);
	});
});

describe('management ↔ merchant remark lookup', () => {
	it('resolves bank remarks from bankAccounts.{id}.* and holderName alias', () => {
		const verifications = {
			'bankAccounts.55.ifscCode': 'IFSC mismatch',
			'bankAccounts.55.holderName': 'Wrong holder'
		};
		expect(bankFieldRemark(verifications, 55, 'ifscCode')).toMatchObject({
			key: 'bankAccounts.55.ifscCode',
			message: 'IFSC mismatch',
			step: 3
		});
		expect(bankFieldRemark(verifications, 55, 'accountHolderName')).toMatchObject({
			key: 'bankAccounts.55.holderName',
			message: 'Wrong holder'
		});
		expect(bankFieldRemark(verifications, 99, 'ifscCode')).toBeUndefined();
	});

	it('resolves director remarks from directors.{id}.* including docs', () => {
		const verifications = {
			'directors.100107.pan': 'PAN unclear',
			'directors.100107.documents.aadhar': 'Blurry Aadhaar'
		};
		expect(directorFieldRemark(verifications, 0, 100107, 'pan')).toMatchObject({
			key: 'directors.100107.pan',
			message: 'PAN unclear',
			step: 4
		});
		expect(directorDocumentRemark(verifications, 0, 'aadhar', 100107)).toMatchObject({
			key: 'directors.100107.documents.aadhar',
			message: 'Blurry Aadhaar'
		});
		expect(directorFieldRemark(verifications, 0, 999, 'pan')).toBeUndefined();
	});

	it('still resolves legacy bankDetails and directors[n] keys', () => {
		const verifications = {
			'bankDetails.ifscCode': 'Legacy IFSC',
			'directors[1].email': 'Bad email'
		};
		expect(bankFieldRemark(verifications, undefined, 'ifscCode')?.message).toBe('Legacy IFSC');
		expect(directorFieldRemark(verifications, 1, undefined, 'email')?.message).toBe('Bad email');
	});
});

describe('dummy remarked org fixture', () => {
	it('routes the sample verifications to Identity and Bank', () => {
		const remarks = allRoutedRemarks(DUMMY_REMARKED_ORG.verifications);
		expect(remarks).toHaveLength(2);
		expect(remarks[0]).toMatchObject({
			key: 'kyb.cin',
			step: 1,
			field: 'CIN',
			message: 'Not Clear'
		});
		expect(remarks[1]).toMatchObject({ key: 'bankDetails.ifscCode', step: 3 });
	});

	it('filters remarks by step', () => {
		expect(remarksForStep(DUMMY_REMARKED_ORG.verifications, 3)).toHaveLength(1);
		expect(remarksForStep(DUMMY_REMARKED_ORG.verifications, 4)).toHaveLength(0);
	});
});

describe('document remarks', () => {
	it('routes a director KYC document remark to that director on the directors step', () => {
		expect(routeVerificationKey('directors[0].panDocument')).toEqual({
			step: 4,
			field: 'Director 1 — PAN card'
		});
		expect(remarkDocument('directors[1].aadharCard')).toEqual({
			kind: 'director',
			index: 1,
			directorId: null,
			field: 'aadhar'
		});
	});

	it('routes management director document keys', () => {
		expect(routeVerificationKey('directors.100107.documents.pan')).toEqual({
			step: 4,
			field: 'Director — PAN card'
		});
		expect(remarkDocument('directors.100107.documents.aadhar')).toEqual({
			kind: 'director',
			index: null,
			directorId: '100107',
			field: 'aadhar'
		});
	});

	it('keeps director number fields as fields, not documents', () => {
		expect(remarkDocument('directors[0].pan')).toBeNull();
		expect(remarkDocument('directors[0].aadhar')).toBeNull();
		expect(remarkDocument('directors.100107.pan')).toBeNull();
	});

	it('routes org document remarks to the documents step, bare or under documents.', () => {
		expect(routeVerificationKey('gstCertificate')).toEqual({ step: 5, field: 'GST certificate' });
		expect(routeVerificationKey('documents.voidedCheque')).toEqual({
			step: 5,
			field: 'Cancelled cheque'
		});
		expect(remarkDocument('electricityBill')).toMatchObject({
			kind: 'organization',
			key: 'addressProof'
		});
	});

	it('keeps kyb.businessPan (the number) on step 1 and businessPan (the card) on step 5', () => {
		expect(routeToStep('kyb.businessPan')).toBe(1);
		expect(routeToStep('businessPan')).toBe(5);
	});

	it('finds the remark for one slot', () => {
		const verifications = {
			'directors[0].panDocument': 'Invalid document',
			gstCertificate: 'Expired',
			'kyb.cin': 'Not Clear'
		};
		expect(directorDocumentRemark(verifications, 0, 'pan')?.message).toBe('Invalid document');
		expect(directorDocumentRemark(verifications, 0, 'aadhar')).toBeUndefined();
		expect(directorDocumentRemark(verifications, 1, 'pan')).toBeUndefined();
		expect(organizationDocumentRemark(verifications, 'gstCertificate')?.key).toBe('gstCertificate');
		expect(organizationDocumentRemark(verifications, 'aoa')).toBeUndefined();
	});
});
