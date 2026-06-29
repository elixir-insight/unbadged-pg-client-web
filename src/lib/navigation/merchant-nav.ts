import type { NavGroup } from './types';
import {
	LayoutDashboard,
	Wallet,
	ArrowLeftRight,
	Receipt,
	MessageSquareWarning,
	Landmark,
	FileText,
	Users,
	ShieldCheck
} from '$lib/assets/icons';

export const merchantNav: NavGroup[] = [
	{
		title: 'Overview',
		items: [{ title: 'Dashboard', href: '/merchant', icon: LayoutDashboard }]
	},
	{
		title: 'Payments',
		items: [
			{ title: 'Funds', href: '/merchant/funds', icon: Wallet },
			{ title: 'Transactions', href: '/merchant/transactions', icon: ArrowLeftRight },
			{ title: 'Collections', href: '/merchant/collections', icon: Receipt },
			{ title: 'Disputes', href: '/merchant/disputes', icon: MessageSquareWarning },
			{ title: 'Settlements', href: '/merchant/settlements', icon: Landmark }
		]
	},
	{
		title: 'Analytics',
		items: [{ title: 'Reports', href: '/merchant/reports', icon: FileText }]
	},
	{
		title: 'Administration',
		items: [
			{ title: 'User Management', href: '/merchant/users', icon: Users },
			{ title: 'Role Management', href: '/merchant/roles', icon: ShieldCheck }
		]
	}
	// {
	// 	title: 'Configuration',
	// 	items: [{ title: 'Settings', href: '/merchant/settings', icon: Settings }]
	// }
];
