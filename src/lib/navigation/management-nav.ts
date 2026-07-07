import type { NavGroup } from './types';
import {
	LayoutDashboard,
	ClipboardCheck,
	Building2,
	ShieldCheck,
	ArrowDownToLine,
	ArrowUpFromLine,
	FileText,
	Users
} from '$lib/assets/icons';

export const managementNav: NavGroup[] = [
	{
		title: 'Overview',
		items: [{ title: 'Dashboard', href: '/management', icon: LayoutDashboard }]
	},
	{
		title: 'Client',
		items: [
			{ title: 'Onboarding', href: '/management/onboarding', icon: ClipboardCheck },
			{ title: 'Organizations', href: '/management/organizations', icon: Building2 },
			{ title: 'Recent Reports', href: '/management/reports', icon: FileText }
		]
	},
	{
		title: 'Services',
		items: [
			{
				title: 'PayIn Service',
				href: '/management/refunds',
				icon: ArrowDownToLine,
				children: [
					{ title: 'Transactions', href: '/management/transactions' },
					{ title: 'Refunds', href: '/management/refunds' },
					{ title: 'Settlements', href: '/management/settlements' }
				]
			},
			{
				title: 'Payout Service',
				href: '/management/fund-transfer',
				icon: ArrowUpFromLine
			},
			{ title: 'User Management', href: '/management/users', icon: Users },
			{ title: 'Role Management', href: '/management/role-management', icon: ShieldCheck }
		]
	},
	{
		title: 'Access',
		items: [{ title: 'Role Management', href: '/management/roles', icon: ShieldCheck }]
	}
];
