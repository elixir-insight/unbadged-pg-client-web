import { ROLE_MODULES, CORE_PERM_KEYS } from './role-modules';
import type { PermKey, PermissionsState } from './role-management';
import { formatRoleName, validateRoleForm } from './validation';

export { formatRoleName } from './validation';

const NON_READ_KEYS: PermKey[] = ['writeUnrestricted', 'writeRestricted', 'delete', 'approve'];
const TOTAL_PERMISSIONS = ROLE_MODULES.length * CORE_PERM_KEYS.length;

function defaultPerms(): PermissionsState {
	const state: PermissionsState = {};
	for (const mod of ROLE_MODULES) {
		state[mod.id] = {
			read: false,
			writeUnrestricted: false,
			writeRestricted: false,
			delete: false,
			approve: false,
			fullAccess: false
		};
	}
	return state;
}

function clonePermissions(perms: PermissionsState): PermissionsState {
	const next: PermissionsState = {};
	for (const mod of ROLE_MODULES) {
		const current = perms[mod.id];
		next[mod.id] = current
			? { ...current }
			: {
					read: false,
					writeUnrestricted: false,
					writeRestricted: false,
					delete: false,
					approve: false,
					fullAccess: false
				};
	}
	return next;
}

function countSelected(permissions: PermissionsState): number {
	let n = 0;
	for (const mod of ROLE_MODULES) {
		const perms = permissions[mod.id];
		if (perms) {
			for (const key of CORE_PERM_KEYS) {
				if (perms[key]) n++;
			}
		}
	}
	return n;
}

class RoleFormStore {
	name = $state('');
	description = $state('');
	permissions = $state<PermissionsState>(defaultPerms());
	isEditMode = $state(false);
	roleId = $state<number | null>(null);

	#snapshotName = $state('');
	#snapshotDescription = $state('');
	#snapshotPermissions = $state('');

	get validationErrors() {
		return validateRoleForm({
			name: this.name,
			description: this.description,
			selectedPermissionCount: countSelected(this.permissions)
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

	selectedCount = $derived(countSelected(this.permissions));
	totalPermissions = TOTAL_PERMISSIONS;
	allSelected = $derived(countSelected(this.permissions) === TOTAL_PERMISSIONS);

	moduleCount(moduleId: string): number {
		const perms = this.permissions[moduleId];
		if (!perms) return 0;
		return CORE_PERM_KEYS.filter((k) => perms[k]).length;
	}

	toggle(moduleId: string, key: PermKey) {
		const current = this.permissions[moduleId];
		if (!current) return;

		const mod = { ...current };

		if (key === 'fullAccess') {
			const next = !mod.fullAccess;
			for (const k of CORE_PERM_KEYS) mod[k] = next;
			mod.fullAccess = next;
			this.permissions = { ...this.permissions, [moduleId]: mod };
			return;
		}

		if (key === 'read') {
			if (mod.read && NON_READ_KEYS.some((k) => mod[k])) return;
			mod.read = !mod.read;
		} else {
			mod[key] = !mod[key];
			if (mod[key]) {
				mod.read = true;
			} else if (!NON_READ_KEYS.some((k) => mod[k])) {
				mod.read = false;
			}
		}

		mod.fullAccess = CORE_PERM_KEYS.every((k) => mod[k]);
		this.permissions = { ...this.permissions, [moduleId]: mod };
	}

	toggleAll() {
		const selectAll = !this.allSelected;
		const next = clonePermissions(this.permissions);
		for (const mod of ROLE_MODULES) {
			for (const key of CORE_PERM_KEYS) {
				next[mod.id][key] = selectAll;
			}
			next[mod.id].fullAccess = selectAll;
		}
		this.permissions = next;
	}

	clear() {
		this.name = '';
		this.description = '';
		this.permissions = defaultPerms();
	}

	reset() {
		this.name = '';
		this.description = '';
		this.permissions = defaultPerms();
		this.isEditMode = false;
		this.roleId = null;
		this.#snapshotName = '';
		this.#snapshotDescription = '';
		this.#snapshotPermissions = '';
	}

	loadForEdit(roleId: number, roleName: string, roleDesc: string, perms: PermissionsState) {
		const formattedName = formatRoleName(roleName);
		const clonedPerms = clonePermissions(perms);

		for (const mod of ROLE_MODULES) {
			const modulePerms = clonedPerms[mod.id];
			if (modulePerms) {
				modulePerms.fullAccess = CORE_PERM_KEYS.every((key) => modulePerms[key]);
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
