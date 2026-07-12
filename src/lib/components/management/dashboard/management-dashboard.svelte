<script lang="ts">
	import {
		CheckCircle2,
		Download,
		Landmark,
		RefreshCw,
		TrendingUp,
		UserPlus
	} from '$lib/assets/icons';
	import HeroBalanceCard, { type HeroRange, type HeroRangeData } from './hero-balance-card.svelte';
	import SecondaryStats, { type SecondaryStat } from './secondary-stats.svelte';
	import ActionCenterCard from './action-center-card.svelte';
	import type { QuickAction } from './quick-actions.svelte';
	import VanAccountsCard, { type VanAccount } from './van-accounts-card.svelte';
	import PipelineStatusCard, {
		type OnboardingStage,
		type OrgProfileStatusItem
	} from './pipeline-status-card.svelte';
	import RecentActivityCard, { type ActivityItem } from './recent-activity-card.svelte';

	let {
		userName = 'Sarah'
	}: {
		userName?: string;
	} = $props();

	const heroRanges: Record<HeroRange, HeroRangeData> = {
		'7d': {
			delta: '+4.2% wk',
			points: [
				{ label: 'Mon', inflow: 3.8, outflow: 2.1 },
				{ label: 'Tue', inflow: 4.2, outflow: 2.4 },
				{ label: 'Wed', inflow: 3.9, outflow: 2.0 },
				{ label: 'Thu', inflow: 4.6, outflow: 2.8 },
				{ label: 'Fri', inflow: 5.1, outflow: 2.6 },
				{ label: 'Sat', inflow: 3.2, outflow: 1.4 },
				{ label: 'Sun', inflow: 3.6, outflow: 1.7 }
			]
		},
		'30d': {
			delta: '+9.1% mo',
			points: [
				{ label: 'W1', inflow: 22, outflow: 14 },
				{ label: 'W2', inflow: 26, outflow: 16 },
				{ label: 'W3', inflow: 24, outflow: 15 },
				{ label: 'W4', inflow: 29, outflow: 18 }
			]
		},
		'90d': {
			delta: '+14.8% qtr',
			points: [
				{ label: 'Apr', inflow: 78, outflow: 52 },
				{ label: 'May', inflow: 86, outflow: 58 },
				{ label: 'Jun', inflow: 91, outflow: 60 }
			]
		}
	};

	const secondaryStats: SecondaryStat[] = [
		{
			label: "Today's volume",
			value: '₹12.8L',
			trend: '↑ 12.6% wk',
			trendDirection: 'up',
			icon: TrendingUp
		},
		{
			label: 'Revenue (MTD)',
			value: '₹4.86L',
			trend: '↑ 8.4% wk',
			trendDirection: 'up',
			icon: Landmark
		},
		{
			label: 'Success rate',
			value: '98.4%',
			trend: '↑ 0.6% wk',
			trendDirection: 'up',
			icon: CheckCircle2
		}
	];

	const quickActions: QuickAction[] = [
		{
			id: 'new-org',
			label: 'New organization',
			description: 'Start onboarding a merchant',
			icon: UserPlus,
			href: '/management/onboarding/create-organization'
		},
		{
			id: 'settlements',
			label: 'View settlements',
			description: "Check today's payout schedule",
			icon: Landmark,
			href: '/management/settlements'
		},
		{
			id: 'export',
			label: 'Export report',
			description: 'Download MTD performance summary',
			icon: Download,
			href: '/management/reports'
		}
	];

	const accounts: VanAccount[] = [
		{
			id: 'van-1',
			bankName: 'HDFC Bank',
			accountNumber: '120034567891',
			ifsc: 'HDFC0001234',
			cardName: 'Pinpay Technologies',
			purpose: 'Collections',
			type: 'Current',
			status: 'active',
			txToday: 256000,
			txLimit: 3000000
		},
		{
			id: 'van-2',
			bankName: 'ICICI Bank',
			accountNumber: '518293410827',
			ifsc: 'ICIC0005678',
			cardName: 'Pinpay Technologies',
			purpose: 'Settlements',
			type: 'Current',
			status: 'active',
			txToday: 891000,
			txLimit: 5000000
		},
		{
			id: 'van-3',
			bankName: 'Axis Bank',
			accountNumber: '338100426670',
			ifsc: 'UTIB0002291',
			cardName: 'Pinpay Technologies',
			purpose: 'Vendor Pay',
			type: 'Current',
			status: 'active',
			txToday: 45000,
			txLimit: 1000000
		}
	];

	const onboardingStages: OnboardingStage[] = [
		{ stage: 'In review', count: 210, color: 'var(--chart-1)' },
		{ stage: 'Remarked', count: 340, color: 'var(--chart-2)' },
		{ stage: 'In progress', count: 380, color: 'var(--chart-3)' },
		{ stage: 'Approved', count: 235, color: 'var(--chart-4)' }
	];
	const totalInPipeline = onboardingStages.reduce((sum, stage) => sum + stage.count, 0);

	const orgProfileStatus: OrgProfileStatusItem[] = [
		{ status: 'Active', count: 66, percentage: 66, color: 'var(--chart-1)' },
		{ status: 'On hold', count: 24, percentage: 24, color: 'var(--chart-2)' },
		{ status: 'Inactive', count: 10, percentage: 10, color: 'var(--chart-4)' }
	];

	const recentActivity: ActivityItem[] = [
		{
			id: 'act-1',
			type: 'onboarding',
			title: 'New organization submitted',
			description: 'Northwind Retail completed KYB documentation',
			timestamp: '2m ago'
		},
		{
			id: 'act-2',
			type: 'settlement',
			title: 'Settlement processed',
			description: '₹8.6L settled to ICICI Bank VAN',
			timestamp: '18m ago'
		},
		{
			id: 'act-3',
			type: 'transaction',
			title: 'High-value transaction flagged',
			description: '₹4.2L collection from Pinpay Technologies',
			timestamp: '34m ago'
		},
		{
			id: 'act-4',
			type: 'alert',
			title: 'Reconciliation mismatch',
			description: 'Axis Bank VAN off by ₹1,200 for Jul 12',
			timestamp: '1h ago'
		},
		{
			id: 'act-5',
			type: 'onboarding',
			title: 'Organization approved',
			description: 'Bluewave Logistics moved to Approved',
			timestamp: '2h ago'
		},
		{
			id: 'act-6',
			type: 'settlement',
			title: 'Payout schedule updated',
			description: 'Vendor Pay VAN switched to daily settlement',
			timestamp: '3h ago'
		}
	];
