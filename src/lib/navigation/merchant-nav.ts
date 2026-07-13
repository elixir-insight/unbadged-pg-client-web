import type { NavGroup } from './types';
import {
	LayoutDashboard,
	Wallet,
	ArrowLeftRight,
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
			{
				title: 'Transactions',
				href: '/merchant/transactions',
				icon: ArrowLeftRight,
				breadcrumbChildren: [
					{
						matcher: /^\/merchant\/transactions\/collections$/,
						title: 'Collections'
					},
					{
						matcher: /^\/merchant\/transactions\/disbursements$/,
						title: 'Disbursements'
					},
					{
						matcher: /^\/merchant\/transactions\/collections\/[^/]+$/,
						title: 'Transaction Details'
					},
					{
						matcher: /^\/merchant\/transactions\/disbursements\/[^/]+$/,
						title: 'Transaction Details'
					}
				]
			},
			{
				title: 'Disputes',
				href: '/merchant/disputes',
				icon: MessageSquareWarning,
				service: 'payin'
			},
			{ title: 'Settlements', href: '/merchant/settlements', icon: Landmark, service: 'payin' },
			{ title: 'Funds', href: '/merchant/funds', icon: Wallet, service: 'payout' },
			{
				title: 'Beneficiaries',
				href: '/merchant/beneficiaries',
				icon: Users,
				service: 'payout'
			}
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
			{
				title: 'Role Management',
				href: '/merchant/role-management',
				icon: ShieldCheck,
				breadcrumbChildren: [
					{
						matcher: /^\/merchant\/role-management\/view-role\/[^/]+$/,
						title: 'View Role'
					},
					{
						matcher: /^\/merchant\/role-management\/create-role$/,
						title: 'Create Role'
					},
					{
						matcher: /^\/merchant\/role-management\/create-role\/preview$/,
						title: 'Preview'
					}
				]
			}
		]
	}
];
