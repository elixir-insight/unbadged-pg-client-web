<script module lang="ts">
	export interface TrendPoint {
		label: string;
		value: number;
	}
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import { LineChart, Area, Spline, Points } from 'layerchart';
	import { curveMonotoneX } from 'd3-shape';
	import { cn } from '$lib/utils';
	import type { TooltipPayload } from '$lib/components/ui/chart';

	let {
		title,
		description,
		data,
		valueLabel = 'Organizations',
		formatValue = (v: number) => `${v}`,
		color = 'var(--chart-1)',
		filled = true,
		class: className
	}: {
		title: string;
		description: string;
		data: TrendPoint[];
		valueLabel?: string;
		formatValue?: (value: number) => string;
		color?: string;
		filled?: boolean;
		class?: string;
	} = $props();

	const chartConfig = $derived({
		value: { label: valueLabel, color }
	} satisfies Chart.ChartConfig);

	// Cap the y-domain headroom at ~30% above the peak so the line fills roughly 70–80% of the
	// plot area — LineChart would otherwise auto-fit the domain snugly around the data, but since
	// the card height is now fixed (not chart-driven), an uncapped domain reads as too much empty
	// space above the line at taller viewport heights.
	const yMax = $derived(Math.max(1, ...data.map((d) => d.value)));
	const yDomain = $derived<[number, number]>([0, yMax * 1.3]);
</script>

<Card.Root
	size="sm"
	class={cn('flex h-full min-h-0 flex-col data-[size=sm]:gap-3 data-[size=sm]:py-3', className)}
>
	<div class="flex flex-col items-center justify-between gap-2 px-4 py-2 sm:flex-row">
		<h1 class="text-sm font-semibold">{title}</h1>
		<span class="text-xs">{description}</span>
	</div>

	<Card.Content class="min-h-0 flex-1 overflow-hidden">
		<Chart.Container config={chartConfig} class="h-full w-full">
			<LineChart
				{data}
				x="label"
				y="value"
				{yDomain}
				series={[{ key: 'value', label: valueLabel, color }]}
				grid={{ x: false, y: true }}
				rule={false}
				axis={true}
				padding={{ left: 40, bottom: 20, top: 4, right: 8 }}
				props={{
					yAxis: { format: (d: number) => formatValue(d), ticks: 3 },
					xAxis: { ticks: Math.ceil(data.length / 3) }
				}}
			>
				{#snippet marks({ context })}
					{#each context.series.visibleSeries as s (s.key)}
						{#if filled}
							<Area
								seriesKey={s.key}
								curve={curveMonotoneX}
								motion="tween"
								fill={`color-mix(in oklch, ${color} 20%, transparent)`}
								line={{ stroke: color, strokeWidth: 2, curve: curveMonotoneX }}
							/>
						{:else}
							<Spline
								seriesKey={s.key}
								curve={curveMonotoneX}
								motion="tween"
								stroke={color}
								stroke-width={2}
							/>
							<Points seriesKey={s.key} r={3.5} fill={color} stroke="var(--card)" strokeWidth={2} />
						{/if}
					{/each}
				{/snippet}

				{#snippet tooltip()}
					<Chart.Tooltip indicator="dashed">
						{#snippet formatter({
							value: itemValue,
							name,
							item
						}: {
							value: unknown;
							name: string;
							item: TooltipPayload;
						})}
							<div class="flex w-full flex-1 items-center justify-between gap-3">
								<span class="flex items-center gap-1.5 text-muted-foreground">
									<span
										class="size-2 shrink-0 rounded-full"
										style:background-color={item.color ?? color}
										aria-hidden="true"
									></span>
									{name}
								</span>
								<span class="font-medium text-foreground tabular-nums">
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
