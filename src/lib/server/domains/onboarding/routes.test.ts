import { describe, expect, it } from 'vitest';
import { resolveOnboardingUpstreamPath } from './routes';

describe('resolveOnboardingUpstreamPath', () => {
	it('maps allowed calls to the upstream onboarding endpoints', () => {
		expect(resolveOnboardingUpstreamPath('PUT', 'organization')).toBe(
			'/api/v1/onboarding/organization'
		);
		expect(resolveOnboardingUpstreamPath('POST', 'organization/bank')).toBe(
			'/api/v1/onboarding/organization/bank'
		);
		expect(resolveOnboardingUpstreamPath('PUT', 'organization/bank/42')).toBe(
			'/api/v1/onboarding/organization/bank/42'
		);
		expect(resolveOnboardingUpstreamPath('GET', 'organization/directors/9/documents')).toBe(
			'/api/v1/onboarding/organization/directors/9/documents'
		);
		expect(resolveOnboardingUpstreamPath('POST', 'organization/documents')).toBe(
			'/api/v1/onboarding/organization/documents'
		);
		expect(resolveOnboardingUpstreamPath('POST', 'organization/submit')).toBe(
			'/api/v1/onboarding/organization/submit'
		);
	});

	it('rejects unlisted methods and paths', () => {
		expect(resolveOnboardingUpstreamPath('DELETE', 'organization')).toBeNull();
		// Director document upload stays out of the allowlist — see routes.ts for why.
		expect(resolveOnboardingUpstreamPath('POST', 'organization/directors/9/documents')).toBeNull();
		expect(resolveOnboardingUpstreamPath('GET', 'organization/submit')).toBeNull();
		expect(resolveOnboardingUpstreamPath('GET', 'other')).toBeNull();
	});

	it('rejects path traversal and non-numeric ids', () => {
		expect(resolveOnboardingUpstreamPath('GET', '../management/organizations')).toBeNull();
		expect(resolveOnboardingUpstreamPath('PUT', 'organization/bank/1/../../x')).toBeNull();
		expect(resolveOnboardingUpstreamPath('PUT', 'organization/bank/abc')).toBeNull();
	});
});
