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
	import { curveMonotoneX } from 'd3-shape';
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
		inflow: { label: 'Inflows', color: 'var(--chart-2)' },
		outflow: { label: 'Outflows', color: 'var(--chart-4)' }
	} satisfies Chart.ChartConfig;

	function formatINR(amount: number): string {
		const rounded = Math.round(amount * 10) / 10;
		return `₹${rounded}L`;
	}

	const totals = $derived({
		inflow: activeData.points.reduce((sum, p) => sum + p.inflow, 0),
		outflow: activeData.points.reduce((sum, p) => sum + p.outflow, 0)
	});
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
			<div class="mt-1 flex flex-wrap items-baseline gap-2.5">
				<p
					class="font-serif text-[clamp(1rem,6vw,2rem)] leading-none font-bold tracking-tight tabular-nums text-foreground"
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

		<div class="flex items-center rounded-lg border border-border bg-muted/60 p-0.5" role="tablist">
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

	<div class="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
		<span class="flex items-center gap-1.5">
			<span
				class="size-2 rounded-full"
				style:background-color={chartConfig.inflow.color}
				aria-hidden="true"
			></span>
			Inflows
			<span class="font-semibold text-foreground tabular-nums">{formatINR(totals.inflow)}</span>
		</span>
		<span class="flex items-center gap-1.5">
			<span
				class="h-0 w-2.5 border-t-2 border-dashed"
				style:border-color={chartConfig.outflow.color}
				aria-hidden="true"
			></span>
			Outflows
			<span class="font-semibold text-foreground tabular-nums">{formatINR(totals.outflow)}</span>
		</span>
	</div>

	<div class="mt-2 min-h-0 flex-1">
		<Chart.Container config={chartConfig} class="h-full w-full">
			<AreaChart
				data={activeData.points}
				x="label"
				series={[
					{
						key: 'inflow',
						label: 'Inflows',
						color: chartConfig.inflow.color,
						props: {
							'fill-opacity': 0.16,
							line: { class: 'stroke-2' }
						}
					},
					{
						key: 'outflow',
						label: 'Outflows',
						color: chartConfig.outflow.color,
						props: {
							'fill-opacity': 0,
							line: { class: 'stroke-2', 'stroke-dasharray': '6 4' }
						}
					}
				]}
				seriesLayout="overlap"
				grid={{ x: false, y: true }}
				rule={false}
				axis={true}
				padding={{ left: 44, bottom: 28 }}
				props={{
					area: {
						motion: 'tween',
						curve: curveMonotoneX
					},
					yAxis: { format: (d: number) => formatINR(d) }
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip indicator="dashed">
						{#snippet formatter({ value: itemValue, name, item })}
							<div class="flex w-full flex-1 items-center justify-between gap-3">
								<span class="flex items-center gap-1.5 text-muted-foreground">
									<span
										class="size-2 shrink-0 rounded-full"
										style:background-color={item.color}
										aria-hidden="true"
									></span>
									{name}
								</span>
								<span class="font-mono font-medium tabular-nums text-foreground">
									{formatINR(itemValue as number)}
								</span>
							</div>
						{/snippet}
					</Chart.Tooltip>
				{/snippet}
			</AreaChart>
		</Chart.Container>
	</div>
</div>
