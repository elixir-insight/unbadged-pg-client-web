import { describe, expect, it } from 'vitest';
import {
	createOrganization,
	documentChoiceGroups,
	fixedRequiredDocuments,
	organizations,
	privateLimitedExtraDocuments
} from '$lib/data/mockData';
import {
	addressComplete,
	allSectionsComplete,
	bankDetailsComplete,
	directorsComplete,
	documentsComplete,
	integrationComplete,
	kybComplete,
	legalComplete,
	activationDocumentReady
} from './completeness';

describe('organization completeness', () => {
	it('marks a fully prepared merchant as complete across sections', () => {
		const org = organizations.find((candidate) => candidate.id === 'ORG-1009');
		expect(org).toBeDefined();
		if (!org) return;

		expect(legalComplete(org)).toBe(true);
		expect(addressComplete(org)).toBe(true);
		expect(directorsComplete(org)).toBe(true);
		expect(kybComplete(org)).toBe(true);
		expect(bankDetailsComplete(org)).toBe(true);
		expect(documentsComplete(org)).toBe(true);
		expect(integrationComplete(org)).toBe(true);
		expect(allSectionsComplete(org)).toBe(true);
	});

	it('treats partner integration as complete without merchant integration fields', () => {
		const org = organizations.find((candidate) => candidate.id === 'ORG-1002');
		expect(org).toBeDefined();
		if (!org) return;

		expect(integrationComplete(org)).toBe(true);
		expect(allSectionsComplete(org)).toBe(true);
	});

	it('fails bank completeness when no active account exists', () => {
		const org = organizations.find((candidate) => candidate.id === 'ORG-1014');
		expect(org).toBeDefined();
		if (!org) return;

		expect(bankDetailsComplete(org)).toBe(false);
		expect(allSectionsComplete(org)).toBe(false);
	});

	it('splits KYB completeness into legal, address, and directors checks', () => {
		const org = organizations.find((candidate) => candidate.id === 'ORG-1009');
		expect(org).toBeDefined();
		if (!org) return;

		const incompleteAddress = {
			...org,
			kyb: {
				...org.kyb,
				registeredAddress: { ...org.kyb.registeredAddress, city: '' }
			}
		};

		expect(legalComplete(incompleteAddress)).toBe(true);
		expect(addressComplete(incompleteAddress)).toBe(false);
		expect(directorsComplete(incompleteAddress)).toBe(true);
		expect(kybComplete(incompleteAddress)).toBe(false);

		const incompleteCommunication = {
			...org,
			kyb: {
				...org.kyb,
				communicationAddress: { ...org.kyb.communicationAddress, city: '' }
			}
		};

		expect(addressComplete(incompleteCommunication)).toBe(false);
		expect(kybComplete(incompleteCommunication)).toBe(false);
	});

	it('accepts any business certificate option for sole proprietorship approval docs', () => {
		const org = createOrganization({
			id: 'ORG-TEST-SOLE',
			name: 'Sole Test',
			businessType: 'SOLE_PROPRIETORSHIP',
			category: 'MERCHANT',
			status: 'IN_PROGRESS',
			kybStatus: 'Not Started',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			kybComplete: true,
			documentsComplete: true
		});

		expect(
			org.documents.some((document) => document.documentType === 'Incorporation certificate')
		).toBe(true);
		expect(org.documents.some((document) => document.documentType === 'Business TAN')).toBe(false);
		expect(documentsComplete(org)).toBe(true);

		const withUdyam = {
			...org,
			documents: org.documents
				.filter((document) => document.documentType !== 'Incorporation certificate')
				.concat({
					id: 'udyam-certificate',
					documentType: 'Udyam certificate' as const,
					fileName: 'udyam.pdf',
					uploadedDate: org.createdAt,
					status: 'Uploaded' as const
				})
		};
		expect(documentsComplete(withUdyam)).toBe(true);
	});

	it('requires private limited extras on top of fixed and choice-group docs', () => {
		const org = createOrganization({
			id: 'ORG-TEST-PL',
			name: 'Private Limited Test',
			businessType: 'PRIVATE_LIMITED',
			category: 'MERCHANT',
			status: 'IN_PROGRESS',
			kybStatus: 'Not Started',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			kybComplete: true,
			documentsComplete: true
		});

		for (const type of [
			...fixedRequiredDocuments,
			...privateLimitedExtraDocuments,
			...documentChoiceGroups.map((group) => group.options[0])
		]) {
			expect(org.documents.some((document) => document.documentType === type)).toBe(true);
		}

		expect(documentsComplete(org)).toBe(true);

		const withoutTan = {
			...org,
			documents: org.documents.filter((document) => document.documentType !== 'Business TAN')
		};
		expect(documentsComplete(withoutTan)).toBe(false);
	});

	it('requires brand name and brand logo only for partners', () => {
		const partner = createOrganization({
			id: 'ORG-TEST-BRAND',
			name: 'Brand Partner',
			businessType: 'LLP',
			category: 'PARTNER',
			status: 'IN_PROGRESS',
			kybStatus: 'Not Started',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			kybComplete: true,
			documentsComplete: true
		});

		expect(legalComplete(partner)).toBe(true);
		expect(documentsComplete(partner)).toBe(true);
		expect(partner.documents.some((document) => document.documentType === 'Brand logo')).toBe(true);

		const missingBrandName = {
			...partner,
			kyb: { ...partner.kyb, brandName: '' }
		};
		expect(legalComplete(missingBrandName)).toBe(false);

		const missingBrandLogo = {
			...partner,
			documents: partner.documents.filter((document) => document.documentType !== 'Brand logo')
		};
		expect(documentsComplete(missingBrandLogo)).toBe(false);

		const merchant = createOrganization({
			id: 'ORG-TEST-BRAND-MERCHANT',
			name: 'Brand Merchant',
			businessType: 'LLP',
			category: 'MERCHANT',
			status: 'IN_PROGRESS',
			kybStatus: 'Not Started',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			kybComplete: true,
			documentsComplete: true
		});

		expect(merchant.kyb.brandName).toBe('');
		expect(merchant.documents.some((document) => document.documentType === 'Brand logo')).toBe(
			false
		);
		expect(legalComplete(merchant)).toBe(true);
		expect(documentsComplete(merchant)).toBe(true);
	});

	it('includes director aadhar and pan uploads in documents completeness', () => {
		const org = createOrganization({
			id: 'ORG-TEST-DIR',
			name: 'Director Docs Test',
			businessType: 'LLP',
			category: 'PARTNER',
			status: 'IN_PROGRESS',
			kybStatus: 'Not Started',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			kybComplete: true,
			documentsComplete: true
		});

		expect(org.directors).toHaveLength(2);
		expect(documentsComplete(org)).toBe(true);

		const missingSecondDirectorPan = {
			...org,
			directors: org.directors.map((director, index) =>
				index === 1
					? {
							...director,
							panDocument: { ...director.panDocument, status: 'Pending' as const, fileName: '' }
						}
					: director
			)
		};
		expect(documentsComplete(missingSecondDirectorPan)).toBe(false);

		const oneDirector = {
			...org,
			directors: org.directors.slice(0, 1)
		};
		expect(documentsComplete(oneDirector)).toBe(true);
	});

	it('persists serviceTypes and seeds payinConfiguration only when Pay-Ins is selected', () => {
		const payoutsOnly = createOrganization({
			id: 'ORG-TEST-PAYOUTS',
			name: 'Payouts Only',
			businessType: 'LLP',
			category: 'MERCHANT',
			status: 'IN_PROGRESS',
			kybStatus: 'Not Started',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			serviceTypes: ['Payouts']
		});
		expect(payoutsOnly.serviceTypes).toEqual(['Payouts']);
		expect(payoutsOnly.payinConfiguration).toBeNull();

		const withPayins = createOrganization({
			id: 'ORG-TEST-BOTH',
			name: 'Both Services',
			businessType: 'LLP',
			category: 'MERCHANT',
			status: 'IN_PROGRESS',
			kybStatus: 'Not Started',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			serviceTypes: ['Payouts', 'Pay-Ins']
		});
		expect(withPayins.serviceTypes).toEqual(['Payouts', 'Pay-Ins']);
		expect(withPayins.payinConfiguration).toEqual({ configured: false });
	});

	it('seeds fee config drafts and activation document readiness defaults', () => {
		const org = createOrganization({
			id: 'ORG-TEST-FEE',
			name: 'Fee Config Test',
			businessType: 'LLP',
			category: 'MERCHANT',
			status: 'APPROVED',
			kybStatus: 'VERIFIED',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			affiliateId: 'AFF-HD01'
		});

		expect(org.feeConfigDrafts).toEqual([]);
		expect(org.affiliateId).toBe('AFF-HD01');
		expect(activationDocumentReady()).toBe(true);
	});
});
