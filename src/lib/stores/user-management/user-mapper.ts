import type {
	ApiUserDetailItem,
	ApiUserListItem,
	ApiUserRole,
	ApiUserDetailResponse,
	ApiUsersListResponse
} from './api-types';
import type { UserItem, UserStatus, UsersListResponse } from './user-management';

/**
 * Detail API historically returned role IDs; list returns SCREAMING_SNAKE names.
 * Prefer resolving IDs in the BFF. Keep a small fallback map for known IDs only.
 */
const ROLE_ID_TO_NAME: Record<number, string> = {
	2: 'MGMT_FULL_ACCESS'
};

function mapEnabledToStatus(enabled: boolean): UserStatus {
	return enabled ? 'Active' : 'Invited';
}

/** SCREAMING_SNAKE_CASE → spaced Title Case (e.g. MGMT_FULL_ACCESS → Mgmt Full Access) */
export function formatRoleDisplayName(value: string): string {
	const parts = value
		.trim()
		.split(/[_\s]+/)
		.filter(Boolean);
	if (parts.length === 0) return '';

	return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
}

function resolveRoleRawName(role: ApiUserRole): string {
	if (typeof role === 'string') return role;
	if (typeof role === 'number') {
		// Never drop unknown IDs — otherwise multi-role users appear to have fewer roles.
		return ROLE_ID_TO_NAME[role] ?? `ROLE_${role}`;
	}
	if (role.roleName) return role.roleName;
	if (role.name) return role.name;
	if (role.roleId !== undefined) {
		return ROLE_ID_TO_NAME[role.roleId] ?? `ROLE_${role.roleId}`;
	}
	return '';
}

function mapRoleName(role: ApiUserRole): string {
	const raw = resolveRoleRawName(role);
	return raw ? formatRoleDisplayName(raw) : '';
}

function mapRoles(roles: ApiUserRole[] | undefined): string[] {
	if (!roles) return [];
	return roles.map(mapRoleName).filter(Boolean);
}

function normalizePhoneNumber(phone?: string | null): string | undefined {
	if (!phone?.trim()) return undefined;
	const value = phone.trim();
	if (value.startsWith('+91')) return value.slice(3);
	if (value.startsWith('+')) return value.slice(1);
	return value;
}

export function formatPhoneDisplay(phone?: string | null): string {
	if (!phone?.trim()) return '—';
	const value = phone.trim();
	if (value.startsWith('+')) return value;
	return `+91${value}`;
}

function mapReportingManager(
	reportingTo: ApiUserDetailItem['reportingTo']
): UserItem['reportingManager'] {
	if (!reportingTo || typeof reportingTo !== 'object') return null;
	if (!reportingTo.name?.trim()) return null;
	return {
		id: String(reportingTo.id),
		name: reportingTo.name,
		employeeId: reportingTo.employeeId ?? '',
		email: reportingTo.userEmail ?? ''
	};
}

function mapAssignedUsers(
	assignedUsers: ApiUserDetailItem['assignedUsers']
): NonNullable<UserItem['assignedUsers']> {
	if (!assignedUsers) return [];
	return assignedUsers
		.filter((assignedUser) => assignedUser.name.trim())
		.map((assignedUser) => ({
			id: String(assignedUser.id),
			name: assignedUser.name.trim()
		}));
}

export function mapApiListUser(user: ApiUserListItem): UserItem {
	return {
		id: String(user.id),
		name: user.userName,
		email: user.userEmail,
		employeeId: user.employeeId ?? '',
		roles: mapRoles(user?.roles),
		status: mapEnabledToStatus(user.enabled),
		mobileNumber: normalizePhoneNumber(user.phoneNumber)
	};
}

export function mapApiDetailUser(user: ApiUserDetailItem): UserItem {
	const assignedUsers = mapAssignedUsers(user.assignedUsers);

	return {
		id: String(user.id),
		name: user.userName,
		email: user.userEmail,
		employeeId: user.employeeId ?? '',
		roles: mapRoles(user?.roles),
		status: mapEnabledToStatus(user.enabled),
		mobileNumber: normalizePhoneNumber(user.phoneNumber),
		reportingManager: mapReportingManager(user.reportingTo),
		assignedUsersCount: user.assignedUsersCount ?? assignedUsers.length,
		assignedUsers
	};
}

export function mapUsersListResponse(response: ApiUsersListResponse): UsersListResponse {
	const items = (response?.data ?? []).map(mapApiListUser);
	return {
		items,
		meta: {
			total: response?.pagination?.total ?? 0,
			roles: getUniqueRoles(items)
		}
	};
}

export function mapUserDetailResponse(response: ApiUserDetailResponse): UserItem | null {
	const user = response?.data?.[0];
	return user ? mapApiDetailUser(user) : null;
}

export function getUniqueRoles(users: UserItem[]): string[] {
	return Array.from(new Set(users.flatMap((user) => user?.roles ?? []))).sort((a, b) =>
		a.localeCompare(b)
	);
}

export function mapStatusFilterToEnabled(status: string): boolean | undefined {
	if (status === 'Active') return true;
	if (status === 'Invited') return false;
	return undefined;
}
