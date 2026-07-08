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
	import { scaleBand } from 'd3-scale';
	import { cubicInOut } from 'svelte/easing';
	import { cn } from '$lib/utils';

	let {
		data,
		totalInPipeline,
		class: className
	}: {
		data: OnboardingStage[];
		totalInPipeline: number;
		class?: string;
	} = $props();

	const chartConfig = {
		count: { label: 'Organizations', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root size="sm" class={cn('flex h-full flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">Onboarding status</Card.Title>
		<Card.Description class="text-xs"
			>{totalInPipeline.toLocaleString()} total in pipeline</Card.Description
		>
	</Card.Header>

	<Card.Content class="flex-1">
		<Chart.Container config={chartConfig} class="h-full min-h-35 w-full">
			<BarChart
				{data}
				orientation="horizontal"
				yScale={scaleBand().padding(0.55)}
				y="stage"
				series={[{ key: 'count', label: 'Organizations', color: chartConfig.count.color }]}
				padding={{ left: 76 }}
				grid={true}
				rule={false}
				axis="y"
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