</script>

<div class="flex h-full min-h-0 flex-col gap-3">
	<!-- Page header -->
	<div class="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-[clamp(1.125rem,3vw,1.25rem)] font-bold text-foreground">
				Welcome back, {userName}
			</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">
				Here's how your payment platform is performing today.
			</p>
		</div>
		<div class="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
			<RefreshCw class="size-3.5" aria-hidden="true" />
			Updated just now
		</div>
	</div>

	<!-- Focal row: escrow balance trend / secondary KPIs / quick actions -->
	<div
		class="grid min-h-0 flex-9 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1.2fr] xl:max-h-[min(42vh,700px)]"
	>
		<HeroBalanceCard
			value="₹28.4L"
			ranges={heroRanges}
			class="min-h-70 md:col-span-2 md:min-h-80 xl:col-span-1 xl:min-h-0"
		/>
		<SecondaryStats stats={secondaryStats} class="min-h-0" />
		<ActionCenterCard {quickActions} class="min-h-0" />
	</div>

	<!-- Operational row: VAN accounts / pipeline & profile status / recent activity -->
	<div
		class="grid min-h-0 flex-11 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1fr] xl:max-h-[min(51vh,850px)]"
	>
		<VanAccountsCard {accounts} class="min-h-0" />
		<PipelineStatusCard
			{onboardingStages}
			{totalInPipeline}
			{orgProfileStatus}
			class="min-h-70 md:min-h-0"
		/>
		<RecentActivityCard
			activities={recentActivity}
			class="min-h-70 md:col-span-2 xl:col-span-1 xl:min-h-0"
		/>
	</div>
</div>
