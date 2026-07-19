import type { Component } from 'svelte';

export type PermStatus = 'granted' | 'denied' | 'unavailable';

export type PermKey =
	| 'read'
	| 'writeUnrestricted'
	| 'writeRestricted'
	| 'delete'
	| 'approve'
	| 'fullAccess';

export type ModulePermissions = Record<PermKey, boolean>;
export type PermissionsState = Record<string, ModulePermissions>;

export type ModuleDef = {
	id: string;
	name: string;
	icon: Component;
};

export type PermModule = {
	name: string;
	icon: Component;
	read: PermStatus;
	writeUnrestricted: PermStatus;
	writeRestricted: PermStatus;
	delete: PermStatus;
	approve: PermStatus;
	fullAccess?: PermStatus;
};

// Matches the real list API shape
export type RoleItem = {
	roleId: number;
	roleName: string;
	roleAssignedCount: number;
	defaultRole: boolean;
	description: string;
};

// Matches the real detail API shape
export type RolePermission = {
	name: string;
	id: number;
	description?: string;
};

export type RoleUser = {
	userName: string;
	email: string;
};

export type RoleDetail = {
	roleInfo: {
		roleId: number;
		roleName: string;
		roleAssignedCount: number;
		defaultRole: boolean;
		description: string;
	};
	permissions: RolePermission[];
	users: RoleUser[];
};
