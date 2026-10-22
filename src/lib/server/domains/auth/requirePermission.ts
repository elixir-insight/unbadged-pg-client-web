import { error } from '@sveltejs/kit';
import { can, canAny } from '$lib/rbac';
import type { RbacAction, RbacModule, RbacPermissions } from '$lib/rbac/types';

/**
 * Guard for +page.server.ts loads, form actions, and +server.ts handlers.
 * Throws a 403 if the current user's permissions don't grant `action` on `module`.
 *
 * Usage:
 *   requirePermission(locals.userPermissions, 'ROLE_MANAGEMENT', 'write');
 */
export function requirePermission(
	permissions: RbacPermissions | null | undefined,
	moduleId: RbacModule,
	action: RbacAction
): void {
	if (!can(permissions, moduleId, action)) {
		error(403, { message: 'You do not have permission to perform this action.' });
	}
}

/**
 * Like requirePermission, but passes if the user has ANY of the given
 * module/action pairs. Use for pages that combine multiple modules
 * (e.g. a Transactions page covering both PAYINS and PAYOUTS).
 *
 * Usage:
 *   requireAnyPermission(locals.userPermissions, [
 *     { module: 'PAYINS', action: 'read' },
 *     { module: 'PAYOUTS', action: 'read' }
 *   ]);
 */
export function requireAnyPermission(
	permissions: RbacPermissions | null | undefined,
	grants: { module: RbacModule; action: RbacAction }[]
): void {
	const ok = grants.some((g) => canAny(permissions, g.module, [g.action]));
	if (!ok) {
		error(403, { message: 'You do not have permission to access this page.' });
	}
}
