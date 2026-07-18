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

export type CreateUserResult = {
	memberId: number;
	message: string;
};

export type AssignableRole = RoleItem & {
	displayName: string;
};

export async function fetchUsers(params: {
	search?: string;
	status?: string;
	role?: string;
	/** 1-based page number matching the upstream API */
	page?: number;
	limit?: number;
}): Promise<UsersListResponse> {
	const query = new URLSearchParams();

	if (params.search) query.set('search', params.search);
	if (params.status) query.set('status', params.status);
	if (params.role) query.set('role', params.role);
	if (params.page !== undefined) query.set('page', String(params.page));
	if (params.limit !== undefined) query.set('limit', String(params.limit));

	const res = await fetch(`/api/users?${query}`);
	if (!res.ok) throw new Error('Failed to fetch users');

	const raw: ApiUsersListResponse = await res.json();
	return mapUsersListResponse(raw);
}

export async function fetchUserById(userId: string): Promise<UserItem | null> {
	const res = await fetch(`/api/users?userId=${encodeURIComponent(userId)}`);
	if (!res.ok) throw new Error('Failed to fetch user');

	const raw: ApiUserDetailResponse = await res.json();
	return mapUserDetailResponse(raw);
}

export type DirectoryUser = {
	id: string;
	name: string;
};

export async function fetchUserDirectory(): Promise<DirectoryUser[]> {
	const res = await fetch('/api/users/directory');
	if (!res.ok) throw new Error('Failed to fetch user directory');

	const raw: { items: DirectoryUser[] } = await res.json();
	return raw.items;
}

export async function fetchAssignableRoles(): Promise<AssignableRole[]> {
	const res = await fetch('/api/roles?page=0&limit=100');
	if (!res.ok) throw new Error('Failed to fetch roles');

	const raw: { items: RoleItem[] } = await res.json();
	return raw.items.map((role) => ({
		...role,
		displayName: formatRoleDisplayName(role.roleName)
	}));
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResult> {
	const res = await fetch('/api/users', {
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
