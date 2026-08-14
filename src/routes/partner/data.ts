// TEMP: dummy data until /partner/dashboard API. Replace fetchDashboardSummary() body only —
// keep the return type identical.

import type { FetchDashboardSummaryResponse } from './types';

const DASHBOARD_SUMMARY: FetchDashboardSummaryResponse = {
	kpis: [
		{
			label: 'Total Commission',
			value: '₹4,82,500',
			subText: 'Across 12 merchants'
		},
		{
			label: 'This Month',
			value: '₹1,24,000',
			trend: 'up',
			trendLabel: '+18.4%',
			subText: 'vs last month'
		},
		{
			label: 'Total Volume',
			value: '₹95,00,000',
			subText: 'Last 6 months'
		},
		{
			label: 'Active Merchants',
			value: '12',
			subText: 'Processing transactions'
		}
	],
	commissionTrend: {
		title: 'Commission Trend',
		description: 'Last 6 months',
		color: 'chart-1',
		data: [
			{ label: 'Jan', value: 42000 },
			{ label: 'Feb', value: 58000 },
			{ label: 'Mar', value: 51000 },
			{ label: 'Apr', value: 73000 },
			{ label: 'May', value: 68000 },
			{ label: 'Jun', value: 82000 }
		],
		emptyMessage: 'No commission data for this period'
	},
	volumeByPaymentMethod: {
		centerLabel: 'Total Volume',
		segments: [
			{ label: 'UPI', value: 420000 },
			{ label: 'Cards', value: 280000 },
			{ label: 'Net Banking', value: 160000 },
			{ label: 'Wallets', value: 90000 }
		],
		emptyMessage: 'No payment method breakdown available'
	},
	referralVolumeTrend: {
		title: 'Referral Volume',
		description: 'Monthly referred GMV',
		color: 'chart-2',
		data: [
			{ label: 'Jan', value: 820000 },
			{ label: 'Feb', value: 960000 },
			{ label: 'Mar', value: 1140000 },
			{ label: 'Apr', value: 1080000 },
			{ label: 'May', value: 1320000 },
			{ label: 'Jun', value: 1480000 }
		],
		emptyMessage: 'No referral volume data for this period'
	},
	merchantsByStatus: {
		centerLabel: 'Merchants',
		segments: [
			{ label: 'Active', value: 12 },
			{ label: 'Pending', value: 5 },
			{ label: 'Inactive', value: 3 },
			{ label: 'Rejected', value: 2 }
		],
		emptyMessage: 'No merchant status breakdown available'
	}
};

export function fetchDashboardSummary(): Promise<FetchDashboardSummaryResponse> {
	return Promise.resolve(DASHBOARD_SUMMARY);
}
