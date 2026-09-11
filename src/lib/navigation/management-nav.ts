import type { NavGroup } from './types';
import {
	LayoutDashboard,
	Building2,
	Users,
	ShieldCheck,
	// Wallet,
	// Send,
	ArrowLeftRight,
	TrendingUp,
	MessageSquareWarning,
	Landmark,
	FileText
	// Fingerprint,
	// CircleCheck
} from '$lib/assets/icons';

export const managementNav: NavGroup[] = [
	{
		title: 'Overview',
		items: [{ title: 'Dashboard', href: '/management', icon: LayoutDashboard }]
	},
	{
		title: 'Organization',
		items: [
			{
				title: 'Organizations',
				href: '/management/organizations',
				icon: Building2,
				requiredPermission: { module: 'ORGANIZATION', action: 'read' }
			}
		]
	},
	{
		title: 'Access Control',
		items: [
			{
				title: 'User Management',
				href: '/management/user-management',
				icon: Users,
				requiredPermission: { module: 'USER_MANAGEMENT', action: 'read' },
				breadcrumbChildren: [
					{
						matcher: /^\/management\/user-management\/view-user\/[^/]+$/,
						title: 'View User'
					},
					{
						matcher: /^\/management\/user-management\/edit-user\/[^/]+$/,
						title: 'Edit User'
					}
				]
			},
			{
				title: 'Role Management',
				href: '/management/role-management',
				icon: ShieldCheck,
				requiredPermission: { module: 'ROLE_MANAGEMENT', action: 'read' },
				breadcrumbChildren: [
					{
						matcher: /^\/management\/role-management\/view-role\/[^/]+$/,
						title: 'View Role'
					},
					{
						matcher: /^\/management\/role-management\/edit-role\/[^/]+$/,
						title: 'Edit Role'
					},
					{
						matcher: /^\/management\/role-management\/edit-role\/[^/]+\/preview$/,
						title: 'Preview'
					}
				]
			}
		]
	},
	{
		title: 'Financial Operations',
		items: [
			// { title: 'Wallet Management', href: '/management/wallets', icon: Wallet },
			// {
			// 	title: 'Fund Transfer',
			// 	href: '/management/fund-transfer',
			// 	icon: Send,
			// 	service: 'payout'
			// },
			{
				title: 'Transactions',
				href: '/management/transactions',
				icon: ArrowLeftRight,
				requiredPermissionAnyOf: [
					{ module: 'PAYINS', action: 'read' },
					{ module: 'PAYOUTS', action: 'read' }
				],
				breadcrumbChildren: [
					{
						matcher: /^\/management\/transactions\/collections$/,
						title: 'Collections'
					},
					{
						matcher: /^\/management\/transactions\/disbursements$/,
						title: 'Disbursements'
					},
					{
						matcher: /^\/management\/transactions\/collections\/orders\/[^/]+$/,
						title: 'Order Details'
					},
					{
						matcher: /^\/management\/transactions\/collections\/payments\/[^/]+$/,
						title: 'Payment Details'
					},
					{
						matcher: /^\/management\/transactions\/disbursements\/[^/]+$/,
						title: 'Transaction Details'
					}
				]
			},
			// Transaction Insights omitted from nav for now
			{
				title: 'Transaction Insights',
				href: '/management/transaction-insights',
				icon: TrendingUp,
				breadcrumbChildren: [
					{
						matcher: /^\/management\/transaction-insights\/[^/]+$/,
						title: 'Merchant Calendar'
					}
				]
			},
			// Dispute omitted from nav until backend API is ready
			{
				title: 'Disputes',
				href: '/management/dispute',
				icon: MessageSquareWarning,
				service: 'payin',
				requiredPermission: { module: 'PAYINS', action: 'read' },
				breadcrumbChildren: [
					{
						matcher: /^\/management\/dispute\/[^/]+$/,
						title: 'View Dispute'
					}
				]
			},
			{
				title: 'Settlements',
				href: '/management/settlements',
				icon: Landmark,
				service: 'payin',
				requiredPermission: { module: 'PAYINS', action: 'read' },
				breadcrumbChildren: [
					{
						matcher: /^\/management\/settlements\/[^/]+$/,
						title: 'Settlement Details'
					}
				]
			}
		]
	},
	{
		title: 'Monitoring',
		items: [
			{
				title: 'Reports',
				href: '/management/reports',
				icon: FileText,
				requiredPermission: { module: 'REPORTS', action: 'read' }
			}
			// { title: 'KYC Verification', href: '/management/kyc', icon: Fingerprint },
			// { title: 'Check Status', href: '/management/check-status', icon: CircleCheck }
		]
	}
];
