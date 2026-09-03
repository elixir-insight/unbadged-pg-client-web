import { describe, expect, it } from 'vitest';
import type { OnboardingFormData } from '$lib/types/onboarding';
import { DUMMY_REMARKED_ORG } from './dummy-org-response';
import {
	deriveAllStageStatuses,
	deriveStageStatus,
	isTabComplete,
	isTabLocked,
	resumeDestination,
	resumeTabForStage
} from './stage-status';

function emptyAddress() {
	return { line1: '', line2: '', city: '', state: '', pincode: '' };
}

function baseForm(): OnboardingFormData {
	return {
		businessPan: '',
		entityType: null,
		entityName: '',
		gstin: '',
		gstinList: [],
		businessDetails: {
			companyName: '',
			companyType: '',
			cin: '',
			address: emptyAddress(),
			currentAddress: emptyAddress(),
			currentAddressSameAsContact: false,
			phone: '',
			email: '',
			website: '',
			brandName: ''
		},
		bankDetails: {
			accountHolderName: '',
			accountNumber: '',
			confirmAccountNumber: '',
			ifscCode: '',
			bankName: '',
			branchName: ''
		},
		directors: [],
		documents: {
			gstCertificate: { uploaded: false, required: true },
			panCardCopy: { uploaded: false, required: true },
			certificateOfIncorporation: { uploaded: false, required: true },
			shopActLicence: { uploaded: false, required: false },
			bankStatement: { uploaded: false, required: true },
			addressProof: { uploaded: false, required: true }
		}
	};
}

describe('deriveStageStatus', () => {
	it('returns changes_required when a verification key routes to that stage', () => {
		const status = deriveStageStatus(
			'business-details',
			{ profileStatus: 'REMARKED', verifications: DUMMY_REMARKED_ORG.verifications },
			baseForm()
		);
		expect(status).toBe('changes_required');
	});

	it('returns draft when the stage is incomplete and has no remarks', () => {
		expect(deriveStageStatus('business-details', { profileStatus: 'DRAFT' }, baseForm())).toBe(
			'draft'
		);
	});

	it('locks later stages until the previous stage is complete', () => {
		const statuses = deriveAllStageStatuses({ profileStatus: 'DRAFT' }, baseForm());
		expect(statuses['business-details']).toBe('draft');
		expect(statuses['account-ownership']).toBe('locked');
		expect(statuses.documents).toBe('locked');
		expect(statuses['review-submit']).toBe('locked');
	});

	it('unlocks Account & Ownership remarks even if Business Details is still remarked', () => {
		const statuses = deriveAllStageStatuses(
			{ profileStatus: 'REMARKED', verifications: DUMMY_REMARKED_ORG.verifications },
			baseForm()
		);
		expect(statuses['business-details']).toBe('changes_required');
		expect(statuses['account-ownership']).toBe('changes_required');
	});
});

describe('resumeDestination', () => {
	it('lands on the first remarked tab', () => {
		expect(
			resumeDestination(baseForm(), {
				profileStatus: 'REMARKED',
				verifications: DUMMY_REMARKED_ORG.verifications
			})
		).toEqual({ kind: 'tab', id: 'company' });
	});

	it('lands on PAN when the form is empty', () => {
		expect(resumeDestination(baseForm(), { profileStatus: 'DRAFT' })).toEqual({
			kind: 'tab',
			id: 'pan'
		});
	});

	it('resumes a stage onto the remarked tab, not tab 1', () => {
		expect(
			resumeTabForStage('account-ownership', baseForm(), [
				{
					key: 'bankDetails.ifscCode',
					message: 'mismatch',
					stage: 'account-ownership',
					tab: 'bank',
					field: 'IFSC'
				}
			])
		).toBe('bank');
	});
});

describe('tab lock', () => {
	it('locks GST until PAN is complete', () => {
		expect(isTabLocked('gst', baseForm(), [])).toBe(true);
		expect(isTabLocked('pan', baseForm(), [])).toBe(false);
	});

	it('does not lock a remarked tab', () => {
		expect(
			isTabLocked('company', baseForm(), [
				{
					key: 'kyb.cin',
					message: 'Not Clear',
					stage: 'business-details',
					tab: 'company',
					field: 'CIN'
				}
			])
		).toBe(false);
	});

	it('treats a filled PAN tab as complete', () => {
		const data = baseForm();
		data.businessPan = 'ABCDE1234F';
		data.entityType = 'private_limited';
		expect(isTabComplete('pan', data)).toBe(true);
		expect(isTabLocked('gst', data, [])).toBe(false);
	});
});

describe('resume after earlier tabs are complete', () => {
	it('lands on Company when PAN and GST are already filled', () => {
		const data = baseForm();
		data.businessPan = 'ABCDE1234F';
		data.entityType = 'private_limited';
		data.gstin = '27ABCDE1234F1Z5';
		expect(resumeDestination(data, { profileStatus: 'DRAFT' })).toEqual({
			kind: 'tab',
			id: 'company'
		});
	});
});
