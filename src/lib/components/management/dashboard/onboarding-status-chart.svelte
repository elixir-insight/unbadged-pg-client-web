<script module lang="ts">
	export interface OnboardingStage {
		stage: string;
		count: number;
	}
</script>

<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import * as Card from '$lib/components/ui/card';
	import { BarChart } from 'layerchart';
	import { cubicInOut } from 'svelte/easing';
	import { cn } from '$lib/utils';

	let {
		data,
		totalInPipeline,
		percentComplete,
		class: className
	}: {
		data: OnboardingStage[];
		totalInPipeline: number;
		percentComplete?: number;
		class?: string;
	} = $props();

	const chartConfig = {
		count: { label: 'Organizations', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root size="sm" class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">Onboarding status</Card.Title>
		<Card.Description class="text-xs tabular-nums"
			>{totalInPipeline.toLocaleString()} total in pipeline</Card.Description
		>
		{#if percentComplete !== undefined}
			<div class="mt-1.5 flex items-center gap-2">
				<div class="h-0.75 flex-1 overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-primary transition-[width] duration-500"
						style="width: {percentComplete}%"
					></div>
				</div>
				<span class="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground"
					>{percentComplete}% approved</span
				>
			</div>
		{/if}
	</Card.Header>

	<Card.Content class="min-h-0 flex-1">
		<Chart.Container config={chartConfig} class="h-full min-h-35 w-full">
			<BarChart
				{data}
				orientation="horizontal"
				bandPadding={0.68}
				y="stage"
				series={[{ key: 'count', label: 'Organizations', color: chartConfig.count.color }]}
				padding={{ left: 76, bottom: 20 }}
				grid={true}
				rule={false}
				axis={true}
				props={{
					bars: {
						stroke: 'none',
						radius: 4,
						insets: { left: 4 },
						rounded: 'all',
						initialWidth: 0,
						initialX: 0,
						motion: {
							x: { type: 'tween', duration: 500, easing: cubicInOut },
							width: { type: 'tween', duration: 500, easing: cubicInOut }
						}
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
	</Card.Content>
</Card.Root>
