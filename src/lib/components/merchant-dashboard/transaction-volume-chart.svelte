<script module lang="ts">
	export interface TransactionVolumePoint {
		day: string;
		payin: number;
		payout: number;
	}
</script>

<script lang="ts">
	import { LineChart, Spline, Points } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { cn } from '$lib/utils';

	interface Props {
		data: TransactionVolumePoint[];
		title?: string;
		class?: string;
	}

	let { data, title = 'Transaction volume', class: className }: Props = $props();

	type Range = 'today' | '7d' | '30d';
	let range = $state<Range>('today');

	const rangeOptions: { value: Range; label: string }[] = [
		{ value: 'today', label: 'Today' },
		{ value: '7d', label: '7 Days' },
		{ value: '30d', label: '30 Days' }
	];

	// Mock granularity — swap for real range-scoped metrics once the dashboard API is wired up.
	const hourlyWeights = [0.08, 0.15, 0.22, 0.25, 0.18, 0.12];
	const todayData = $derived(
		['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'].map((slot, i) => {
			const latest = data[data.length - 1];
			return {
				day: slot,
				payin: Math.round(latest.payin * hourlyWeights[i]),
				payout: Math.round(latest.payout * hourlyWeights[i])
			};
		})
	);

	const monthData = $derived(
		Array.from({ length: 4 }, (_, i) => {
			const totals = data.reduce(
				(acc, d) => ({ payin: acc.payin + d.payin, payout: acc.payout + d.payout }),
				{ payin: 0, payout: 0 }
			);
			const weekFactor = 0.85 + i * 0.12;
			return {
				day: `Week ${i + 1}`,
				payin: Math.round((totals.payin * weekFactor) / 4),
				payout: Math.round((totals.payout * weekFactor) / 4)
			};
		})
	);

	const chartData = $derived(range === 'today' ? todayData : range === '30d' ? monthData : data);

	const chartConfig = {
		payin: { label: 'Collections', color: 'var(--color-chart-3)' }
	} satisfies Chart.ChartConfig;

	function formatLakhs(value: number) {
		return `${Math.round(value / 100000)}L`;
	}
</script>

<div
	class={cn(
		'flex h-full min-h-0 flex-col rounded-lg border border-border bg-background p-3 shadow-xs',
		className
	)}
>
	<div class="flex items-center justify-between gap-2">
		<p class="text-sm font-semibold">{title}</p>

		<div class="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
			{#each rangeOptions as option (option.value)}
				<button
					type="button"
					onclick={() => (range = option.value)}
					class={cn(
						'rounded-sm px-2 py-1 text-xs font-medium transition-colors',
						range === option.value
							? 'bg-background shadow-xs'
							: 'text-muted-foreground hover:text-foreground'
					)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<Chart.Container config={chartConfig} class="mt-1 aspect-auto min-h-40 w-full min-w-0 flex-1">
		<LineChart
			data={chartData}
			x="day"
			yBaseline={null}
			series={[{ key: 'payin', label: chartConfig.payin.label, color: chartConfig.payin.color }]}
			props={{
				yAxis: { format: formatLakhs },
				xAxis: { format: (d: string) => d }
			}}
		>
			{#snippet marks({ context })}
				{#each context.series.visibleSeries as s (s.key)}
					<Spline seriesKey={s.key} curve={curveNatural} class="stroke-2" />
					<Points seriesKey={s.key} r={4} />
				{/each}
			{/snippet}
			{#snippet tooltip()}
				<Chart.Tooltip />
			{/snippet}
		</LineChart>
	</Chart.Container>
</div>
