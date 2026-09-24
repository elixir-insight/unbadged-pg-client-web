import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import {
	extractApplicationId,
	missingOrganizationFields
} from '$lib/server/domains/onboarding/extract';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';

export const actions: Actions = {
	default: async ({ cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		const result = await onboardingClient.submitOnboarding(fetch, locals.logger, session.tokens);
		if (!result.ok) {
			const status = result.error.kind === 'http' ? result.error.status : 502;
			// The upstream rejection doesn't say which fields are missing — look them up so the
			// applicant knows what to go back and fill in.
			const org = await onboardingClient.fetchOrganization(fetch, locals.logger, session.tokens);
			const missing = org.ok ? missingOrganizationFields(org.data.data) : [];
			if (missing.length > 0) {
				locals.logger.warn({ missing }, 'onboarding submit rejected — org fields missing');
			}
			const error =
				missing.length > 0
					? `${result.error.message}. Missing: ${missing.join(', ')}.`
					: result.error.message;
			return fail(status, { error });
		}

		return { success: true as const, applicationId: extractApplicationId(result.data.data) };
	}
};
