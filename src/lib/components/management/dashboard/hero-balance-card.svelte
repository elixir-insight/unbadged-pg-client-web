<script module lang="ts">
	export type HeroRange = '7d' | '30d' | '90d';

	export interface HeroPoint {
		label: string;
		inflow: number;
		outflow: number;
	}

	export interface HeroRangeData {
		points: HeroPoint[];
		delta: string;
	}
</script>

<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import { AreaChart } from 'layerchart';
	import { TrendingUp } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let {
		value,
		ranges,
		class: className
	}: {
		value: string;
		ranges: Record<HeroRange, HeroRangeData>;
		class?: string;
	} = $props();

	let selectedRange = $state<HeroRange>('7d');

	const rangeLabels: Record<HeroRange, string> = { '7d': '7D', '30d': '30D', '90d': '90D' };
	const rangeOrder: HeroRange[] = ['7d', '30d', '90d'];

	const activeData = $derived(ranges[selectedRange]);

	const chartConfig = {
		inflow: { label: 'Inflows', color: 'var(--chart-1)' },
		outflow: { label: 'Outflows', color: 'var(--chart-4)' }
	} satisfies Chart.ChartConfig;
</script>

<div
	class={cn(
		'relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-primary/15 bg-card p-4 shadow-md',
		className
	)}
	style="background-image: radial-gradient(120% 100% at 0% 0%, color-mix(in oklch, var(--primary), transparent 92%) 0%, transparent 60%);"
>
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="min-w-0">
			<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				Escrow balance
			</p>
			<div class="mt-1 flex flex-wrap items-baseline gap-2">
				<p
					class="text-[clamp(1.5rem,5vw,2.25rem)] font-bold tracking-tight tabular-nums text-foreground"
				>
					{value}
				</p>
				<span
					class="flex items-center gap-0.5 rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-xs font-semibold text-emerald-600 tabular-nums dark:text-emerald-400"
				>
					<TrendingUp class="size-3" aria-hidden="true" />
					{activeData.delta}
				</span>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<div class="flex items-center gap-3 text-[11px] text-muted-foreground">
				<span class="flex items-center gap-1.5">
					<span class="size-2 rounded-full" style="background: var(--chart-1)" aria-hidden="true"
					></span>
					Inflows
				</span>
				<span class="flex items-center gap-1.5">
					<span class="size-2 rounded-full" style="background: var(--chart-4)" aria-hidden="true"
					></span>
					Outflows
				</span>
			</div>

			<div
				class="flex items-center rounded-lg border border-border bg-muted/60 p-0.5"
				role="tablist"
			>
				{#each rangeOrder as range (range)}
					<button
						type="button"
						role="tab"
						aria-selected={selectedRange === range}
						onclick={() => (selectedRange = range)}
						class={cn(
							'rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
							selectedRange === range
								? 'bg-card text-foreground shadow-xs'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						{rangeLabels[range]}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-2 min-h-0 flex-1">
		<Chart.Container config={chartConfig} class="h-full w-full">
			<AreaChart
				data={activeData.points}
				x="label"
				series={[
					{ key: 'inflow', label: 'Inflows', color: chartConfig.inflow.color },
					{ key: 'outflow', label: 'Outflows', color: chartConfig.outflow.color }
				]}
				seriesLayout="overlap"
				grid={{ x: false, y: true }}
				rule={false}
				axis={true}
				padding={{ left: 40, bottom: 28 }}
				props={{
					area: {
						'fill-opacity': 0.16,
						line: { class: 'stroke-2' },
						motion: 'tween'
					}
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip indicator="line" />
				{/snippet}
			</AreaChart>
		</Chart.Container>
	</div>
</div>
