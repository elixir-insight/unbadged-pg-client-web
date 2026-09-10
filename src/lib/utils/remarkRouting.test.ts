import { describe, expect, it } from 'vitest';
import { DUMMY_REMARKED_ORG } from '$lib/components/self-onboarding/dummy-org-response';
import {
	allRoutedRemarks,
	directorRemarkIndex,
	routeToStage,
	routeToTab,
	routeVerificationKey
} from './remarkRouting';

describe('routeVerificationKey', () => {
	it('routes kyb.businessPan to Business Details PAN', () => {
		expect(routeVerificationKey('kyb.businessPan')).toEqual({
			stage: 'business-details',
			tab: 'pan',
			field: 'Business PAN'
		});
	});

	it('routes kyb.gstNumber to Business Details GST', () => {
		expect(routeToStage('kyb.gstNumber')).toBe('business-details');
		expect(routeToTab('kyb.gstNumber')).toBe('gst');
	});

	it('routes kyb.cin to the Company tab', () => {
		expect(routeVerificationKey('kyb.cin')).toEqual({
			stage: 'business-details',
			tab: 'company',
			field: 'CIN'
		});
	});

	it('routes tan aliases to Company', () => {
		expect(routeToTab('kyb.tan')).toBe('company');
		expect(routeToTab('orgTan')).toBe('company');
		expect(routeVerificationKey('kyb.tan').field).toBe('TAN');
	});

	it('routes brandName and company kyb fields to Company', () => {
		expect(routeToTab('brandName')).toBe('company');
		expect(routeToTab('kyb.businessPhone')).toBe('company');
		expect(routeToTab('kyb.organizationWebsite')).toBe('company');
		expect(routeToTab('kyb.industry')).toBe('company');
		expect(routeToTab('kyb.registeredYear')).toBe('company');
	});

	it('routes address keys to the Address tab', () => {
		expect(routeVerificationKey('kyb.communicationAddress')).toEqual({
			stage: 'business-details',
			tab: 'address',
			field: 'Communication address'
		});
		expect(routeVerificationKey('addressDetails.city')).toEqual({
			stage: 'business-details',
			tab: 'address',
			field: 'City'
		});
		expect(routeVerificationKey('addressDetails.pinCode').field).toBe('Pincode');
	});

	it('routes dummy bankDetails keys to the Bank tab', () => {
		expect(routeVerificationKey('bankDetails.ifscCode')).toEqual({
			stage: 'account-ownership',
			tab: 'bank',
			field: 'IFSC'
		});
	});

	it('routes directors[n].* to that director field', () => {
		expect(routeVerificationKey('directors[0].pan')).toEqual({
			stage: 'account-ownership',
			tab: 'directors',
			field: 'Director 1 — PAN'
		});
		expect(directorRemarkIndex('directors[2].email')).toBe(2);
	});
});

describe('dummy remarked org fixture', () => {
	it('routes the sample verifications to Company and Bank', () => {
		const remarks = allRoutedRemarks(DUMMY_REMARKED_ORG.verifications);
		expect(remarks).toHaveLength(2);
		expect(remarks[0]).toMatchObject({
			key: 'kyb.cin',
			tab: 'company',
			stage: 'business-details',
			field: 'CIN',
			message: 'Not Clear'
		});
		expect(remarks[1]).toMatchObject({
			key: 'bankDetails.ifscCode',
			tab: 'bank',
			stage: 'account-ownership'
		});
	});
});
