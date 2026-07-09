<script lang="ts">
	import {
		CheckCircle2,
		Download,
		Landmark,
		RefreshCw,
		ShieldCheck,
		TrendingUp,
		UserPlus
	} from '$lib/assets/icons';
	import { Chip } from '$lib/components/reusable';
	import HeroBalanceCard, { type HeroRange, type HeroRangeData } from './hero-balance-card.svelte';
	import SecondaryStats, { type SecondaryStat } from './secondary-stats.svelte';
	import ActionCenterCard from './action-center-card.svelte';
	import type { QuickAction } from './quick-actions.svelte';
	import VanAccountsCard, { type VanAccount } from './van-accounts-card.svelte';
	import OnboardingStatusChart, { type OnboardingStage } from './onboarding-status-chart.svelte';
	import OrgProfileStatusChart, {
		type OrgProfileStatusItem
	} from './org-profile-status-chart.svelte';

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
			id: 'review-kyc',
			label: 'Review KYC queue',
			description: '5 documents awaiting verification',
			icon: ShieldCheck,
			href: '/management/kyc'
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
		{ stage: 'In review', count: 210 },
		{ stage: 'Remarked', count: 340 },
		{ stage: 'In progress', count: 380 },
		{ stage: 'Approved', count: 235 }
	];
	const totalInPipeline = onboardingStages.reduce((sum, stage) => sum + stage.count, 0);
	const approvedCount = onboardingStages.find((stage) => stage.stage === 'Approved')?.count ?? 0;
	const onboardingPercentComplete = Math.round((approvedCount / totalInPipeline) * 100);

	const orgProfileStatus: OrgProfileStatusItem[] = [
		{ status: 'Active', count: 66, percentage: 66, color: 'var(--chart-1)' },
		{ status: 'On hold', count: 24, percentage: 24, color: 'var(--chart-2)' },
		{ status: 'Inactive', count: 10, percentage: 10, color: 'var(--chart-4)' }
	];
</script>

<div class="flex h-full min-h-0 flex-col gap-3">
	<!-- Page header -->
	<div class="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-xl font-bold text-foreground">Welcome back, {userName}</h1>
				<Chip variant="success" class="gap-1">
					<CheckCircle2 />
					Org active · KYC verified
				</Chip>
			</div>
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
	<div class="grid min-h-0 flex-9 grid-cols-1 gap-3 xl:grid-cols-[1.8fr_1fr_1.2fr]">
		<HeroBalanceCard value="₹28.4L" ranges={heroRanges} class="min-h-0" />
		<SecondaryStats stats={secondaryStats} class="min-h-0" />
		<ActionCenterCard {quickActions} class="min-h-0" />
	</div>

	<!-- Operational row: VAN accounts / onboarding / org profile -->
	<div class="grid min-h-0 flex-11 grid-cols-1 gap-3 xl:grid-cols-[1fr_1.2fr_1fr]">
		<VanAccountsCard {accounts} class="min-h-0" />
		<OnboardingStatusChart
			data={onboardingStages}
			{totalInPipeline}
			percentComplete={onboardingPercentComplete}
			class="min-h-0"
		/>
		<OrgProfileStatusChart data={orgProfileStatus} class="min-h-0" />
	</div>
</div>
