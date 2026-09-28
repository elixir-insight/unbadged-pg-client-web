import type { NavGroup } from './types';
import {
	LayoutDashboard,
	Handshake,
	//  Coins, Landmark,
	TrendingUp
} from '$lib/assets/icons';

export const partnerNav: NavGroup[] = [
	{
		title: 'Overview',
		items: [{ title: 'Dashboard', href: '/partner', icon: LayoutDashboard }]
	},
	{
		title: 'Business',
		items: [
			{ title: 'Referrals', href: '/partner/referrals', icon: Handshake }
			// { title: 'Commission', href: '/partner/commission', icon: Coins },
			// { title: 'Settlements', href: '/partner/settlements', icon: Landmark }
		]
	},
	{
		title: 'Analytics',
		items: [
			{ title: 'Transaction Insights', href: '/partner/transaction-insights', icon: TrendingUp }
		]
	}
];
