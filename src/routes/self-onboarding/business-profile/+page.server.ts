import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { toKybPayload } from '$lib/api/onboarding';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';
import type { OnboardingFormData } from '$lib/types/onboarding';

export const actions: Actions = {
	default: async ({ request, cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		let fd: OnboardingFormData;
		try {
			const form = await request.formData();
			fd = JSON.parse(String(form.get('payload') ?? '')) as OnboardingFormData;
		} catch {
			return fail(400, { error: 'Malformed request.' });
		}

		const result = await onboardingClient.saveOrganization(
			fetch,
			locals.logger,
			session.tokens,
			toKybPayload(fd)
		);
		if (!result.ok) {
			const status = result.error.kind === 'http' ? result.error.status : 502;
			return fail(status, { error: result.error.message });
		}

		return { success: true as const };
	}
};
