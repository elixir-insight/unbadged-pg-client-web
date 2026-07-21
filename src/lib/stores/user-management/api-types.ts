/** Raw role shape — list may return names; detail returns role IDs */
export type ApiUserRole = string | number | { roleId?: number; roleName?: string; name?: string };

export interface ApiAssignedUser {
	id: number;
	name: string;
}

/** List item from GET /api/v1/{management|merchant}/member */
export interface ApiUserListItem {
	id: number;
	userName: string;
	userEmail: string;
	employeeId?: string | null;
	phoneNumber?: string | null;
	userType?: string | null;
	roles: ApiUserRole[];
	supervisorId?: number | null;
	orgId?: number | null;
	enabled: boolean;
	emailVerified?: boolean;
	phoneNumberVerified?: boolean;
	createdAt?: string | null;
	updatedAt?: string | null;
}

/** Detail item from GET /api/v1/{management|merchant}/member/{memberId} */
export interface ApiUserDetailItem {
	id: number;
	userName: string;
	userEmail: string;
	employeeId?: string | null;
	phoneNumber?: string | null;
	userType?: string | null;
	roles: ApiUserRole[];
	supervisorId?: number | null;
	orgId?: number | null;
	enabled: boolean;
	emailVerified?: boolean;
	phoneNumberVerified?: boolean;
	createdAt?: string | null;
	updatedAt?: string | null;
	createdBy?: number | null;
	updatedBy?: number | null;
	/** Enriched from members list via supervisorId */
	reportingTo?: {
		id: number;
		name: string;
		employeeId?: string;
		userEmail?: string;
	};
	/** Count of members whose supervisorId is this user — blocks delete when > 0 */
	assignedUsersCount?: number;
	/** Members assigned to this user as direct reports. */
	assignedUsers?: ApiAssignedUser[];
}

export interface ApiPagination {
	total: number;
	page: number;
	limit: number;
}

export interface ApiUsersListResponse {
	statusCode: number;
	message: string;
	data: ApiUserListItem[];
	pagination: ApiPagination;
}

export interface ApiUserDetailResponse {
	statusCode: number;
	message: string;
	data: ApiUserDetailItem[];
}
