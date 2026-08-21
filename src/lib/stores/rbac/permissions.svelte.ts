import { can, canAny, canAll, canAccessModule } from '$lib/rbac';
import type { RbacAction, RbacModule, RbacPermissions } from '$lib/rbac/types';

/**
 * Client-side RBAC store. Hydrated once per navigation from root layout
 * data (`locals.userPermissions`, computed server-side in hooks.server.ts).
 *
 * Use to hide/disable UI the user can't act on. This is a UX convenience
 * only — the server independently re-checks via `requirePermission` on
 * every mutating route/action, so hiding a button here is not the security
 * boundary.
 */
export function createPermissionsStore() {
	let permissions = $state<RbacPermissions>({});

	return {
		get permissions() {
			return permissions;
		},

		hydrate(serverPermissions: RbacPermissions | undefined | null) {
			permissions = serverPermissions ?? {};
		},

		can: (moduleId: RbacModule, action: RbacAction) => can(permissions, moduleId, action),
		canAny: (moduleId: RbacModule, actions: RbacAction[]) => canAny(permissions, moduleId, actions),
		canAll: (moduleId: RbacModule, actions: RbacAction[]) => canAll(permissions, moduleId, actions),
		canAccessModule: (moduleId: RbacModule) => canAccessModule(permissions, moduleId)
	};
}

export const userPermissions = createPermissionsStore();
