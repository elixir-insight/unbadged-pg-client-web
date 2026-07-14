<script lang="ts">
	import { resolve } from '$app/paths';
	import { PieChart } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ArrowRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props {
		open: number;
		pending: number;
		resolved: number;
		attentionText: string;
		class?: string;
	}

	let { open, pending, resolved, attentionText, class: className }: Props = $props();

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
		'flex h-full min-h-0 flex-col rounded-lg border border-border bg-background p-3 shadow-xs',
		className
	)}
>
	<div class="flex shrink-0 items-center justify-between">
		<p class="text-sm font-semibold">Disputes overview</p>
		<a
			href={resolve('/merchant/disputes')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 md:flex-row md:gap-6">
		<div class="relative aspect-square h-full min-h-28 max-h-40 w-auto min-w-28">
			<Chart.Container config={chartConfig} class="aspect-auto size-full">
				<PieChart {data} key="key" value="value" c="key" {cRange} innerRadius={-20} padAngle={0.02}>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel nameKey="key" />
					{/snippet}
				</PieChart>
			</Chart.Container>
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<span class="text-2xl font-bold tracking-tight">{total}</span>
				<span class="text-xs text-muted-foreground">disputes</span>
			</div>
		</div>

		<div class="flex flex-col gap-2 text-xs">
			{#each data as item, i (item.key)}
				<div class="flex items-center gap-1.5">
					<span class="size-2 shrink-0 rounded-full" style="background-color: {cRange[i]}"></span>
					<span class="text-muted-foreground">{item.label}</span>
					<span class="font-semibold">{item.value}</span>
				</div>
			{/each}
		</div>
	</div>

	<p class="shrink-0 text-center text-xs font-medium text-orange-600 dark:text-orange-400">
		{attentionText}
	</p>
</div>
