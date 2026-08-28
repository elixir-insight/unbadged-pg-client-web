import type { RbacAction, RbacModule, RbacPermissions } from './types';

const RBAC_MODULES = [
	'ORGANIZATION',
	'PAYINS',
	'PAYOUTS',
	'PROFILE',
	'REPORTS',
	'ROLE_MANAGEMENT',
	'USER_MANAGEMENT'
] as const satisfies readonly RbacModule[];

const RBAC_ACTIONS = [
	'read',
	'write',
	'write-restricted',
	'delete',
	'approve'
] as const satisfies readonly RbacAction[];

/** ROOT users are not always present in org role tables, so the permissions API returns `{}`. */
export function isRootUser(userType?: string | null, groups: string[] = []): boolean {
	if (userType?.toUpperCase() === 'ROOT') return true;
	return groups.some((group) => group.toUpperCase() === 'ROOT');
}

/** Every catalog module × action — used when a ROOT user has no API grants. */
export function rootUserPermissions(): RbacPermissions {
	const permissions: RbacPermissions = {};
	for (const moduleId of RBAC_MODULES) {
		permissions[moduleId] = new Set<RbacAction>(RBAC_ACTIONS);
	}
	return permissions;
}
