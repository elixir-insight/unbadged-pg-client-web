<script lang="ts">
	import { PieChart } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
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
		'flex h-full flex-col rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<p class="text-sm font-semibold">Disputes overview</p>

	<div class="flex flex-1 items-center justify-center gap-6">
		<div class="relative shrink-0">
			<Chart.Container config={chartConfig} class="aspect-auto size-48">
				<PieChart
					{data}
					key="key"
					value="value"
					c="key"
					{cRange}
					innerRadius={-26}
					padAngle={0.02}
				/>
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

	<p class="text-center text-xs font-medium text-orange-600 dark:text-orange-400">
		{attentionText}
	</p>
</div>
