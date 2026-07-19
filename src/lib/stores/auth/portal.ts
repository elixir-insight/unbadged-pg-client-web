import type { PortalGroup, PortalHomePath } from './types';

export const PORTAL_GROUPS = [
	'MERCHANT',
	'PARTNER',
	'MANAGEMENT'
] as const satisfies readonly PortalGroup[];

const HOME_BY_GROUP: Record<PortalGroup, PortalHomePath> = {
	MANAGEMENT: '/management',
	PARTNER: '/partner',
	MERCHANT: '/merchant'
};

/** Priority when a user belongs to more than one portal group. */
const GROUP_PRIORITY: readonly PortalGroup[] = ['MANAGEMENT', 'PARTNER', 'MERCHANT'];

export function isPortalGroup(value: string): value is PortalGroup {
	return (PORTAL_GROUPS as readonly string[]).includes(value);
}

export function normalizePortalGroups(groups: string[]): PortalGroup[] {
	const expanded = groups.includes('ROOT') ? [...groups, ...PORTAL_GROUPS] : groups;
	const portals: PortalGroup[] = [];
	for (const group of expanded) {
		if (isPortalGroup(group) && !portals.includes(group)) {
			portals.push(group);
		}
	}
	return portals;
}

/**
 * Home path after sign-in. Uses MANAGEMENT → PARTNER → MERCHANT priority
 * when multiple portal groups are present.
 */
export function resolvePortalHome(groups: string[]): PortalHomePath {
	const portals = normalizePortalGroups(groups);
	for (const group of GROUP_PRIORITY) {
		if (portals.includes(group)) return HOME_BY_GROUP[group];
	}
	return '/merchant';
}

/** Whether the session may access a given app pathname segment. */
export function canAccessPortalPath(pathname: string, groups: string[]): boolean {
	const portals = normalizePortalGroups(groups);

	if (pathname === '/management' || pathname.startsWith('/management/')) {
		return portals.includes('MANAGEMENT');
	}
	if (pathname === '/partner' || pathname.startsWith('/partner/')) {
		return portals.includes('PARTNER');
	}
	if (pathname === '/merchant' || pathname.startsWith('/merchant/')) {
		return portals.includes('MERCHANT');
	}

	return true;
}
