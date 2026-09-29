import { describe, expect, it } from 'vitest';
import { pickRejectedFields, type UpdateOrganizationRequest } from './onboarding';

const payload: UpdateOrganizationRequest = {
	kyb: {
		gstNumber: '29ABCDE1234F1Z5',
		cin: '',
		tan: 'BLRA12345B',
		businessPhone: '+919876543210',
		organizationWebsite: 'https://example.com',
		industry: 'Retail',
		communicationAddress: '1 Main St, Bengaluru',
		registeredYear: 2020
	},
	addressDetails: {
		address: '1 Main St',
		address2: '',
		city: 'Bengaluru',
		state: 'Karnataka',
		country: 'India',
		pinCode: '560001'
	},
	brandName: 'Priority',
	directors: [
		{ id: 100107, name: 'Vidyasri', email: 'v@x.in', phoneNumber: '+919841656800' },
		{ id: 100108, name: 'Sharon', email: 's@x.in', phoneNumber: '+919876543211' }
	]
};

describe('pickRejectedFields', () => {
	it('sends only the rejected brand name', () => {
		expect(pickRejectedFields(payload, ['brandName'])).toEqual({ brandName: 'Priority' });
	});

	it('picks kyb, address and communication address fields', () => {
		expect(
			pickRejectedFields(payload, [
				'kyb.gstNumber',
				'addressDetails.city',
				'kyb.communicationAddress'
			])
		).toEqual({
			kyb: { gstNumber: '29ABCDE1234F1Z5', communicationAddress: '1 Main St, Bengaluru' },
			addressDetails: { city: 'Bengaluru' }
		});
	});

	it('patches directors by id or index, keeping the id', () => {
		expect(pickRejectedFields(payload, ['directors.100108.email', 'directors[0].phone'])).toEqual({
			directors: [
				{ id: 100107, phoneNumber: '+919841656800' },
				{ id: 100108, email: 's@x.in' }
			]
		});
	});

	it('is empty when nothing rejected is part of this payload', () => {
		expect(
			pickRejectedFields(payload, [
				'documents.gstCertificate',
				'kyb.businessPan',
				'bankDetails.ifscCode'
			])
		).toEqual({});
	});
});
