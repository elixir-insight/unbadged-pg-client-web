import type { Component } from 'svelte';

export type RoleType = 'Custom' | 'Default' | 'System Default';
export type PermStatus = 'granted' | 'denied' | 'none';

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

export type RoleItem = {
	id: string;
	name: string;
	type: RoleType;
	userCount: number;
	description: string;
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

export type AssignedUser = {
	id: string;
	name: string;
	email: string;
	initials: string;
	color: string;
};
