import { ROLE_MODULES, PERM_KEYS, TOTAL_PERMISSIONS } from './role-modules';
import type { PermKey, PermissionsState } from './role-management';

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

function countSelected(): number {
	let n = 0;
	for (const mod of ROLE_MODULES) {
		const perms = _permissions[mod.id];
		if (perms) {
			for (const key of PERM_KEYS) {
				if (perms[key]) n++;
			}
		}
	}
	return n;
}

function moduleCount(moduleId: string): number {
	const perms = _permissions[moduleId];
	if (!perms) return 0;
	return PERM_KEYS.filter((k) => perms[k]).length;
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
	get isValid() {
		return _name.trim().length > 0;
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
		if (_permissions[moduleId]) {
			_permissions[moduleId][key] = !_permissions[moduleId][key];
		}
	},

	toggleAll() {
		const selectAll = !roleFormStore.allSelected;
		for (const mod of ROLE_MODULES) {
			for (const key of PERM_KEYS) {
				_permissions[mod.id][key] = selectAll;
			}
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
	},

	loadForEdit(roleName: string, roleDesc: string, perms: PermissionsState) {
		_name = roleName;
		_description = roleDesc;
		_permissions = perms;
		_isEditMode = true;
	}
};
