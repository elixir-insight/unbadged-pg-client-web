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

export const PERM_KEYS: PermKey[] = [
	'read',
	'writeUnrestricted',
	'writeRestricted',
	'delete',
	'approve',
	'fullAccess'
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
