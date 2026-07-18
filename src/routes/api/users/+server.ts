import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MOCK_API_USERS, getMockApiUserDetail } from '$lib/data/mock-api-users';
import type {
	ApiUserDetailResponse,
	ApiUserListItem,
	ApiUsersListResponse
} from '$lib/stores/user-management/api-types';

function mapStatusFilterToEnabled(status: string): boolean | undefined {
	if (status === 'Active') return true;
	if (status === 'Invited') return false;
	return undefined;
}

function filterUsers(
	users: ApiUserListItem[],
	search: string,
	status: string,
	role: string
): ApiUserListItem[] {
	const enabledFilter = mapStatusFilterToEnabled(status);

	return users.filter((user) => {
		if (enabledFilter !== undefined && user.enabled !== enabledFilter) return false;

		if (role) {
			const roleNames = user.roles.map((item) =>
				typeof item === 'string' ? item : (item.roleName ?? item.name ?? '')
			);
			if (!roleNames.includes(role)) return false;
		}

		if (!search) return true;
		const query = search.toLowerCase();
		return (
			user.userName.toLowerCase().includes(query) ||
			user.employeeId.toLowerCase().includes(query) ||
			user.userEmail.toLowerCase().includes(query)
		);
	});
}

export const GET: RequestHandler = async ({ url }) => {
	const userId = url.searchParams.get('userId');

	await new Promise((r) => setTimeout(r, 300));

	if (userId) {
		const id = Number(userId);
		const user = getMockApiUserDetail(id);

		if (!user) {
			error(404, { message: 'User not found' });
		}

		const response: ApiUserDetailResponse = {
			statusCode: 200,
			message: 'User Details Fetched Successfully',
			data: [user]
		};

		return json(response);
	}

	const search = (url.searchParams.get('search') ?? '').trim();
	const status = (url.searchParams.get('status') ?? '').trim();
	const role = (url.searchParams.get('role') ?? '').trim();
	const page = Number(url.searchParams.get('page') ?? 0);
	const limit = Number(url.searchParams.get('limit') ?? 10);

	const filtered = filterUsers(MOCK_API_USERS, search, status, role);
	const paginated = filtered.slice(page * limit, page * limit + limit);

	const response: ApiUsersListResponse = {
		statusCode: 200,
		message: 'Member Details Fetched Successfully',
		data: paginated,
		pagination: {
			total: filtered.length,
			page,
			limit
		}
	};

	return json(response);
};
