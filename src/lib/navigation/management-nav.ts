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
	CircleCheck
} from '$lib/assets/icons';

export const managementNav: NavGroup[] = [
	{
		title: 'Overview',
		items: [{ title: 'Dashboard', href: '/management', icon: LayoutDashboard }]
	},
	{
		title: 'Organization',
		items: [
			{ title: 'Onboarding', href: '/management/onboarding', icon: ClipboardCheck },
			{ title: 'Organizations', href: '/management/organizations', icon: Building2 }
		]
	},
	{
		title: 'Access Control',
		items: [
			{ title: 'User Management', href: '/management/users', icon: Users },
			{ title: 'Role Management', href: '/management/role-management', icon: ShieldCheck }
		]
	},
	{
		title: 'Financial Operations',
		items: [
			{ title: 'Wallet Management', href: '/management/wallets', icon: Wallet },
			{ title: 'Fund Transfer', href: '/management/fund-transfer', icon: Send },
			{
				title: 'Transactions',
				href: '/management/transactions',
				icon: ArrowLeftRight,
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
			{ title: 'Transaction Insights', href: '/management/transaction-insights', icon: TrendingUp },
			{ title: 'Settlements', href: '/management/settlements', icon: Landmark }
		]
	},
	{
		title: 'Monitoring',
		items: [
			{ title: 'Reports', href: '/management/reports', icon: FileText },
			{ title: 'KYC Verification', href: '/management/kyc', icon: Fingerprint },
			{ title: 'Check Status', href: '/management/check-status', icon: CircleCheck }
		]
	}
];
