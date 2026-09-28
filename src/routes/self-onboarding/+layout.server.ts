import type { LayoutServerLoad } from './$types';
import type { BankDetails, OnboardingPrefill } from '$lib/types/onboarding';
import {
	extractBankDetails,
	extractBusinessType,
	extractOnboardingPrefill,
	extractProfileStatus,
	extractUploadedFieldNames,
	extractVerifications
} from '$lib/server/domains/onboarding/extract';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';

/**
 * Everything already saved upstream, re-fetched on every step change (see the `url.pathname`
 * read below) so each step shows what the backend holds right now — a returning merchant
 * resumes where they left off: every step's fields prefilled, finished steps checked, and
 * /self-onboarding redirecting to the first unfinished one. Also the entity type from signup,
 * management remarks (`verifications`) and `profileStatus` (read-only / remarked routing — see
 * +layout.svelte). The three calls run in parallel and each is best-effort: a failed one just
 * leaves its part empty, and the client behaves as if nothing was saved there yet.
 */
const EMPTY = {
	businessType: '',
	profileStatus: '',
	verifications: {} as Record<string, string>,
	prefill: null as OnboardingPrefill | null,
	bankAccounts: [] as BankDetails[],
	uploadedFieldNames: [] as string[]
};

export const load: LayoutServerLoad = async ({ cookies, fetch, locals, url }) => {
	// Reading the pathname makes SvelteKit re-run this load on every step navigation, not just on
	// the first mount. GETs only — nothing is saved by moving between steps.
	locals.logger.debug({ step: url.pathname }, 'self-onboarding: loading saved state');
	const session = await requireOnboardingSession({
		cookies,
		fetch,
		log: locals.logger,
		groups: locals.merchantSession?.groups
	});
	if (!session.ok) return EMPTY;

	const [orgResult, bankResult, documentsResult] = await Promise.all([
		onboardingClient.fetchOrganization(fetch, locals.logger, session.tokens),
		onboardingClient.getBankAccounts(fetch, locals.logger, session.tokens),
		onboardingClient.getOrgDocuments(fetch, locals.logger, session.tokens)
	]);

	// A failed call leaves its part empty; log which one, or an empty step is a mystery.
	for (const [name, result] of [
		['organization', orgResult],
		['bank-accounts', bankResult],
		['documents', documentsResult]
	] as const) {
		if (!result.ok) {
			locals.logger.warn(
				{ call: name, error: result.error.message },
				'self-onboarding: could not load saved state'
			);
		}
	}

	const org = orgResult.ok ? orgResult.data.data : undefined;
	return {
		businessType: extractBusinessType(org),
		profileStatus: extractProfileStatus(org),
		verifications: extractVerifications(org),
		prefill: extractOnboardingPrefill(org),
		bankAccounts: bankResult.ok ? extractBankDetails(bankResult.data.data) : [],
		uploadedFieldNames: documentsResult.ok
			? extractUploadedFieldNames(documentsResult.data.data)
			: []
	};
};
