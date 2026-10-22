import { describe, expect, it } from 'vitest';
import { buildProfilePayload, validateProfileForm, type ProfileFormInput } from './profile';

const merchant: ProfileFormInput = {
	profileType: 'MERCHANT',
	selectedServiceTypes: ['Pay-Ins', 'Payouts'],
	servicePipelines: { 'Pay-Ins': 'HDFC_PAYIN', Payouts: 'ICICI_PAYOUT' },
	affiliateId: 'ORG-AFF-01'
};

describe('validateProfileForm', () => {
	it('accepts a merchant with a pipeline for every service', () => {
		expect(validateProfileForm(merchant)).toEqual({});
	});

	it('requires at least one service for a merchant', () => {
		expect(validateProfileForm({ ...merchant, selectedServiceTypes: [] })).toEqual({
			serviceTypes: 'Select at least one service type'
		});
	});

	it('requires a pipeline for each service that is on', () => {
		expect(
			validateProfileForm({ ...merchant, servicePipelines: { 'Pay-Ins': 'HDFC_PAYIN' } })
		).toEqual({ bankPipeline_Payouts: 'Select a bank pipeline' });
	});

	it('does not require services for a partner', () => {
		expect(
			validateProfileForm({ ...merchant, profileType: 'PARTNER', selectedServiceTypes: [] })
		).toEqual({});
	});

	it('requires a profile type', () => {
		expect(validateProfileForm({ ...merchant, profileType: '' })).toEqual({
			profileType: 'Select a profile type'
		});
	});
});

describe('buildProfilePayload', () => {
	it('maps merchant services to API codes', () => {
		expect(buildProfilePayload(merchant)).toEqual({
			profileType: 'MERCHANT',
			serviceTypes: [
				{ serviceType: 'PAYIN', bankPipelineCodes: ['HDFC_PAYIN'] },
				{ serviceType: 'PAYOUT', bankPipelineCodes: ['ICICI_PAYOUT'] }
			],
			affiliateId: 'ORG-AFF-01'
		});
	});

	it('omits services that are off even if a stale pipeline remains', () => {
		const payload = buildProfilePayload({ ...merchant, selectedServiceTypes: ['Pay-Ins'] });
		expect(payload.serviceTypes).toEqual([
			{ serviceType: 'PAYIN', bankPipelineCodes: ['HDFC_PAYIN'] }
		]);
	});

	it('omits serviceTypes for a partner', () => {
		expect(buildProfilePayload({ ...merchant, profileType: 'PARTNER', affiliateId: '' })).toEqual({
			profileType: 'PARTNER'
		});
	});

	it('omits affiliateId when none is selected', () => {
		expect(buildProfilePayload({ ...merchant, affiliateId: '  ' })).not.toHaveProperty(
			'affiliateId'
		);
	});
});
