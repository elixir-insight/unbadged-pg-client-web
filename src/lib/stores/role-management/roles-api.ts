import { browser } from '$app/environment';
import type { RoleItem } from './role-management';

export type RolesApiPortal = 'management' | 'merchant';

export type CreateRolePayload = {
	roleName: string;
	description: string;
	permissions: number[];
};

export type CreateRoleResult = {
	message: string;
};

export class RoleNameConflictError extends Error {
	constructor(message = 'Role name already exists. Please choose a different name.') {
		super(message);
		this.name = 'RoleNameConflictError';
	}
}

function resolvePortal(portal?: RolesApiPortal): RolesApiPortal {
	if (portal) return portal;
	if (browser && window.location.pathname.startsWith('/merchant')) return 'merchant';
	if (browser && window.location.pathname.startsWith('/management')) return 'management';
	return 'management';
}

function withPortal(path: string, portal?: RolesApiPortal): string {
	const resolved = resolvePortal(portal);
	const sep = path.includes('?') ? '&' : '?';
	return `${path}${sep}portal=${resolved}`;
}

/** Fetch existing role names for duplicate checks. */
export async function fetchExistingRoleNames(portal?: RolesApiPortal): Promise<string[]> {
	const res = await fetch(withPortal('/api/roles?page=0&limit=1000', portal));
	if (!res.ok) throw new Error('Failed to fetch roles');

	const raw: { items?: RoleItem[] } = await res.json().catch(() => ({}));
	return (raw?.items ?? []).map((role) => role.roleName).filter(Boolean);
}

/** Create a custom role via BFF (`POST /api/roles`). */
export async function createRole(
	payload: CreateRolePayload,
	portal?: RolesApiPortal
): Promise<CreateRoleResult> {
	const res = await fetch(withPortal('/api/roles', portal), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	const raw: { message?: string } = await res.json().catch(() => ({}));

	if (!res.ok) {
		if (res.status === 422) {
			throw new RoleNameConflictError(
				raw?.message ?? 'Role name already exists. Please choose a different name.'
			);
		}
		throw new Error(raw?.message ?? 'Failed to create role');
	}

	return {
		message: raw?.message ?? 'Role created successfully'
	};
}
