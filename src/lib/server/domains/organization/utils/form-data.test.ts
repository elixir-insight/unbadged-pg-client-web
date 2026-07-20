import { describe, expect, it } from 'vitest';
import {
	parseBankAccountFormData,
	parseCreateOrganizationFormData,
	parseUpdateKybSectionFormData
} from '$lib/server/domains/organization/utils/form-data';
import { remapUploadFormData } from '$lib/server/domains/organization/mutations/upload-documents';

describe('parseCreateOrganizationFormData', () => {
	it('reads scalar and repeated fields from FormData', () => {
		const formData = new FormData();
		formData.set('selectedCategory', 'Merchant');
		formData.set('orgName', 'Acme Pvt Ltd');
		formData.set('orgPhone', '9876543210');
		formData.set('orgEmail', 'admin@acme.com');
		formData.set('orgBusinessType', 'Private Limited');
		formData.set('affiliateId', '');
		formData.append('selectedServiceTypes', 'Pay-Ins');
		formData.set('servicePipelines', JSON.stringify({ 'Pay-Ins': 'PIPE001' }));

		const parsed = parseCreateOrganizationFormData(formData);
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;

		expect(parsed.output).toMatchObject({
			selectedCategory: 'Merchant',
			orgName: 'Acme Pvt Ltd',
			selectedServiceTypes: ['Pay-Ins'],
			servicePipelines: { 'Pay-Ins': 'PIPE001' }
		});
	});
});

describe('parseUpdateKybSectionFormData', () => {
	it('merges section and JSON payload', () => {
		const formData = new FormData();
		formData.set('section', 'legal');
		formData.set(
			'payload',
			JSON.stringify({
				businessType: 'Private Limited',
				gstin: '27AABCU9603R1ZM',
				businessPan: 'AABCU9603R',
				businessPhone: '9876543210',
				industry: 'Technology',
				organizationWebsite: 'https://example.com',
				registeredYear: 2020,
				cin: '',
				tan: '',
				registeredAddress: {
					line1: 'Line 1',
					line2: 'Line 2',
					city: 'Mumbai',
					state: 'Maharashtra',
					pincode: '400001',
					country: 'India'
				},
				communicationAddress: {
					line1: 'Line 1',
					line2: 'Line 2',
					city: 'Mumbai',
					state: 'Maharashtra',
					pincode: '400001',
					country: 'India'
				},
				directors: []
			})
		);

		const parsed = parseUpdateKybSectionFormData(formData);
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;

		expect(parsed.output.section).toBe('legal');
		expect(parsed.output.gstin).toBe('27AABCU9603R1ZM');
	});
});

describe('parseBankAccountFormData', () => {
	it('reads bank account fields from FormData', () => {
		const formData = new FormData();
		formData.set('accountHolderName', 'Acme Pvt Ltd');
		formData.set('accountNumber', '1234567890');
		formData.set('ifscCode', 'HDFC0001234');
		formData.set('bankName', 'HDFC Bank');
		formData.set('branch', 'Mumbai');
		formData.set('accountType', 'CURRENT');
		formData.set('status', 'ACTIVE');

		const parsed = parseBankAccountFormData(formData);
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;

		expect(parsed.output.accountHolderName).toBe('Acme Pvt Ltd');
		expect(parsed.output.accountType).toBe('CURRENT');
	});
});

describe('remapUploadFormData', () => {
	it('maps UI field names to upstream document keys', () => {
		const source = new FormData();
		source.append('GST_CERTIFICATE', new File(['x'], 'gst.pdf'));

		const remapped = remapUploadFormData(source);
		expect(remapped.get('gstCertificate')).toBeInstanceOf(File);
	});
});
