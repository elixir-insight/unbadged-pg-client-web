import type { ApiUserDetailResponse, ApiUsersListResponse } from './api-types';
import { mapUserDetailResponse, mapUsersListResponse } from './user-mapper';
import type { UserItem, UsersListResponse } from './user-management';

export async function fetchUsers(params: {
	search?: string;
	status?: string;
	role?: string;
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
