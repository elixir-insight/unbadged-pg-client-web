import {
	Building2,
	Send,
	Receipt,
	FileText,
	User,
	Network,
	UserManagement
} from '$lib/assets/icons';
import type { ModuleDef, PermKey } from './role-management';

export const ROLE_MODULES: ModuleDef[] = [
	{ id: 'ORGANIZATION', name: 'Organization', icon: Building2 },
	{ id: 'PAYOUTS', name: 'Payouts', icon: Send },
	{ id: 'PAYINS', name: 'Payins', icon: Receipt },
	{ id: 'REPORTS', name: 'Reports', icon: FileText },
	{ id: 'PROFILE', name: 'Profile', icon: User },
	{ id: 'USER_MANAGEMENT', name: 'User management', icon: UserManagement },
	{ id: 'ROLE_MANAGEMENT', name: 'Role management', icon: Network }
];

export const PERM_KEYS: PermKey[] = [
	'read',
	'writeUnrestricted',
	'writeRestricted',
	'delete',
	'approve',
	'fullAccess'
];

export const CORE_PERM_KEYS: PermKey[] = [
	'read',
	'writeUnrestricted',
	'writeRestricted',
	'delete',
	'approve'
];

export const PERM_LABELS: Record<PermKey, string> = {
	read: 'Read',
	writeUnrestricted: 'Write (unrestricted)',
	writeRestricted: 'Write (restricted)',
	delete: 'Delete',
	approve: 'Approve',
	fullAccess: 'Full access'
};

export const TOTAL_PERMISSIONS = ROLE_MODULES.length * PERM_KEYS.length;

export const MODULE_PERMISSION_IDS: Record<string, Partial<Record<string, number>>> = {
	ORGANIZATION: { read: 1000, write: 1001, 'write-restricted': 1002, delete: 1003, approve: 1004 },
	PAYOUTS: { read: 1005, write: 1006, 'write-restricted': 1007, delete: 1008, approve: 1009 },
	PAYINS: { read: 1010, write: 1011, 'write-restricted': 1012, delete: 1013, approve: 1014 },
	REPORTS: { read: 1015, write: 1016 },
	PROFILE: { read: 1017, write: 1018 },
	USER_MANAGEMENT: { read: 1019, write: 1020, delete: 1021 },
	ROLE_MANAGEMENT: { read: 1022, write: 1023, delete: 1024 }
};
