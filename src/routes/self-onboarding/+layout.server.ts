import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { Logger } from 'pino';
import type { BankDetails, OnboardingPrefill } from '$lib/types/onboarding';
import {
	extractBankDetails,
	extractBusinessType,
	extractDocuments,
	extractOnboardingPrefill,
	extractProfileStatus,
	extractUploadedFieldNames,
	extractVerifications
} from '$lib/server/domains/onboarding/extract';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';
import { parseDocumentFileName } from '$lib/server/domains/organization/utils/document-field-names';
import { hasUnapprovedGroup, resolvePortalHome } from '$lib/stores/auth/portal';

/**
 * Everything already saved upstream, re-fetched on every step change (see the `url.pathname`
 * read below) so each step shows what the backend holds right now — a returning merchant
 * resumes where they left off: every step's fields prefilled, finished steps checked, and
 * /self-onboarding redirecting to the first unfinished one. Also the entity type from signup,
 * management remarks (`verifications`) and `profileStatus` (read-only / remarked routing — see
 * +layout.svelte). The three calls run in parallel and each is best-effort: a failed one just
 * leaves its part empty, and the client behaves as if nothing was saved there yet.
 */
async function attachDirectorDocuments(
	fetchFn: typeof fetch,
	log: Logger,
	tokens: { accessToken: string; gatewayToken: string },
	prefill: OnboardingPrefill | null
): Promise<OnboardingPrefill | null> {
	if (!prefill?.directors.length) return prefill;
	const directors = await Promise.all(
		prefill.directors.map(async (director) => {
			if (director.id === undefined) return director;
			const result = await onboardingClient.getDirectorDocuments(fetchFn, log, tokens, director.id);
			if (!result.ok) return director;
			const fields = extractDocuments(result.data.data).map((doc) => {
				const parsed = doc.fileName ? parseDocumentFileName(doc.fileName) : null;
				return parsed?.kind === 'director' ? parsed.field : null;
			});
			return {
				...director,
				...(fields.includes('aadharDocument') ? { aadhaarDocument: 'Uploaded' } : {}),
				...(fields.includes('panDocument') ? { panDocument: 'Uploaded' } : {})
			};
		})
	);
	return { ...prefill, directors };
}

export const load: LayoutServerLoad = async ({ cookies, fetch, locals, url }) => {
	const groups = locals.merchantSession?.groups ?? [];
	if (!hasUnapprovedGroup(groups)) {
		redirect(303, resolvePortalHome(groups));
	}

	// Reading the pathname makes SvelteKit re-run this load on every step navigation, not just on
	// the first mount. GETs only — nothing is saved by moving between steps.
	locals.logger.debug({ step: url.pathname }, 'self-onboarding: loading saved state');
	const session = await requireOnboardingSession({
		cookies,
		fetch,
		log: locals.logger,
		groups
	});
	if (!session.ok) {
		redirect(303, resolvePortalHome(groups));
	}

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
	const prefill = await attachDirectorDocuments(
		fetch,
		locals.logger,
		session.tokens,
		extractOnboardingPrefill(org)
	);

	return {
		businessType: extractBusinessType(org),
		profileStatus: extractProfileStatus(org),
		verifications: extractVerifications(org),
		prefill,
		bankAccounts: bankResult.ok ? extractBankDetails(bankResult.data.data) : ([] as BankDetails[]),
		uploadedFieldNames: documentsResult.ok
			? extractUploadedFieldNames(documentsResult.data.data)
			: ([] as string[])
	};
};
