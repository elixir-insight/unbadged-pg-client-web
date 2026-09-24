import type { LayoutServerLoad } from './$types';
import {
	extractBusinessType,
	extractProfileStatus,
	extractVerifications
} from '$lib/server/domains/onboarding/extract';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';

/**
 * Best-effort fetch of the org record, once per layout mount, so the client store can fill in
 * things it has no other way to learn: `entityType` (no selector on this side of the flow, see
 * business-identity/+page.svelte), the real management remarks (`verifications` — previously never
 * fetched anywhere; see remarkRouting.ts and RemarkBanner, which were already wired to consume it),
 * and `profileStatus` (drives read-only / remarked routing — see +layout.svelte).
 * Never blocks the page — on any failure (auth, network, unrecognized shape) the client just falls
 * back to empty/unknown values and behaves as if this were a fresh IN_PROGRESS application.
 */
export const load: LayoutServerLoad = async ({ cookies, fetch, locals }) => {
	const session = await requireOnboardingSession({
		cookies,
		fetch,
		log: locals.logger,
		groups: locals.merchantSession?.groups
	});
	if (!session.ok) return { businessType: '', profileStatus: '', verifications: {} };

	const result = await onboardingClient.fetchOrganization(fetch, locals.logger, session.tokens);
	if (!result.ok) return { businessType: '', profileStatus: '', verifications: {} };

	const org = result.data.data;
	return {
		businessType: extractBusinessType(org),
		profileStatus: extractProfileStatus(org),
		verifications: extractVerifications(org)
	};
};
