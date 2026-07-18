import type {
	ApiUserDetailItem,
	ApiUserListItem,
	ApiUserRole,
	ApiUserDetailResponse,
	ApiUsersListResponse
} from './api-types';
import type {
	UserItem,
	UserReportingManager,
	UserStatus,
	UsersListResponse
} from './user-management';

function mapEnabledToStatus(enabled: boolean): UserStatus {
	return enabled ? 'Active' : 'Invited';
}

function mapRoleName(role: string | ApiUserRole): string {
	if (typeof role === 'string') return role;
	return role.roleName ?? role.name ?? '';
}

function mapRoles(roles: (string | ApiUserRole)[] | undefined): string[] {
	if (!roles) return [];
	return roles.map(mapRoleName).filter(Boolean);
}

function normalizePhoneNumber(phone?: string): string | undefined {
	if (!phone?.trim()) return undefined;
	const value = phone.trim();
	if (value.startsWith('+91')) return value.slice(3);
	if (value.startsWith('+')) return value.slice(1);
	return value;
}

export function formatPhoneDisplay(phone?: string): string {
	if (!phone?.trim()) return '—';
	const value = phone.trim();
	if (value.startsWith('+')) return value;
	return `+91${value}`;
}

function mapReportingManager(
	reportingTo: ApiUserDetailItem['reportingTo']
): UserReportingManager | null {
	if (!reportingTo) return null;
	return {
		id: String(reportingTo.id),
		name: reportingTo.name,
		employeeId: reportingTo.employeeId ?? '',
		email: reportingTo.userEmail ?? ''
	};
}

export function mapApiListUser(user: ApiUserListItem): UserItem {
	return {
		id: String(user.userId),
		name: user.userName,
		email: user.userEmail,
		employeeId: user.employeeId,
		roles: mapRoles(user.roles),
		status: mapEnabledToStatus(user.enabled)
	};
}

export function mapApiDetailUser(user: ApiUserDetailItem): UserItem {
	const roles = user.roleDetails?.length ? mapRoles(user.roleDetails) : mapRoles(user.roles);

	return {
		id: String(user.userId),
		name: user.userName,
		email: user.userEmail,
		employeeId: user.employeeId,
		roles,
		status: mapEnabledToStatus(user.enabled),
		mobileNumber: normalizePhoneNumber(user.phoneNumber),
		reportingManager: mapReportingManager(user.reportingTo),
		assignedUsersCount: user.assignedUsers?.length ?? 0
	};
}

export function mapUsersListResponse(response: ApiUsersListResponse): UsersListResponse {
	const items = response.data.map(mapApiListUser);
	return {
		items,
		meta: {
			total: response.pagination.total,
			roles: getUniqueRoles(items)
		}
	};
}

export function mapUserDetailResponse(response: ApiUserDetailResponse): UserItem | null {
	const user = response.data[0];
	return user ? mapApiDetailUser(user) : null;
}

export function getUniqueRoles(users: UserItem[]): string[] {
	return Array.from(new Set(users.flatMap((user) => user.roles))).sort((a, b) =>
		a.localeCompare(b)
	);
}

export function mapStatusFilterToEnabled(status: string): boolean | undefined {
	if (status === 'Active') return true;
	if (status === 'Invited') return false;
	return undefined;
}
