import { describe, expect, it } from 'vitest';
import { buildCreateOrganizationRequest, toE164IndianPhone } from './create-organization';
import { extractOrganizationId } from '$lib/server/domains/organization/utils/extract-id';

describe('toE164IndianPhone', () => {
	it('prefixes 10-digit mobiles with +91', () => {
		expect(toE164IndianPhone('9876543210')).toBe('+919876543210');
	});

	it('keeps already-prefixed values', () => {
		expect(toE164IndianPhone('+919876543210')).toBe('+919876543210');
	});
});

describe('buildCreateOrganizationRequest', () => {
	it('maps merchant form fields to the onboard API payload', () => {
		expect(
			buildCreateOrganizationRequest({
				selectedCategory: 'Merchant',
				orgName: 'Acme Pvt Ltd',
				orgPhone: '9876543210',
				orgEmail: 'admin@acme.com',
				orgBusinessType: 'Private Limited',
				affiliateId: '',
				selectedServiceTypes: ['Pay-Ins'],
				servicePipelines: { 'Pay-Ins': 'PIPE001' }
			})
		).toEqual({
			legalCompanyName: 'Acme Pvt Ltd',
			businessType: 'PRIVATE_LIMITED',
			phoneNumber: '+919876543210',
			userEmail: 'admin@acme.com',
			profileType: 'MERCHANT',
			affiliateId: null,
			serviceTypes: [
				{
					serviceType: 'PAYIN',
					bankPipelineCodes: ['PIPE001']
				}
			]
		});
	});

	it('omits service types for partners', () => {
		expect(
			buildCreateOrganizationRequest({
				selectedCategory: 'Partner',
				orgName: 'Partner Co',
				orgPhone: '9876543210',
				orgEmail: 'partner@example.com',
				orgBusinessType: 'LLP',
				affiliateId: 'AFF-01',
				selectedServiceTypes: [],
				servicePipelines: {}
			})
		).toMatchObject({
			profileType: 'PARTNER',
			businessType: 'LIMITED_LIABILITY_PARTNERSHIP',
			affiliateId: 'AFF-01',
			serviceTypes: []
		});
	});

	it('omits service types for platforms', () => {
		expect(
			buildCreateOrganizationRequest({
				selectedCategory: 'Platform',
				orgName: 'Platform Co',
				orgPhone: '9876543210',
				orgEmail: 'platform@example.com',
				orgBusinessType: 'LLP',
				affiliateId: '',
				selectedServiceTypes: [],
				servicePipelines: {}
			})
		).toMatchObject({
			profileType: 'PLATFORM',
			serviceTypes: []
		});
	});
});

describe('extractOrganizationId', () => {
	it('reads orgId from data array (upstream success shape)', () => {
		expect(
			extractOrganizationId({
				message: 'Organization created successfully',
				statusCode: 201,
				data: [
					{
						orgId: '2bX',
						legalCompanyName: 'Lancaster LLC',
						userEmail: 'sabari@gmail.com',
						phoneNumber: '+918885753114',
						businessType: 'LIMITED_LIABILITY_PARTNERSHIP',
						profileType: 'MERCHANT'
					}
				]
			})
		).toBe('2bX');
	});

	it('reads organizationId from data object', () => {
		expect(
			extractOrganizationId({
				message: 'ok',
				statusCode: 200,
				data: { organizationId: 'ORG-123' }
			})
		).toBe('ORG-123');
	});

	it('reads string data', () => {
		expect(extractOrganizationId({ data: 'ORG-456' })).toBe('ORG-456');
	});
});
