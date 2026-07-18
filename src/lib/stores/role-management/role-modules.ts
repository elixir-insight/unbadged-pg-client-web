import {
	Wallet,
	UserPlus,
	Building2,
	Handshake,
	WalletCard,
	FileClock,
	Network,
	UserManagement
} from '$lib/assets/icons';
import type { ModuleDef, PermKey } from './role-management';

export const ROLE_MODULES: ModuleDef[] = [
	{ id: 'ONBOARDING', name: 'Onboarding', icon: UserPlus },
	{ id: 'ORGANIZATION_MANAGEMENT', name: 'Organization management', icon: Building2 },
	{
		id: 'ORGANIZATION_WALLET_MANAGEMENT',
		name: 'Organization wallet management',
		icon: WalletCard
	},
	{ id: 'GATEWAY_WALLET_MANAGEMENT', name: 'Gateway wallet management', icon: Wallet },
	{ id: 'PARTNER_SETTLEMENTS', name: 'Partner settlements', icon: Handshake },
	{ id: 'PAYOUT_REPORTS', name: 'Reports', icon: FileClock },
	{ id: 'ROLE_MANAGEMENT', name: 'Role management', icon: Network },
	{ id: 'USER_MANAGEMENT', name: 'User management', icon: UserManagement }
];

// All permission keys including the derived fullAccess (used for rendering UI rows)
export const PERM_KEYS: PermKey[] = [
	'read',
	'writeUnrestricted',
	'writeRestricted',
	'delete',
	'approve',
	'fullAccess'
];

// The 5 "real" permissions — fullAccess is derived, not counted
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

// Maps each module's permission IDs from the real API to their semantic key.
// The api returns a flat RolePermission[] — granted permissions are present,
// denied ones are absent. Use this table to resolve which ID means what.
export const MODULE_PERMISSION_IDS: Record<string, Partial<Record<string, number>>> = {
	ONBOARDING: { read: 1000, write: 1001, 'write-restricted': 1002, delete: 1003, approve: 1004 },
	ORGANIZATION_MANAGEMENT: {
		read: 1005,
		write: 1006,
		'write-restricted': 1007,
		delete: 1008,
		approve: 1009
	},
	ORGANIZATION_WALLET_MANAGEMENT: {
		read: 1010,
		write: 1011,
		'write-restricted': 1012,
		delete: 1013,
		approve: 1014
	},
	GATEWAY_WALLET_MANAGEMENT: {
		read: 1015,
		write: 1016,
		'write-restricted': 1017,
		delete: 1018,
		approve: 1019
	},
	PARTNER_SETTLEMENTS: { read: 1020, write: 1021, delete: 1022 },
	PAYOUT_REPORTS: { read: 1025, write: 1026 },
	USER_MANAGEMENT: { read: 1027, write: 1028, delete: 1029 },
	ROLE_MANAGEMENT: { read: 1030, write: 1031, delete: 1032 }
};
