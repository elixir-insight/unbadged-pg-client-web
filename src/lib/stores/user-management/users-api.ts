import { browser } from '$app/environment';
import type { ApiUserDetailResponse, ApiUsersListResponse } from './api-types';
import { formatRoleDisplayName, mapUserDetailResponse, mapUsersListResponse } from './user-mapper';
import type { UserItem, UsersListResponse } from './user-management';
import type { RoleItem } from '$lib/stores/role-management/role-management';

export type CreateUserPayload = {
	employeeId: string;
	phoneNumber: string;
	reportingTo: number;
	roles: number[];
	userEmail: string;
	userName: string;
};

/** Full member payload — send all fields (changed + existing) on every update. */
export type UpdateUserPayload = CreateUserPayload;

export type CreateUserResult = {
	memberId: number;
	message: string;
};

export type UpdateUserResult = {
	message: string;
};

export type AssignableRole = RoleItem & {
	displayName: string;
};

export type UsersApiPortal = 'management' | 'merchant';

/** Infer portal from the current browser path; SSR callers should pass portal explicitly. */
export function resolveUsersApiPortal(portal?: UsersApiPortal): UsersApiPortal {
	if (portal) return portal;
	if (browser && window.location.pathname.startsWith('/merchant')) return 'merchant';
	if (browser && window.location.pathname.startsWith('/management')) return 'management';
	return 'management';
}

function withPortal(path: string, portal?: UsersApiPortal): string {
	const resolved = resolveUsersApiPortal(portal);
	const sep = path.includes('?') ? '&' : '?';
	return `${path}${sep}portal=${resolved}`;
}

export async function fetchUsers(params: {
	search?: string;
	status?: string;
	role?: string;
	/** 1-based page number matching the upstream API */
	page?: number;
	limit?: number;
	portal?: UsersApiPortal;
}): Promise<UsersListResponse> {
	const query = new URLSearchParams();

	if (params.search) query.set('search', params.search);
	if (params.status) query.set('status', params.status);
	if (params.role) query.set('role', params.role);
	if (params.page !== undefined) query.set('page', String(params.page));
	if (params.limit !== undefined) query.set('limit', String(params.limit));

	const res = await fetch(withPortal(`/api/users?${query}`, params.portal));
	if (!res.ok) throw new Error('Failed to fetch users');

	const raw: ApiUsersListResponse = await res.json();
	return mapUsersListResponse(raw);
}

export async function fetchUserById(
	userId: string,
	portal?: UsersApiPortal
): Promise<UserItem | null> {
	const res = await fetch(withPortal(`/api/users?userId=${encodeURIComponent(userId)}`, portal));
	if (!res.ok) throw new Error('Failed to fetch user');

	const raw: ApiUserDetailResponse = await res.json();
	return mapUserDetailResponse(raw);
}

export type DirectoryUser = {
	id: string;
	name: string;
};

export async function fetchUserDirectory(portal?: UsersApiPortal): Promise<DirectoryUser[]> {
	const res = await fetch(withPortal('/api/users/directory', portal));
	if (!res.ok) throw new Error('Failed to fetch user directory');

	const raw: { items?: DirectoryUser[] } = await res.json();
	return raw?.items ?? [];
}

export async function fetchAssignableRoles(portal?: UsersApiPortal): Promise<AssignableRole[]> {
	const res = await fetch(withPortal('/api/roles?page=0&limit=100', portal));
	if (!res.ok) throw new Error('Failed to fetch roles');

	const raw: { items?: RoleItem[] } = await res.json();
	return (raw?.items ?? []).map((role) => ({
		...role,
		displayName: formatRoleDisplayName(role.roleName)
	}));
}

export async function createUser(
	payload: CreateUserPayload,
	portal?: UsersApiPortal
): Promise<CreateUserResult> {
	const res = await fetch(withPortal('/api/users', portal), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	const raw: {
		message?: string;
		data?: Array<{ memberId: number }>;
	} = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(raw.message ?? 'Failed to create user');
	}

	const memberId = raw.data?.[0]?.memberId;
	if (memberId === undefined) {
		throw new Error('Unexpected create user response');
	}

	return {
		memberId,
		message: raw.message ?? 'Member created successfully'
	};
}

export async function updateUser(
	userId: string,
	payload: UpdateUserPayload,
	portal?: UsersApiPortal
): Promise<UpdateUserResult> {
	const res = await fetch(withPortal(`/api/users?userId=${encodeURIComponent(userId)}`, portal), {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	const raw: { message?: string } = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(raw.message ?? 'Failed to update user');
	}

	return {
		message: raw.message ?? 'Member updated successfully'
	};
}

export type DeleteUserResult = {
	message: string;
};

export async function deleteUser(
	userId: string,
	portal?: UsersApiPortal
): Promise<DeleteUserResult> {
	const res = await fetch(withPortal(`/api/users?userId=${encodeURIComponent(userId)}`, portal), {
		method: 'DELETE'
	});

	const raw: { message?: string } = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(raw.message ?? 'Failed to delete user');
	}

	return {
		message: raw.message ?? 'Member deleted successfully'
	};
}
