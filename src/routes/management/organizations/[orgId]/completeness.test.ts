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
	merchantActivationValid
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

	it('requires payout limits, methods, commission, agreement checkbox, and document for activation', () => {
		const org = createOrganization({
			id: 'ORG-TEST-COMMISSION',
			name: 'Commission Test',
			businessType: 'LLP',
			category: 'MERCHANT',
			status: 'APPROVED',
			kybStatus: 'VERIFIED',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			businessAgreementReady: true
		});

		expect(org.commissionRules).toHaveLength(2);
		expect(org.payoutConfiguration.txnAmountMin).toBe('100');
		expect(org.payoutConfiguration.allowedTransactionTypes).toEqual([]);
		expect(merchantActivationValid(org, true)).toBe(false);

		const configured = {
			...org,
			payoutConfiguration: {
				securityDeposit: '10000',
				dailyTxnLimit: '100000',
				txnAmountMin: '100',
				txnAmountMax: '50000',
				dailyDepositLimit: '200000',
				bankPipeline: 'HDFC Bank',
				allowedTransactionTypes: [
					{
						transactionType: 'IMPS' as const,
						txnAmountMin: '100',
						txnAmountMax: '25000',
						dailyTxnLimit: '40000'
					},
					{
						transactionType: 'NEFT' as const,
						txnAmountMin: '100',
						txnAmountMax: '50000',
						dailyTxnLimit: '60000'
					}
				],
				virtualAccountsEnabled: false
			}
		};
		expect(merchantActivationValid(configured, true)).toBe(true);
		expect(merchantActivationValid(configured, false)).toBe(false);

		const missingPartnerFee = {
			...configured,
			commissionRules: configured.commissionRules.map((rule, index) =>
				index === 0 ? { ...rule, partnerFee: '' } : rule
			)
		};
		expect(merchantActivationValid(missingPartnerFee, true)).toBe(false);

		const overDailyCap = {
			...configured,
			payoutConfiguration: {
				...configured.payoutConfiguration,
				allowedTransactionTypes: [
					{
						transactionType: 'IMPS' as const,
						txnAmountMin: '100',
						txnAmountMax: '25000',
						dailyTxnLimit: '60000'
					},
					{
						transactionType: 'NEFT' as const,
						txnAmountMin: '100',
						txnAmountMax: '50000',
						dailyTxnLimit: '60000'
					}
				]
			}
		};
		expect(merchantActivationValid(overDailyCap, true)).toBe(false);

		const methodMaxExceedsParent = {
			...configured,
			payoutConfiguration: {
				...configured.payoutConfiguration,
				allowedTransactionTypes: [
					{
						transactionType: 'IMPS' as const,
						txnAmountMin: '100',
						txnAmountMax: '75000',
						dailyTxnLimit: '40000'
					}
				]
			}
		};
		expect(merchantActivationValid(methodMaxExceedsParent, true)).toBe(false);

		const withoutDocument = createOrganization({
			id: 'ORG-TEST-NO-DOC',
			name: 'No Agreement Doc',
			businessType: 'LLP',
			category: 'MERCHANT',
			status: 'APPROVED',
			kybStatus: 'VERIFIED',
			createdAt: '2026-01-01',
			assignedAdmin: 'Test Admin',
			businessAgreementReady: false
		});
		expect(
			merchantActivationValid(
				{ ...withoutDocument, payoutConfiguration: configured.payoutConfiguration },
				true
			)
		).toBe(false);
	});
});
