import { describe, expect, it } from 'vitest';
import {
	defaultOrganizationLandingPath,
	getCurrentFlowNavStepKey,
	getFlowNavSteps,
	getPostOnboardingSteps,
	isPostOnboardingStatus,
	isPreviewNavigation,
	isPreviewSectionParamChange
} from './helpers';

describe('organization flow nav helpers', () => {
	it('detects post-onboarding statuses', () => {
		expect(isPostOnboardingStatus('APPROVED')).toBe(true);
		expect(isPostOnboardingStatus('ACTIVE')).toBe(true);
		expect(isPostOnboardingStatus('FROZEN')).toBe(true);
		expect(isPostOnboardingStatus('IN_PROGRESS')).toBe(false);
	});

	it('returns compact nav for approved and active orgs', () => {
		expect(getFlowNavSteps('ACTIVE').map((step) => step.label)).toEqual([
			'Profile overview',
			'KYB',
			'Bank',
			'Documents'
		]);
		expect(getPostOnboardingSteps()).toHaveLength(4);
	});

	it('maps KYB sub-steps to the KYB tab for post-onboarding orgs', () => {
		expect(
			getCurrentFlowNavStepKey(
				'/management/organizations/org-1/kyb',
				new URLSearchParams('step=directors'),
				'ACTIVE'
			)
		).toBe('legal');
	});

	it('routes post-onboarding orgs to preview by default', () => {
		expect(defaultOrganizationLandingPath('org-1', 'APPROVED')).toBe(
			'/management/organizations/org-1/preview'
		);
		expect(defaultOrganizationLandingPath('org-1', 'IN_PROGRESS')).toBe(
			'/management/organizations/org-1/kyb'
		);
	});

	it('detects preview tab and route navigation', () => {
		const preview = 'http://localhost/management/organizations/org-1/preview';
		const previewBank = 'http://localhost/management/organizations/org-1/preview?section=bank';
		const kyb = 'http://localhost/management/organizations/org-1/kyb';

		expect(isPreviewSectionParamChange(new URL(preview), new URL(previewBank))).toBe(true);
		expect(isPreviewNavigation(new URL(kyb), new URL(preview))).toBe(true);
		expect(isPreviewNavigation(new URL(preview), new URL(previewBank))).toBe(true);
	});
});
