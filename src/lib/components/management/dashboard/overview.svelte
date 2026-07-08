<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ArrowRight, CheckCircle2, FileText, Landmark, TrendingUp } from '$lib/assets/icons';
	import * as Chart from '$lib/components/ui/chart';
	import { PieChart, BarChart } from 'layerchart';
	import VanAccountsCard, { type VanAccount } from './van-accounts-card.svelte';

	let {
		userName = 'Sarah'
	}: {
		userName?: string;
	} = $props();

	const kpis = [
		{
			label: 'Escrow balance',
			value: '₹28.4L',
			delta: '↑ 4.2% wk',
			positive: true,
			icon: FileText
		},
		{
			label: "Today's volume",
			value: '₹12.8L',
			delta: '↑ 12.6% wk',
			positive: true,
			icon: TrendingUp
		},
		{ label: 'Revenue (MTD)', value: '₹4.86L', delta: '↑ 8.4% wk', positive: true, icon: Landmark },
		{
			label: 'Success rate',
			value: '98.4%',
			delta: '↑ 0.6% wk',
			positive: true,
			icon: CheckCircle2
		}
	];

	const accounts: VanAccount[] = [
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
		},
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
		}
	];

	const orgProfileStatus = [
		{ status: 'Active', percentage: 66, color: '#2a78d6' },
		{ status: 'On hold', percentage: 24, color: '#1baf7a' },
		{ status: 'Inactive', percentage: 10, color: '#eda100' }
	];

	const orgProfileChartConfig = {
		active: { label: 'Active', color: '#2a78d6' },
		on_hold: { label: 'On hold', color: '#1baf7a' },
		inactive: { label: 'Inactive', color: '#eda100' }
	} satisfies Chart.ChartConfig;

	const onboardingStages = [
		{ stage: 'In review', count: 210 },
		{ stage: 'Remarked', count: 340 },
		{ stage: 'In progress', count: 385 },
		{ stage: 'Approved', count: 230 }
	];
	const totalInPipeline = onboardingStages.reduce((sum, s) => sum + s.count, 0);

	const onboardingChartConfig = {
		count: { label: 'Organizations', color: '#2a78d6' }
	} satisfies Chart.ChartConfig;
</script>

<div
	class="flex flex-col gap-2 p-4 text-white"
	style="background:#111110; --border: rgba(255,255,255,0.08); --muted-foreground:#9a9994;"
>
	<!-- ── Header ────────────────────────────────────────────────────────── -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-[18px] leading-tight font-medium text-white">Welcome back, {userName}</h1>
			<p class="mt-0.5 text-[12px] text-[#9a9994]">
				Here's how your payment platform is performing today.
			</p>
		</div>
		<button
			class="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/8 px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-white/5"
			onclick={() => goto(resolve('/management/onboarding/create-organization'))}
		>
			New organization
			<ArrowRight class="size-3" />
		</button>
	</div>

	<!-- ── KPI row: all 4 cards side by side ─────────────────────────────── -->
	<div class="grid grid-cols-4 gap-2">
		{#each kpis as kpi (kpi.label)}
			{@const Icon = kpi.icon}
			<div class="flex flex-col gap-1.5 rounded-lg px-3 py-2.25" style="background:#232322;">
				<div class="flex items-center gap-1.5">
					<Icon class="size-3.25 text-[#9a9994]" />
					<span class="text-[10.5px] text-[#9a9994]">{kpi.label}</span>
				</div>
				<p class="text-[17px] leading-tight font-medium text-white">{kpi.value}</p>
				<span class="text-[10.5px]" style="color:{kpi.positive ? '#1baf7a' : '#e5484d'};"
					>{kpi.delta}</span
				>
			</div>
		{/each}
	</div>

	<!-- ── VAN card + org profile status + onboarding status, in one row ─── -->
	<div class="grid grid-cols-3 items-stretch gap-2">
		<VanAccountsCard {accounts} />

		<!-- Organization profile status -->
		<div class="rounded-xl p-2.75" style="background:#1c1c1b;">
			<p class="text-[12.5px] font-medium text-white">Organization profile status</p>
			<p class="mt-0.5 mb-1.5 text-[11px] text-[#9a9994]">Distribution by state</p>

			<div class="flex items-center gap-3">
				<Chart.Container
					config={orgProfileChartConfig}
					class="aspect-auto h-[100px] w-[100px] shrink-0"
				>
					<PieChart
						data={orgProfileStatus}
						key="status"
						value="percentage"
						c="color"
						innerRadius={25}
						padding={11}
						props={{ pie: { motion: 'tween' } }}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</PieChart>
				</Chart.Container>

				<ul class="flex flex-col gap-[5px]" aria-label="Organization status breakdown">
					{#each orgProfileStatus as item (item.status)}
						<li class="flex items-center gap-1.5 text-[10.5px]">
							<span
								class="size-[7px] shrink-0 rounded-[1px]"
								style:background-color={item.color}
								aria-hidden="true"
							></span>
							<span class="text-[#9a9994]">{item.status} — {item.percentage}%</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Onboarding status -->
		<div class="rounded-xl p-2.75" style="background:#1c1c1b;">
			<p class="text-[12.5px] font-medium text-white">Onboarding status</p>
			<p class="mt-0.5 mb-1.5 text-[11px] text-[#9a9994]">
				{totalInPipeline.toLocaleString()} total in pipeline
			</p>

			<Chart.Container
				config={onboardingChartConfig}
				class="aspect-auto h-[135px] w-full [&_.lc-axis-tick-label]:fill-[#9a9994] [&_.lc-grid-x-rule]:stroke-white/15"
			>
				<BarChart
					data={onboardingStages}
					orientation="horizontal"
					x="count"
					y="stage"
					bandPadding={0.5}
					series={[{ key: 'count', label: 'Organizations', color: '#2a78d6' }]}
					padding={{ left: 4 }}
					grid={{ x: true, y: false }}
					rule={false}
					axis={true}
					props={{
						bars: {
							stroke: 'none',
							radius: 4,
							insets: { left: 4 },
							rounded: 'all',
							initialWidth: 0,
							initialX: 0
						},
						highlight: { area: { fill: 'none' } },
						xAxis: { format: (d: number) => String(d) }
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</BarChart>
			</Chart.Container>
		</div>
	</div>
</div>
