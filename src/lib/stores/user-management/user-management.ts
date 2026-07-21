export type UserStatus = 'Active' | 'Invited';

export interface UserReportingManager {
	id: string;
	name: string;
	employeeId: string;
	email: string;
}

export interface UserAssignedUser {
	id: string;
	name: string;
}

export interface UserItem {
	id: string;
	name: string;
	employeeId: string;
	email: string;
	roles: string[];
	status: UserStatus;
	mobileNumber?: string;
	reportingManager?: UserReportingManager | null;
	/** Users who report to this person — delete is blocked when non-empty. */
	assignedUsersCount?: number;
	assignedUsers?: UserAssignedUser[];
}

/** Normalized list response used by the UI */
export interface UsersListResponse {
	items: UserItem[];
	meta: {
		total: number;
		roles: string[];
	};
}
