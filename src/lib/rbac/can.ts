import type { RbacAction, RbacModule, RbacPermissions } from './types';

/** Whether the given permission set grants `action` on `module`. */
export function can(
	permissions: RbacPermissions | null | undefined,
	moduleId: RbacModule,
	action: RbacAction
): boolean {
	return permissions?.[moduleId]?.has(action) ?? false;
}

/** True if at least one of `actions` is granted on `module`. */
export function canAny(
	permissions: RbacPermissions | null | undefined,
	moduleId: RbacModule,
	actions: RbacAction[]
): boolean {
	return actions.some((action) => can(permissions, moduleId, action));
}

/** True only if every one of `actions` is granted on `module`. */
export function canAll(
	permissions: RbacPermissions | null | undefined,
	moduleId: RbacModule,
	actions: RbacAction[]
): boolean {
	return actions.every((action) => can(permissions, moduleId, action));
}

/** Whether the user has any access at all to `module` (any action granted). */
export function canAccessModule(
	permissions: RbacPermissions | null | undefined,
	moduleId: RbacModule
): boolean {
	return (permissions?.[moduleId]?.size ?? 0) > 0;
}
