import type { NavGroup } from './types';
import {
	LayoutDashboard,
	ClipboardCheck,
	Building2,
	Users,
	ShieldCheck,
	Wallet,
	Send,
	ArrowLeftRight,
	TrendingUp,
	Landmark,
	FileText,
	Fingerprint,
	CircleCheck,
	Receipt,
	RotateCcw,
	Handshake
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
				title: 'Onboarding',
				href: '/management/onboarding',
				icon: ClipboardCheck,
				breadcrumbChildren: [
					{
						matcher: /^\/management\/onboarding\/[^/]+$/,
						title: 'Onboarding Details'
					}
				]
			},
			{
				title: 'Organizations',
				href: '/management/organization',
				icon: Building2,
				breadcrumbChildren: [
					{
						matcher: /^\/management\/organization\/[^/]+$/,
						title: 'Organization Details'
					}
				]
			},
			{
				title: 'Virtual Account Management',
				href: '/management/account-management',
				icon: Wallet
			}
		]
	},
	{
		title: 'Financial Operations',
		items: [
			{
				title: 'Collections',
				href: '/management/transactions',
				icon: Receipt,
				children: [
					{ title: 'Transactions', href: '/management/transactions', icon: ArrowLeftRight },
					{ title: 'Refunds', href: '/management/refunds', icon: RotateCcw },
					{ title: 'Settlements', href: '/management/settlements', icon: Landmark }
				]
			},
			{
				title: 'Disbursements',
				href: '/management/fund-transfer',
				icon: Send,
				children: [
					{
						title: 'Transaction Insights',
						href: '/management/transaction-insights',
						icon: TrendingUp
					},
					{ title: 'Fund Transfer', href: '/management/fund-transfer', icon: Send },
					{
						title: 'Partner Settlements',
						href: '/management/partner-settlements',
						icon: Handshake
					}
				]
			}
		]
	},
	{
		title: 'Monitoring',
		items: [
			{ title: 'Reports', href: '/management/reports', icon: FileText },
			{ title: 'KYC Verification', href: '/management/kyc', icon: Fingerprint },
			{ title: 'Check Status', href: '/management/check-status', icon: CircleCheck }
		]
	},
	{
		title: 'Access Control',
		items: [
			{
				title: 'User Management',
				href: '/management/user-management',
				icon: Users,
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
	}
];
