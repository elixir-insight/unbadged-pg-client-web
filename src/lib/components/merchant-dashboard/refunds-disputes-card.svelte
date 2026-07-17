<script lang="ts">
	import { PieChart } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { cn } from '$lib/utils';

	interface Props {
		open: number;
		pending: number;
		resolved: number;
		avgResolutionTime: string;
		class?: string;
	}

	let { open, pending, resolved, avgResolutionTime, class: className }: Props = $props();

	const chartConfig = {
		open: { label: 'Open', color: 'var(--color-chart-1)' },
		pending: { label: 'Pending', color: 'var(--color-chart-2)' },
		resolved: { label: 'Resolved', color: 'var(--color-chart-3)' }
	} satisfies Chart.ChartConfig;

	const data = $derived([
		{ key: 'open', label: chartConfig.open.label, value: open },
		{ key: 'pending', label: chartConfig.pending.label, value: pending },
		{ key: 'resolved', label: chartConfig.resolved.label, value: resolved }
	]);

	const cRange = [chartConfig.open.color, chartConfig.pending.color, chartConfig.resolved.color];

	const total = $derived(open + pending + resolved);
</script>

<div
	class={cn(
		'flex h-full min-h-0 flex-col rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<p class="shrink-0 text-sm font-semibold">Dispute overview</p>

	<div class="flex min-h-0 flex-col m-4 sm:mt-2 sm:flex-1 items-center justify-center gap-4">
		<div class="relative aspect-square h-full min-h-24 max-h-36 w-auto min-w-24">
			<Chart.Container config={chartConfig} class="aspect-auto size-full">
				<PieChart {data} key="key" value="value" c="key" {cRange} innerRadius={-20} padAngle={0.02}>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel nameKey="key" />
					{/snippet}
				</PieChart>
			</Chart.Container>
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<span class="text-xl font-bold tracking-tight">{total}</span>
				<span class="text-xs text-muted-foreground">total</span>
			</div>
		</div>

		<div class="flex flex-col gap-2 text-sm">
			{#each data as item, i (item.key)}
				<div class="flex items-center gap-1.5">
					<span class="size-2 shrink-0 rounded-full" style="background-color: {cRange[i]}"></span>
					<span class="text-muted-foreground">{item.label}</span>
					<span class="font-semibold">{item.value}</span>
				</div>
			{/each}
		</div>
	</div>

	<div
		class="mt-1.5 flex shrink-0 items-center justify-between border-t border-border/60 pt-1.5 text-xs"
	>
		<span class="text-muted-foreground">Avg. resolution time</span>
		<span class="font-semibold">{avgResolutionTime}</span>
	</div>
</div>
