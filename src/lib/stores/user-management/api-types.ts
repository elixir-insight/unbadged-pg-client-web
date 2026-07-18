/** Raw role shape — list endpoint may return strings or objects */
export interface ApiUserRole {
	roleId?: number;
	roleName?: string;
	name?: string;
}

/** List item from GET members/users */
export interface ApiUserListItem {
	userId: number;
	userName: string;
	userEmail: string;
	employeeId: string;
	roles: string[] | ApiUserRole[];
	enabled: boolean;
}

/** Detail item from GET user by userId */
export interface ApiUserDetailItem {
	userId: number;
	userName: string;
	userEmail: string;
	employeeId: string;
	phoneNumber?: string;
	roleDetails?: ApiUserRole[];
	roles?: string[] | ApiUserRole[];
	reportingTo?: {
		id: number;
		name: string;
		employeeId?: string;
		userEmail?: string;
	};
	enabled: boolean;
	createdBy?: number;
	assignedUsers?: unknown[];
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
