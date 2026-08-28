import type { NavGroup } from './types';
import {
	LayoutDashboard,
	ArrowLeftRight,
	MessageSquareWarning,
	Landmark,
	FileText,
	// TrendingUp,
	Users,
	ShieldCheck,
	Link
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
				title: 'Payment Links',
				href: '/merchant/payment-links',
				icon: Link,
				service: 'payin'
			},
			{
				title: 'Dispute',
				href: '/merchant/dispute',
				icon: MessageSquareWarning,
				service: 'payin',
				breadcrumbChildren: [
					{
						matcher: /^\/merchant\/dispute\/[^/]+$/,
						title: 'View Dispute'
					}
				]
			},
			{ title: 'Settlements', href: '/merchant/settlements', icon: Landmark, service: 'payin' }
			// Funds + Beneficiaries intentionally omitted from nav for now
		]
	},
	{
		title: 'Analytics',
		items: [
			// Transaction Insights omitted from nav for now
			// {
			// 	title: 'Transaction Insights',
			// 	href: '/merchant/transaction-insights',
			// 	icon: TrendingUp,
			// 	breadcrumbChildren: [
			// 		{
			// 			matcher: /^\/merchant\/transaction-insights\/[^/]+$/,
			// 			title: 'Merchant Calendar'
			// 		}
			// 	]
			// },
			{ title: 'Reports', href: '/merchant/reports', icon: FileText }
		]
	},
	{
		title: 'Administration',
		items: [
			{
				title: 'User Management',
				href: '/merchant/user-management',
				icon: Users,
				breadcrumbChildren: [
					{
						matcher: /^\/merchant\/user-management\/view-user\/[^/]+$/,
						title: 'View User'
					},
					{
						matcher: /^\/merchant\/user-management\/create-user$/,
						title: 'Create User'
					},
					{
						matcher: /^\/merchant\/user-management\/create-user\/preview$/,
						title: 'Preview'
					},
					{
						matcher: /^\/merchant\/user-management\/edit-user\/[^/]+$/,
						title: 'Edit User'
					},
					{
						matcher: /^\/merchant\/user-management\/edit-user\/[^/]+\/preview$/,
						title: 'Preview'
					}
				]
			},
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
					},
					{
						matcher: /^\/merchant\/role-management\/edit-role\/[^/]+$/,
						title: 'Edit Role'
					},
					{
						matcher: /^\/merchant\/role-management\/edit-role\/[^/]+\/preview$/,
						title: 'Preview'
					}
				]
			}
		]
	}
];
