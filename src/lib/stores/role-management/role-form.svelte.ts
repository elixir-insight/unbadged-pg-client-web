import { CORE_PERM_KEYS, ROLE_MODULES } from './role-modules';
import type { PermKey, PermissionsState } from './role-management';
import type { PermissionOption } from './permissions-mapper';
import { formatRoleName, validateRoleForm } from './validation';

export { formatRoleName } from './validation';

const NON_READ_KEYS: PermKey[] = ['writeUnrestricted', 'writeRestricted', 'delete', 'approve'];

function emptyModulePerms(): Record<PermKey, boolean> {
	return {
		read: false,
		writeUnrestricted: false,
		writeRestricted: false,
		delete: false,
		approve: false,
		fullAccess: false
	};
}

function defaultPerms(moduleIds: string[]): PermissionsState {
	const state: PermissionsState = {};
	for (const id of moduleIds) {
		state[id] = emptyModulePerms();
	}
	return state;
}

function clonePermissions(perms: PermissionsState, moduleIds: string[]): PermissionsState {
	const next: PermissionsState = {};
	for (const id of moduleIds) {
		const current = perms[id];
		next[id] = current ? { ...current } : emptyModulePerms();
	}
	return next;
}

function availableKeysFor(
	moduleId: string,
	optionsByModule: Record<string, PermissionOption[]> | null
): PermKey[] {
	if (!optionsByModule) return CORE_PERM_KEYS;
	const options = optionsByModule[moduleId];
	if (!options || options.length === 0) return [];
	return options.map((o) => o.key);
}

function countSelected(
	permissions: PermissionsState,
	moduleIds: string[],
	optionsByModule: Record<string, PermissionOption[]> | null
): number {
	let n = 0;
	for (const id of moduleIds) {
		const perms = permissions[id];
		if (!perms) continue;
		for (const key of availableKeysFor(id, optionsByModule)) {
			if (perms[key]) n++;
		}
	}
	return n;
}

function totalAvailable(
	moduleIds: string[],
	optionsByModule: Record<string, PermissionOption[]> | null
): number {
	let n = 0;
	for (const id of moduleIds) {
		n += availableKeysFor(id, optionsByModule).length;
	}
	return n;
}

class RoleFormStore {
	name = $state('');
	description = $state('');
	permissions = $state<PermissionsState>(defaultPerms(ROLE_MODULES.map((m) => m.id)));
	isEditMode = $state(false);
	roleId = $state<number | null>(null);

	/** When set, select/count only uses API-available keys per module. */
	#optionsByModule = $state<Record<string, PermissionOption[]> | null>(null);
	#moduleIds = $state<string[]>(ROLE_MODULES.map((m) => m.id));

	#snapshotName = $state('');
	#snapshotDescription = $state('');
	#snapshotPermissions = $state('');

	get validationErrors() {
		return validateRoleForm({
			name: this.name,
			description: this.description,
			selectedPermissionCount: countSelected(
				this.permissions,
				this.#moduleIds,
				this.#optionsByModule
			)
		});
	}

	get isValid() {
		return Object.keys(this.validationErrors).length === 0;
	}

