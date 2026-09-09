import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasUnapprovedGroup, resolvePortalHome } from '$lib/stores/auth/portal';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.merchantSession;
	const groups = session?.groups ?? [];

	if (!hasUnapprovedGroup(groups)) {
		redirect(303, resolvePortalHome(groups));
	}

	return {
		displayName: session?.merchantName ?? 'there'
	};
};
