import { ROLE_MODULES, CORE_PERM_KEYS } from './role-modules';
import type { PermKey, PermissionsState } from './role-management';

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

let _name = $state('');
let _description = $state('');
let _permissions = $state<PermissionsState>(defaultPerms());
let _isEditMode = $state(false);
let _roleId = $state<number | null>(null);
let _snapshot: { name: string; description: string; permissions: string } | null = null;

function countSelected(): number {
	let n = 0;
	for (const mod of ROLE_MODULES) {
		const perms = _permissions[mod.id];
		if (perms) {
			for (const key of CORE_PERM_KEYS) {
				if (perms[key]) n++;
			}
		}
	}
	return n;
}

function moduleCount(moduleId: string): number {
	const perms = _permissions[moduleId];
	if (!perms) return 0;
	return CORE_PERM_KEYS.filter((k) => perms[k]).length;
}

export const roleFormStore = {
	get name() {
		return _name;
	},
	set name(v: string) {
		_name = v;
	},
	get description() {
		return _description;
	},
	set description(v: string) {
		_description = v;
	},
	get permissions() {
		return _permissions;
	},
	get isEditMode() {
		return _isEditMode;
	},
	get roleId() {
		return _roleId;
	},
	get isValid() {
		return _name.trim().length > 0 && _description.trim().length > 0 && countSelected() > 0;
	},
	get hasChanges() {
		const snapshot = _snapshot;
		if (!_isEditMode || !snapshot) return true;
		return (
			_name !== snapshot.name ||
			_description !== snapshot.description ||
			JSON.stringify(_permissions) !== snapshot.permissions
		);
	},
	get selectedCount() {
		return countSelected();
	},
	get totalPermissions() {
		return TOTAL_PERMISSIONS;
	},
	get allSelected() {
		return countSelected() === TOTAL_PERMISSIONS;
	},

	moduleCount,

	toggle(moduleId: string, key: PermKey) {
		const mod = _permissions[moduleId];
		if (!mod) return;

		if (key === 'fullAccess') {
			const next = !mod.fullAccess;
			for (const k of CORE_PERM_KEYS) mod[k] = next;
			mod.fullAccess = next;
			return;
		}

		if (key === 'read') {
			// Block unchecking read while any non-read permission is ON
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

		// Sync fullAccess: true only when all 5 regular perms are ON
		mod.fullAccess = CORE_PERM_KEYS.every((k) => mod[k]);
	},

	toggleAll() {
		const selectAll = !roleFormStore.allSelected;
		for (const mod of ROLE_MODULES) {
			for (const key of CORE_PERM_KEYS) {
				_permissions[mod.id][key] = selectAll;
			}
			_permissions[mod.id].fullAccess = selectAll;
		}
	},

	clear() {
		_name = '';
		_description = '';
		_permissions = defaultPerms();
	},

	reset() {
		_name = '';
		_description = '';
		_permissions = defaultPerms();
		_isEditMode = false;
		_roleId = null;
		_snapshot = null;
	},

	loadForEdit(roleId: number, roleName: string, roleDesc: string, perms: PermissionsState) {
		_roleId = roleId;
		_name = roleName;
		_description = roleDesc;
		_permissions = perms;
		_isEditMode = true;
		_snapshot = { name: roleName, description: roleDesc, permissions: JSON.stringify(perms) };
	}
};
