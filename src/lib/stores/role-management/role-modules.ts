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
