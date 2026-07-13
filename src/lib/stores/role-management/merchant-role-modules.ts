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
import type { ModuleDef } from './role-management';

/**
 * Merchant portal permission modules.
 * Same as management for now — update this list when merchant modules diverge.
 */
export const MERCHANT_ROLE_MODULES: ModuleDef[] = [
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

/** Merchant permission ID map — same as management for now. */
export const MERCHANT_MODULE_PERMISSION_IDS: Record<string, Partial<Record<string, number>>> = {
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
