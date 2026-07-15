<script module lang="ts">
	export interface TrendPoint {
		label: string;
		value: number;
	}
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import { LineChart, Area, Points } from 'layerchart';
	import { curveMonotoneX } from 'd3-shape';
	import { cn } from '$lib/utils';

	let {
		title,
		description,
		data,
		valueLabel = 'Organizations',
		formatValue = (v: number) => `${v}`,
		color = 'var(--chart-1)',
		class: className
	}: {
		title: string;
		description: string;
		data: TrendPoint[];
		valueLabel?: string;
		formatValue?: (value: number) => string;
		color?: string;
		class?: string;
	} = $props();

	const chartConfig = $derived({
		value: { label: valueLabel, color }
	} satisfies Chart.ChartConfig);
</script>

<Card.Root size="sm" class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">{title}</Card.Title>
		<Card.Description class="text-xs">{description}</Card.Description>
	</Card.Header>

	<Card.Content class="min-h-0 flex-1">
		<Chart.Container config={chartConfig} class="h-full w-full">
			<LineChart
				{data}
				x="label"
				y="value"
				series={[{ key: 'value', label: valueLabel, color }]}
				grid={{ x: false, y: true }}
				rule={false}
				axis={true}
				padding={{ left: 40, bottom: 24, top: 8, right: 8 }}
				props={{
					yAxis: { format: (d: number) => formatValue(d), ticks: 3 },
					xAxis: { ticks: Math.ceil(data.length / 3) }
				}}
			>
				{#snippet marks({ context })}
					{#each context.series.visibleSeries as s (s.key)}
						<Area
							seriesKey={s.key}
							curve={curveMonotoneX}
							motion="tween"
							fill={`color-mix(in oklch, ${color} 20%, transparent)`}
							line={{ stroke: color, strokeWidth: 2, curve: curveMonotoneX }}
						/>
						<Points seriesKey={s.key} r={3.5} fill={color} stroke="var(--card)" strokeWidth={2} />
					{/each}
				{/snippet}

				{#snippet tooltip()}
					<Chart.Tooltip indicator="dashed">
						{#snippet formatter({ value: itemValue, name, item })}
							<div class="flex w-full flex-1 items-center justify-between gap-3">
								<span class="flex items-center gap-1.5 text-muted-foreground">
									<span
										class="size-2 shrink-0 rounded-full"
										style:background-color={item.color ?? color}
										aria-hidden="true"
									></span>
									{name}
								</span>
								<span class="font-mono font-medium tabular-nums text-foreground">
									{formatValue(itemValue as number)}
								</span>
							</div>
						{/snippet}
					</Chart.Tooltip>
				{/snippet}
			</LineChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>
