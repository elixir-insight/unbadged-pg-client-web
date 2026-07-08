<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ArrowRight, CheckCircle2, FileText, Landmark, TrendingUp } from '$lib/assets/icons';
	import { Button } from '$lib/components/reusable';
	import KpiCard, { type KpiCardData } from './kpi-card.svelte';
	import VanAccountsCard, { type VanAccount } from './van-accounts-card.svelte';
	import OrgProfileStatusChart from './org-profile-status-chart.svelte';
	import type { OrgProfileStatusItem } from './org-profile-status-chart.svelte';
	import OnboardingStatusChart from './onboarding-status-chart.svelte';
	import type { OnboardingStage } from './onboarding-status-chart.svelte';

	let {
		userName = 'Sarah'
	}: {
		userName?: string;
	} = $props();

	const primaryKpis: KpiCardData[] = [
		{
			label: 'Escrow balance',
			value: '₹28.4L',
			trend: '↑ 4.2% wk',
			trendDirection: 'up',
			icon: FileText
		},
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
	const orgProfileStatus: OrgProfileStatusItem[] = [
		{ status: 'Active', count: 66, percentage: 66, color: 'var(--chart-1)' },
		{ status: 'On hold', count: 24, percentage: 24, color: 'var(--chart-2)' },
		{ status: 'Inactive', count: 10, percentage: 10, color: 'var(--chart-4)' }
	];

	const onboardingStages: OnboardingStage[] = [
		{ stage: 'In review', count: 210 },
		{ stage: 'Remarked', count: 340 },
		{ stage: 'In progress', count: 380 },
		{ stage: 'Approved', count: 235 }
	];
</script>

<div class="flex h-full flex-col gap-4">
	<!-- Page header -->
	<div class="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-xl font-bold text-foreground">Welcome back, {userName}</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">
				Here's how your payment platform is performing today.
			</p>
		</div>
		<Button
			variant="outline"
			class="shrink-0 gap-2"
			onclick={() => goto(resolve('/management/onboarding/create-organization'))}
		>
			New organization
			<ArrowRight class="size-4" />
		</Button>
	</div>

	<!-- KPI cards / My VAN accounts -->
	<div
		class="grid min-h-0 flex-[1.3] grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)]"
	>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each primaryKpis as kpi (kpi.label)}
				<KpiCard {...kpi} />
			{/each}
		</div>

		<VanAccountsCard {accounts} />
	</div>

	<!-- Onboarding status + Organization profile status -->
	<div class="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
		<OnboardingStatusChart data={onboardingStages} totalInPipeline={1165} />
		<OrgProfileStatusChart data={orgProfileStatus} />
	</div>
</div>
