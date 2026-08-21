import { afterEach, describe, expect, it } from 'vitest';
import { organizations } from '$lib/data/mockData';
import {
	applyMockBankAccount,
	applyMockDocumentUploads,
	applyMockKybSection,
	ensureUiOnlyMockOrganization,
	isUiOnlyMockOrganization
} from './mock-platform-onboarding';

const createdIds: string[] = [];

afterEach(() => {
	for (const id of createdIds) {
		const index = organizations.findIndex((organization) => organization.id === id);
		if (index >= 0) organizations.splice(index, 1);
	}
	createdIds.length = 0;
});

describe('mock platform onboarding', () => {
	it('creates and recognizes a UI-only platform organization', () => {
		const organization = ensureUiOnlyMockOrganization('ORG_plt1', { name: 'Nexa Platform' });
		createdIds.push(organization.id);

		expect(organization.category).toBe('PLATFORM');
		expect(organization.documents.some((document) => document.documentType === 'Brand logo')).toBe(
			true
		);
		expect(isUiOnlyMockOrganization(organization.id)).toBe(true);
		expect(isUiOnlyMockOrganization('ORG-1000')).toBe(false);
	});

	it('persists legal KYB fields including brand name', () => {
		const organization = ensureUiOnlyMockOrganization('ORG_plt2', { name: 'Nexa Platform' });
		createdIds.push(organization.id);

		applyMockKybSection(organization, {
			section: 'legal',
			businessType: 'Private Limited',
			gstin: '29ABCDE1234F1Z5',
			businessPan: 'ABCDE1234F',
			businessPhone: '9876543210',
			industry: 'Technology',
			organizationWebsite: 'https://nexa.example.com',
			registeredYear: 2020,
			cin: 'U72900KA2020PTC123456',
			tan: 'BLRR12345A',
			brandName: 'NexaPay',
			category: 'PLATFORM',
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

		expect(organization.kyb.brandName).toBe('NexaPay');
		expect(organization.kyb.gstin).toBe('29ABCDE1234F1Z5');
		expect(organization.kybStatus).toBe('IN_PROGRESS');
	});

	it('marks brand logo as uploaded from mock form data', () => {
		const organization = ensureUiOnlyMockOrganization('ORG_plt3', { name: 'Nexa Platform' });
		createdIds.push(organization.id);

		const formData = new FormData();
		formData.append('BRAND_LOGO', new File(['logo'], 'brand.png', { type: 'image/png' }));
		applyMockDocumentUploads(organization, formData);

		const brandLogo = organization.documents.find(
			(document) => document.documentType === 'Brand logo'
		);
		expect(brandLogo?.status).toBe('Uploaded');
		expect(brandLogo?.fileName).toBe('brand.png');
	});

	it('adds a mock bank account without an API id', () => {
		const organization = ensureUiOnlyMockOrganization('ORG_plt4', { name: 'Nexa Platform' });
		createdIds.push(organization.id);

		const accountId = applyMockBankAccount(organization, {
			accountHolderName: 'Nexa Platform',
			accountNumber: '12345678901',
			ifscCode: 'HDFC0001234',
			bankName: 'HDFC Bank',
			branch: 'Koramangala',
			accountType: 'CURRENT',
			status: 'ACTIVE'
		});

		expect(accountId).toMatch(/^bank-/);
		expect(
			organization.bankAccounts.some((account) => account.accountNumber === '12345678901')
		).toBe(true);
	});
});
