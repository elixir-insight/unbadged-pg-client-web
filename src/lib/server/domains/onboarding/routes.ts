export type OnboardingMethod = 'GET' | 'POST' | 'PUT';

/**
 * Self-onboarding endpoints the browser may reach through /api/onboarding/*.
 * Anything not listed here is rejected, so the proxy never forwards arbitrary
 * upstream paths.
 *
 * `POST organization/documents` (multipart) mirrors the confirmed, working shape of the
 * management portal's org-document upload (same organization/documents domain, same backend) —
 * see lib/server/domains/organization/mutations/upload-documents.ts. It is not independently
 * confirmed for the self-onboarding path specifically. Director document upload stays out of
 * the allowlist: management's director upload only accepts two fixed fields (aadhar/pan), which
 * doesn't match the self-onboarding directors UI's single generic upload control, so there is no
 * comparably confident shape to infer here yet.
 */
const ALLOWED: readonly { method: OnboardingMethod; pattern: RegExp }[] = [
	{ method: 'GET', pattern: /^organization$/ },
	{ method: 'PUT', pattern: /^organization$/ },
	{ method: 'POST', pattern: /^organization\/bank$/ },
	{ method: 'PUT', pattern: /^organization\/bank\/\d+$/ },
	{ method: 'GET', pattern: /^organization\/bank-accounts$/ },
	{ method: 'GET', pattern: /^organization\/documents$/ },
	{ method: 'POST', pattern: /^organization\/documents$/ },
	{ method: 'GET', pattern: /^organization\/directors\/\d+\/documents$/ },
	{ method: 'POST', pattern: /^organization\/submit$/ }
];

/** Returns the upstream path for an allowed request, or null when it is not allowed. */
export function resolveOnboardingUpstreamPath(method: string, path: string): string | null {
	const allowed = ALLOWED.some((route) => route.method === method && route.pattern.test(path));
	return allowed ? `/api/v1/onboarding/${path}` : null;
}
