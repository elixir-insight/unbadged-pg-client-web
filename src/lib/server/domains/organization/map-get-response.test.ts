import { describe, expect, it } from 'vitest';
import { mapGetOrganizationResponse } from './map-get-response';

describe('mapGetOrganizationResponse', () => {
	it('maps a create-style payload into an Organization', () => {
		const organization = mapGetOrganizationResponse(
			{
				message: 'ok',
				statusCode: 200,
				data: [
					{
						orgId: 'org_2be',
						legalCompanyName: 'Acme Pvt Ltd',
						userEmail: 'admin@acme.com',
						phoneNumber: '+919876543210',
						businessType: 'PRIVATE_LIMITED',
						profileType: 'MERCHANT'
					}
				]
			},
			'org_2be'
		);

		expect(organization).toMatchObject({
			id: 'org_2be',
			name: 'Acme Pvt Ltd',
			businessType: 'PRIVATE_LIMITED',
			category: 'MERCHANT',
			status: 'IN_PROGRESS',
			kyb: {
				legalCompanyName: 'Acme Pvt Ltd',
				businessType: 'Private Limited',
				businessPhone: '+919876543210'
			}
		});
		expect(organization?.bankAccounts).toEqual([]);
		expect(organization?.documents.length).toBeGreaterThan(0);
	});

	it('maps kyb, addressDetails, and bank accounts from nested fields', () => {
		const organization = mapGetOrganizationResponse(
			{
				statusCode: 200,
				data: {
					orgId: 'org_2be',
					legalCompanyName: 'Acme Pvt Ltd',
					businessType: 'LIMITED_LIABILITY_PARTNERSHIP',
					profileType: 'PARTNER',
					addressDetails: {
						address: '10 Park Road, Suite 100',
						city: 'Bengaluru',
						state: 'Karnataka',
						pinCode: '560001',
						country: 'India'
					},
					kyb: {
						gstNumber: '29ABCDE1234F1Z5',
						businessPan: 'ABCDE1234F',
						businessPhone: '9876543210',
						cin: '',
						tan: 'BLRR12345A',
						industry: 'Technology',
						organizationWebsite: 'https://www.example.com',
						registeredYear: 2018,
						communicationAddress: '20 Market Street, Floor 2, Bengaluru, Karnataka, 560002, India'
					},
					bankAccounts: [
						{
							accountId: 42,
							holderName: 'Acme Ops',
							accountNumber: '123456789012',
							ifscCode: 'hdfc0001234',
							bankName: 'HDFC Bank',
							branchName: 'MG Road',
							accountType: 'CURRENT',
							status: 'ACTIVE'
						}
					]
				}
			},
			'org_2be'
		);

		expect(organization?.businessType).toBe('LLP');
		expect(organization?.category).toBe('PARTNER');
		expect(organization?.addressDetails).toMatchObject({
			line1: '10 Park Road',
			line2: 'Suite 100',
			city: 'Bengaluru',
			pincode: '560001',
			country: 'India'
		});
		expect(organization?.kyb.gstin).toBe('29ABCDE1234F1Z5');
		expect(organization?.kyb.registeredYear).toBe(2018);
		expect(organization?.kyb.communicationAddress.line1).toBe('20 Market Street');
		expect(organization?.bankAccounts).toEqual([
			{
				id: '42',
				accountHolderName: 'Acme Ops',
				accountNumber: '123456789012',
				ifscCode: 'HDFC0001234',
				bankName: 'HDFC Bank',
				branch: 'MG Road',
				accountType: 'CURRENT',
				status: 'ACTIVE'
			}
		]);
	});

	it('returns null when data is missing', () => {
		expect(mapGetOrganizationResponse({ statusCode: 200, data: [] }, 'org_2be')).toBeNull();
	});
});
