import type { RawUserPermissionsEntry, RbacAction, RbacModule, RbacPermissions } from './types';

/**
 * Normalize the raw `/user/permissions` response into a flat
 * `{ MODULE: Set<action> }` map.
 *
 * The upstream response nests permissions under a portal-group key
 * (e.g. `MANAGEMENT`, `MERCHANT`) because a user can theoretically belong to
 * more than one portal. Pass `groupKey` to scope to the portal the current
 * request is for; omit it to merge every group present (rarely what you
 * want — prefer scoping).
 */
export function normalizeUserPermissions(
	raw: RawUserPermissionsEntry[] | null | undefined,
	groupKey?: string
): RbacPermissions {
	const result: RbacPermissions = {};

	for (const entry of raw ?? []) {
		for (const [group, modules] of Object.entries(entry ?? {})) {
			if (groupKey && group !== groupKey) continue;

			for (const [moduleId, actions] of Object.entries(modules ?? {})) {
				const key = moduleId as RbacModule;
				const set = result[key] ?? new Set<RbacAction>();
				for (const action of actions ?? []) {
					set.add(action as RbacAction);
				}
				result[key] = set;
			}
		}
	}

	return result;
}

/** Uppercase portal-group key the upstream API uses, derived from a portal pathname. */
export function portalGroupKeyFromPathname(pathname: string): string | undefined {
	if (pathname === '/management' || pathname.startsWith('/management/')) return 'MANAGEMENT';
	if (pathname === '/merchant' || pathname.startsWith('/merchant/')) return 'MERCHANT';
	if (pathname === '/partner' || pathname.startsWith('/partner/')) return 'PARTNER';
	return undefined;
}
