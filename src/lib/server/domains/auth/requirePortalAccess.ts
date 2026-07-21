import { error } from '@sveltejs/kit';
import { canAccessPortalPath } from '$lib/stores/auth/portal';
import type { MerchantSession } from '$lib/stores/auth/types';

export function requirePortalAccess(pathname: string, session: MerchantSession | null): void {
	if (session && !canAccessPortalPath(pathname, session.groups)) {
		error(401, { message: 'You do not have permission to access this portal.' });
	}
}
