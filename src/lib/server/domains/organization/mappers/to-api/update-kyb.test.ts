import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	buildUpdateOrganizationKybRequest,
	buildUpdateOrganizationSectionRequest,
	UpdateOrganizationFormBodySchema
} from './update-kyb';

const validFormBody = {
	businessType: 'Partnership',
	gstin: '29ABCDE1234F1Z5',
	businessPan: 'ABCDE1234F',
	businessPhone: '9876543210',
	industry: 'Technology',
	organizationWebsite: 'https://www.example.com',
	registeredYear: 2018,
	cin: '',
	tan: 'BLRR12345A',
	registeredAddress: {
		line1: '10 Business Park Road',
		line2: 'Suite 100',
		city: 'Bengaluru',
		state: 'Karnataka',
		pincode: '560001',
		country: 'India'
	},
	communicationAddress: {
		line1: '20 Market Street',
		line2: 'Floor 2',
		city: 'Bengaluru',
		state: 'Karnataka',
		pincode: '560002',
		country: 'India'
	}
};

describe('buildUpdateOrganizationKybRequest', () => {
	it('maps UI fields to upstream KYB update payload', () => {
		const parsed = v.parse(UpdateOrganizationFormBodySchema, validFormBody);
		const upstream = buildUpdateOrganizationKybRequest(parsed);

		expect(upstream.addressDetails).toEqual({
			address: '10 Business Park Road, Suite 100',
			city: 'Bengaluru',
			country: 'India',
			pinCode: '560001',
			state: 'Karnataka'
		});
		expect(upstream.kyb).toEqual({
			businessPan: 'ABCDE1234F',
			businessPhone: '+919876543210',
			cin: '',
			communicationAddress: '20 Market Street, Floor 2, Bengaluru, Karnataka, 560002, India',
			gstNumber: '29ABCDE1234F1Z5',
			industry: 'Technology',
			organizationWebsite: 'https://www.example.com',
			registeredYear: 2018,
			tan: 'BLRR12345A'
		});
		expect(upstream.directors).toEqual([]);
	});

	it('maps directors to upstream payload', () => {
		const parsed = v.parse(UpdateOrganizationFormBodySchema, {
			...validFormBody,
			directors: [
				{
					name: 'Jane Doe',
					pan: 'ABCDE1234F',
					email: 'jane@example.com',
					phone: '9876543210',
					aadhar: '2345 6789 0123'
				}
			]
		});
		const upstream = buildUpdateOrganizationKybRequest(parsed);

		expect(upstream.directors).toEqual([
			{
				aadhar: '234567890123',
				email: 'jane@example.com',
				name: 'Jane Doe',
				pan: 'ABCDE1234F',
				phoneNumber: '+919876543210'
			}
		]);
	});

	it('includes persisted director ids and omits client draft ids', () => {
		const upstream = buildUpdateOrganizationSectionRequest({
			section: 'directors',
			...validFormBody,
			directors: [
				{
					id: '7',
					name: 'Jane Doe',
					pan: '**********',
					email: 'jane@example.com',
					phone: '9876543210',
					aadhar: '************'
				},
				{
					id: 'director-123',
					name: 'New Director',
					pan: 'ABCDE1234F',
					email: 'new@example.com',
					phone: '9876543211',
					aadhar: '234567890123'
				}
			]
		});

		expect(upstream.directors).toEqual([
			{
				id: 7,
				email: 'jane@example.com',
				name: 'Jane Doe',
				phoneNumber: '+919876543210'
			},
			{
				aadhar: '234567890123',
				email: 'new@example.com',
				name: 'New Director',
				pan: 'ABCDE1234F',
				phoneNumber: '+919876543211'
			}
		]);
	});

	it('accepts director phone numbers with +91 prefix', () => {
		const parsed = v.parse(UpdateOrganizationFormBodySchema, {
			...validFormBody,
			directors: [
				{
					name: 'Jane Doe',
					pan: 'ABCDE1234F',
					email: 'jane@example.com',
					phone: '+91 9710000002',
					aadhar: '234567890123'
				}
			]
		});
		const upstream = buildUpdateOrganizationKybRequest(parsed);

		expect(upstream.directors[0]?.phoneNumber).toBe('+919710000002');
	});

	it('uppercases GSTIN and PAN on parse', () => {
		const parsed = v.parse(UpdateOrganizationFormBodySchema, {
			...validFormBody,
			gstin: '29abcde1234f1z5',
			businessPan: 'abcde1234f'
		});
		expect(parsed.gstin).toBe('29ABCDE1234F1Z5');
		expect(parsed.businessPan).toBe('ABCDE1234F');
	});

	it('requires CIN when business type is Private Limited', () => {
		const parsed = v.parse(UpdateOrganizationFormBodySchema, {
			...validFormBody,
			businessType: 'Private Limited',
			cin: ''
		});
		expect(() => buildUpdateOrganizationKybRequest(parsed)).toThrow();
	});

	it('builds a legal section request without requiring address fields', () => {
		const upstream = buildUpdateOrganizationSectionRequest({
			section: 'legal',
			businessType: 'Partnership',
			gstin: '29ABCDE1234F1Z5',
			businessPan: 'ABCDE1234F',
			businessPhone: '9876543210',
			industry: 'Technology',
			organizationWebsite: 'https://www.example.com',
			registeredYear: 2018,
			cin: '',
			tan: '',
			registeredAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			communicationAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			directors: []
		});

		expect(upstream.directors).toEqual([]);
		expect(upstream.kyb.gstNumber).toBe('29ABCDE1234F1Z5');
		expect(upstream.addressDetails.city).toBe('');
		expect(upstream.kyb).not.toHaveProperty('brandName');
	});

	it('does not require director Aadhar when saving the legal section', () => {
		const upstream = buildUpdateOrganizationSectionRequest({
			section: 'legal',
			...validFormBody,
			category: 'PARTNER',
			brandName: 'NexaPay',
			registeredAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			communicationAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			directors: [
				{
					name: 'Jane Doe',
					pan: '**********',
					email: 'jane@example.com',
					phone: '9876543210',
					aadhar: ''
				}
			]
		});

		expect(upstream.directors).toEqual([]);
		expect(upstream.brandName).toBe('NexaPay');
		expect(upstream.kyb).not.toHaveProperty('brandName');
	});

	it('omits a redacted business PAN so GET masking is not saved back', () => {
		const upstream = buildUpdateOrganizationSectionRequest({
			section: 'legal',
			...validFormBody,
			businessPan: '**********',
			registeredAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			communicationAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			directors: []
		});

		expect(upstream.kyb).not.toHaveProperty('businessPan');
	});

	it('includes brand name on partner legal updates', () => {
		const upstream = buildUpdateOrganizationSectionRequest({
			section: 'legal',
			businessType: 'Partnership',
			gstin: '29ABCDE1234F1Z5',
			businessPan: 'ABCDE1234F',
			businessPhone: '9876543210',
			industry: 'Technology',
			organizationWebsite: 'https://www.example.com',
			registeredYear: 2018,
			cin: '',
			tan: '',
			category: 'PARTNER',
			brandName: 'Lumen Health',
			registeredAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			communicationAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			directors: []
		});

		expect(upstream.brandName).toBe('Lumen Health');
		expect(upstream.kyb).not.toHaveProperty('brandName');
	});

	it('includes brand name on platform legal updates', () => {
		const upstream = buildUpdateOrganizationSectionRequest({
			section: 'legal',
			...validFormBody,
			category: 'PLATFORM',
			brandName: 'NexaPay',
			registeredAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			communicationAddress: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				pincode: '',
				country: ''
			},
			directors: []
		});

		expect(upstream.brandName).toBe('NexaPay');
	});

	it('rejects a missing brand name on partner legal updates', () => {
		expect(() =>
			buildUpdateOrganizationSectionRequest({
				section: 'legal',
				...validFormBody,
				category: 'PARTNER',
				brandName: '',
				directors: []
			})
		).toThrow();
	});

	it('builds an address section request with validated addresses', () => {
		const upstream = buildUpdateOrganizationSectionRequest({
			section: 'address',
			...validFormBody,
			directors: []
		});

		expect(upstream.addressDetails.city).toBe('Bengaluru');
		expect(upstream.directors).toEqual([]);
	});
});