	hasChanges = $derived.by(() => {
		if (!this.isEditMode || !this.#snapshotPermissions) return true;
		return (
			this.name !== this.#snapshotName ||
			this.description !== this.#snapshotDescription ||
			JSON.stringify(this.permissions) !== this.#snapshotPermissions
		);
	});

	selectedCount = $derived(countSelected(this.permissions, this.#moduleIds, this.#optionsByModule));
	totalPermissions = $derived(totalAvailable(this.#moduleIds, this.#optionsByModule));
	allSelected = $derived(this.totalPermissions > 0 && this.selectedCount === this.totalPermissions);

	/** Apply live permissions catalog from GET /permissions. */
	configureCatalog(moduleIds: string[], optionsByModule: Record<string, PermissionOption[]>) {
		const sameModules =
			this.#moduleIds.length === moduleIds.length &&
			this.#moduleIds.every((id, i) => id === moduleIds[i]);

		this.#moduleIds = moduleIds;
		this.#optionsByModule = optionsByModule;

		// Avoid rewriting permissions when the module set is unchanged — otherwise a
		// reactive $effect that calls this will loop and freeze clicks.
		if (sameModules && moduleIds.every((id) => id in this.permissions)) {
			return;
		}

		const next = defaultPerms(moduleIds);
		for (const id of moduleIds) {
			const existing = this.permissions[id];
			if (existing) {
				next[id] = { ...existing };
				const keys = availableKeysFor(id, optionsByModule);
				next[id].fullAccess = keys.length > 0 && keys.every((k) => next[id][k]);
			}
		}
		this.permissions = next;
	}

	moduleCount(moduleId: string): number {
		const perms = this.permissions[moduleId];
		if (!perms) return 0;
		return availableKeysFor(moduleId, this.#optionsByModule).filter((k) => perms[k]).length;
	}

	toggle(moduleId: string, key: PermKey) {
		const current = this.permissions[moduleId];
		if (!current) return;

		const mod = { ...current };
		const available = availableKeysFor(moduleId, this.#optionsByModule);
		const nonRead = NON_READ_KEYS.filter((k) => available.includes(k));

		if (key === 'fullAccess') {
			const next = !mod.fullAccess;
			for (const k of available) mod[k] = next;
			mod.fullAccess = next;
			this.permissions = { ...this.permissions, [moduleId]: mod };
			return;
		}

		if (!available.includes(key)) return;

		if (key === 'read') {
			if (mod.read && nonRead.some((k) => mod[k])) return;
			mod.read = !mod.read;
		} else {
			mod[key] = !mod[key];
			if (mod[key]) {
				mod.read = true;
			} else if (!nonRead.some((k) => mod[k])) {
				mod.read = false;
			}
		}

		mod.fullAccess = available.length > 0 && available.every((k) => mod[k]);
		this.permissions = { ...this.permissions, [moduleId]: mod };
	}

	toggleAll() {
		const selectAll = !this.allSelected;
		const next = clonePermissions(this.permissions, this.#moduleIds);
		for (const id of this.#moduleIds) {
			const keys = availableKeysFor(id, this.#optionsByModule);
			for (const key of keys) {
				next[id][key] = selectAll;
			}
			next[id].fullAccess = selectAll && keys.length > 0;
		}
		this.permissions = next;
	}

	clear() {
		this.name = '';
		this.description = '';
		this.permissions = defaultPerms(this.#moduleIds);
	}

	reset() {
		this.name = '';
		this.description = '';
		this.permissions = defaultPerms(this.#moduleIds);
		this.isEditMode = false;
		this.roleId = null;
		this.#snapshotName = '';
		this.#snapshotDescription = '';
		this.#snapshotPermissions = '';
		this.#optionsByModule = null;
		this.#moduleIds = ROLE_MODULES.map((m) => m.id);
	}

	loadForEdit(roleId: number, roleName: string, roleDesc: string, perms: PermissionsState) {
		const formattedName = formatRoleName(roleName);
		const clonedPerms = clonePermissions(perms, this.#moduleIds);

		for (const id of this.#moduleIds) {
			const modulePerms = clonedPerms[id];
			if (modulePerms) {
				const keys = availableKeysFor(id, this.#optionsByModule);
				modulePerms.fullAccess = keys.length > 0 && keys.every((key) => modulePerms[key]);
			}
		}

		this.roleId = roleId;
		this.name = formattedName;
		this.description = roleDesc;
		this.permissions = clonedPerms;
		this.isEditMode = true;
		this.#snapshotName = formattedName;
		this.#snapshotDescription = roleDesc;
		this.#snapshotPermissions = JSON.stringify(clonedPerms);
	}
}

export const roleFormStore = new RoleFormStore();
