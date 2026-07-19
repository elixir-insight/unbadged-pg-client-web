import { Network } from '$lib/assets/icons';
import { ROLE_MODULES, PERM_LABELS } from './role-modules';
import type { ModuleDef, PermKey } from './role-management';

/** API permission names → UI form keys */
export const API_PERM_NAME_TO_KEY: Record<string, Exclude<PermKey, 'fullAccess'>> = {
	read: 'read',
	write: 'writeUnrestricted',
	'write-restricted': 'writeRestricted',
	delete: 'delete',
	approve: 'approve'
};

export const PERM_KEY_TO_API_NAME: Record<Exclude<PermKey, 'fullAccess'>, string> = {
	read: 'read',
	writeUnrestricted: 'write',
	writeRestricted: 'write-restricted',
	delete: 'delete',
	approve: 'approve'
};

export type ApiPermissionItem = {
	id: number;
	name: string;
	description: string;
	resourceName?: string;
};

export type ApiPermissionModule = {
	module: string;
	permissions: ApiPermissionItem[];
};

export type PermissionOption = {
	key: PermKey;
	apiName: string;
	id: number;
	label: string;
	description: string;
};

export type PermissionsCatalog = {
	/** Modules available for selection (with icons) */
	modules: ModuleDef[];
	/** Per-module selectable options (excludes synthetic fullAccess) */
	optionsByModule: Record<string, PermissionOption[]>;
	/** API name → id lookup per module (for granted-id mapping) */
	permissionIds: Record<string, Partial<Record<string, number>>>;
};

function formatModuleName(moduleId: string): string {
	return moduleId
		.split('_')
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(' ');
}

function resolveModuleIcon(moduleId: string): ModuleDef['icon'] {
	return ROLE_MODULES.find((m) => m.id === moduleId)?.icon ?? Network;
}

/**
 * Map GET /permissions response modules into the role-management UI catalog.
 */
export function mapPermissionsCatalog(
	apiModules: ApiPermissionModule[] | null | undefined
): PermissionsCatalog {
	const modules: ModuleDef[] = [];
	const optionsByModule: Record<string, PermissionOption[]> = {};
	const permissionIds: Record<string, Partial<Record<string, number>>> = {};

	for (const group of apiModules ?? []) {
		const moduleId = group?.module;
		if (!moduleId) continue;
		const known = ROLE_MODULES.find((m) => m.id === moduleId);

		modules.push({
			id: moduleId,
			name: known?.name ?? formatModuleName(moduleId),
			icon: resolveModuleIcon(moduleId)
		});

		const options: PermissionOption[] = [];
		const ids: Partial<Record<string, number>> = {};

		for (const perm of group?.permissions ?? []) {
			const key = API_PERM_NAME_TO_KEY[perm?.name];
			if (!key) continue;

			ids[perm.name] = perm.id;
			options.push({
				key,
				apiName: perm.name,
				id: perm.id,
				label: PERM_LABELS[key],
				description: perm.description ?? ''
			});
		}

		optionsByModule[moduleId] = options;
		permissionIds[moduleId] = ids;
	}

	return { modules, optionsByModule, permissionIds };
}

/** Collect selected permission IDs from the form checkbox state. */
export function collectSelectedPermissionIds(
	permissions: Record<string, Partial<Record<PermKey, boolean>>>,
	optionsByModule: Record<string, PermissionOption[]>
): number[] {
	const ids: number[] = [];
	for (const [moduleId, options] of Object.entries(optionsByModule)) {
		const state = permissions[moduleId];
		if (!state) continue;
		for (const option of options) {
			if (state[option.key]) ids.push(option.id);
		}
	}
	return ids;
}

/** Diff original vs current permission IDs into add/revoke lists for PATCH. */
export function diffPermissionIds(
	originalIds: number[],
	currentIds: number[]
): { addPermissions: number[]; revokePermissions: number[] } {
	const original = new Set(originalIds);
	const current = new Set(currentIds);

	return {
		addPermissions: currentIds.filter((id) => !original.has(id)),
		revokePermissions: originalIds.filter((id) => !current.has(id))
	};
}
