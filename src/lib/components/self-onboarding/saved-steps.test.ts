import { describe, expect, it } from 'vitest';
import type { OnboardingPrefill } from '$lib/types/onboarding';
import { isStepReachable, savedCompletedSteps, type SavedOnboardingData } from './saved-steps';

const address = { line1: '12 Park', line2: '', city: 'Pune', state: 'MH', pincode: '411001' };

function prefill(): OnboardingPrefill {
	return {
		businessPan: '**********',
		gstin: '27ABCPE1234F1ZB',
		businessDetails: {
			cin: '',
			tan: '',
			brandName: 'Acme',
			phone: '9876543210',
			website: 'https://acme.test',
			industry: 'Retail',
			registeredYear: 2018,
			address: { ...address },
			communicationAddress: { ...address },
			sameAsCommunication: true
		},
		directors: [
			{
				id: 7,
				name: 'Ada',
				pan: '**********',
				aadhaar: '************',
				email: 'a@x.test',
				phone: '9876543211'
			}
		]
	};
}

function saved(overrides: Partial<SavedOnboardingData> = {}): SavedOnboardingData {
	return {
		businessType: 'SOLE_PROPRIETORSHIP',
		prefill: prefill(),
		bankAccounts: [
			{
				accountId: 3,
				accountHolderName: 'Acme',
				accountNumber: '123456789012',
				confirmAccountNumber: '123456789012',
				ifscCode: 'HDFC0000123',
				bankName: 'HDFC',
				branchName: 'Fort',
				accountType: 'CURRENT'
			}
		],
		uploadedFieldNames: [
			'gstCertificate',
			'businessPan',
			'uboDeclaration',
			'brDocument',
			'incorpCertificate',
			'voidedCheque',
			'rentalAgreement'
		],
		...overrides
	};
}

describe('savedCompletedSteps', () => {
	it('counts every step the backend holds', () => {
		expect(savedCompletedSteps(saved())).toEqual([1, 2, 3, 4, 5]);
	});

	it('counts nothing without a saved organization or its parts', () => {
		expect(
			savedCompletedSteps(saved({ prefill: null, bankAccounts: [], uploadedFieldNames: [] }))
		).toEqual([]);
	});

	it('leaves the address step open while the saved address is empty', () => {
		const data = saved();
		data.prefill!.businessDetails.address = {
			line1: '',
			line2: '',
			city: '',
			state: '',
			pincode: ''
		};
		expect(savedCompletedSteps(data)).not.toContain(2);
	});

	it('needs the CIN saved for a private limited company', () => {
		expect(savedCompletedSteps(saved({ businessType: 'PRIVATE_LIMITED' }))).not.toContain(1);
	});

	it('ignores a bank account or director without an id — typed, never saved', () => {
		const data = saved();
		data.bankAccounts = [{ ...data.bankAccounts[0], accountId: undefined }];
		data.prefill!.directors = [{ ...data.prefill!.directors[0], id: undefined }];
		expect(savedCompletedSteps(data)).toEqual([1, 2, 5]);
	});

	it('needs business TAN, AOA and MOA from every entity type but a sole proprietorship', () => {
		for (const businessType of ['PRIVATE_LIMITED', 'PARTNERSHIP', 'LLP']) {
			expect(savedCompletedSteps(saved({ businessType }))).not.toContain(5);
		}
		const withCompanyDocuments = [...saved().uploadedFieldNames, 'businessTan', 'aoa', 'moa'];
		expect(
			savedCompletedSteps(saved({ businessType: 'LLP', uploadedFieldNames: withCompanyDocuments }))
		).toContain(5);
	});

	it('needs every required document uploaded', () => {
		expect(savedCompletedSteps(saved({ uploadedFieldNames: ['gstCertificate'] }))).not.toContain(5);
	});
});

describe('isStepReachable', () => {
	it('opens every step up to the first unsaved one', () => {
		expect(isStepReachable(3, [1, 2], [])).toBe(true);
		expect(isStepReachable(4, [1, 2], [])).toBe(false);
	});

	it('opens a remarked step past an unsaved one', () => {
		expect(isStepReachable(4, [1], [4])).toBe(true);
	});
});
