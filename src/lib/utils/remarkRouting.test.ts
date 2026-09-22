import { describe, expect, it } from 'vitest';
import { DUMMY_REMARKED_ORG } from '$lib/components/self-onboarding/dummy-org-response';
import {
	allRoutedRemarks,
	directorRemarkIndex,
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

	it('routes brand, contact and address keys to Business profile', () => {
		expect(routeToStep('brandName')).toBe(2);
		expect(routeToStep('kyb.businessPhone')).toBe(2);
		expect(routeToStep('kyb.organizationWebsite')).toBe(2);
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

	it('routes directors[n].* to that director field', () => {
		expect(routeVerificationKey('directors[0].pan')).toEqual({
			step: 4,
			field: 'Director 1 — PAN'
		});
		expect(directorRemarkIndex('directors[2].email')).toBe(2);
	});

	it('falls back to Business profile for unknown keys', () => {
		expect(routeToStep('kyb.somethingNew')).toBe(2);
		expect(routeToStep('somethingElse')).toBe(2);
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
