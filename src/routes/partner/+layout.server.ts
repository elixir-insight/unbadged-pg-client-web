import type { LayoutServerLoad } from './$types';
import { requirePortalAccess } from '$lib/server/domains/auth/requirePortalAccess';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	requirePortalAccess(url.pathname, locals.merchantSession);
	return {};
};
