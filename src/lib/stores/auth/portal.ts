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

/** True when gateway/org group is PLATFORM (Partner portal + Configuration settings). */
export function isPlatformPortal(groups: string[] | null | undefined): boolean {
	return (groups ?? []).some((group) => group.trim().toUpperCase() === 'PLATFORM');
}

/**
 * Combines Cognito access-token groups with the gateway token `group` claim.
 * Platform orgs are identified on the gateway token (`group: "PLATFORM"`).
 */
export function collectPortalGroups(
	accessGroups: string[] | null | undefined,
	gatewayGroup?: string | null
): string[] {
	const groups = [...(accessGroups ?? [])];
	const fromGateway = gatewayGroup?.trim();
	if (fromGateway) {
		groups.push(fromGateway.toUpperCase());
	}
	return groups;
}

/** Map gateway/org labels onto portal apps. Platform shares the Partner portal. */
function toPortalGroup(value: string): PortalGroup | null {
	const normalized = value.trim().toUpperCase();
	if (normalized === 'PLATFORM') return 'PARTNER';
	return isPortalGroup(normalized) ? normalized : null;
}

export function normalizePortalGroups(groups: string[]): PortalGroup[] {
	const expanded = groups.includes('ROOT') ? [...groups, ...PORTAL_GROUPS] : groups;
	const portals: PortalGroup[] = [];
	for (const group of expanded) {
		const portalGroup = toPortalGroup(group);
		if (portalGroup && !portals.includes(portalGroup)) {
			portals.push(portalGroup);
		}
	}
	return portals;
}

/**
 * Home path after sign-in. Uses MANAGEMENT → PARTNER → MERCHANT priority
 * when multiple portal groups are present. PLATFORM always lands on Partner,
 * including when ROOT would otherwise prefer Management.
 */
export function resolvePortalHome(groups: string[]): PortalHomePath {
	const hasPlatform = groups.some((group) => group.trim().toUpperCase() === 'PLATFORM');
	if (hasPlatform) return '/partner';

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
