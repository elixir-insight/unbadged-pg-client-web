import { normalizePortalGroups } from '$lib/stores/auth/portal';

export const MEMBERS_API_PORTALS = ['management', 'merchant'] as const;

export type MembersApiPortal = (typeof MEMBERS_API_PORTALS)[number];

export function isMembersApiPortal(value: string): value is MembersApiPortal {
	return (MEMBERS_API_PORTALS as readonly string[]).includes(value);
}

/** Upstream base path, e.g. `/api/v1/merchant` or `/api/v1/management`. */
export function membersBasePath(portal: MembersApiPortal): string {
	return `/api/v1/${portal}`;
}

/**
 * Resolve which upstream portal prefix to use for member APIs.
 * Preference: explicit `portal` query → Referer path → session groups.
 */
export function resolveMembersApiPortal(options: {
	portalParam: string | null;
	referer: string | null;
	groups: string[];
}): MembersApiPortal {
	const fromQuery = options.portalParam?.trim().toLowerCase() ?? '';
	if (isMembersApiPortal(fromQuery)) return fromQuery;

	const referer = options.referer ?? '';
	if (referer.includes('/merchant')) return 'merchant';
	if (referer.includes('/management')) return 'management';

	const portals = normalizePortalGroups(options.groups);
	if (portals.includes('MERCHANT') && !portals.includes('MANAGEMENT')) return 'merchant';
	if (portals.includes('MANAGEMENT')) return 'management';
	if (portals.includes('MERCHANT')) return 'merchant';
	return 'management';
}

export function resolveMembersApiPortalFromRequest(options: {
	url: URL;
	request: Request;
	groups: string[];
}): MembersApiPortal {
	return resolveMembersApiPortal({
		portalParam: options.url.searchParams.get('portal'),
		referer: options.request.headers.get('referer'),
		groups: options.groups
	});
}
