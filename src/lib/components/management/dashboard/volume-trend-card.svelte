<script module lang="ts">
	export interface VolumePoint {
		label: string;
		value: number;
	}
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import { BarChart, Bars, Spline, Points } from 'layerchart';
	import { curveMonotoneX } from 'd3-shape';
	import { cn } from '$lib/utils';
	import Dropdown, { type DropdownOption } from '$lib/components/reusable/dropdown/dropdown.svelte';

	let {
		title,
		description,
		data,
		valueLabel = 'Collection Volume',
		formatValue = (v: number) => `${v}`,
		color = 'var(--chart-2)',
		period = $bindable<string | undefined>(undefined),
		periodOptions,
		class: className
	}: {
		title: string;
		description: string;
		data: VolumePoint[];
		valueLabel?: string;
		formatValue?: (value: number) => string;
		color?: string;
		period?: string;
		periodOptions?: DropdownOption[];
		class?: string;
	} = $props();

	/** 3-point centered moving average, used to draw a smooth trend line over the raw bars. */
	function movingAverage(values: number[], window: number): number[] {
		return values.map((_, i) => {
			const start = Math.max(0, i - Math.floor(window / 2));
			const end = Math.min(values.length, i + Math.ceil(window / 2));
			const slice = values.slice(start, end);
			return slice.reduce((sum, v) => sum + v, 0) / slice.length;
		});
	}

	const chartData = $derived.by(() => {
		const trend = movingAverage(
			data.map((d) => d.value),
			3
		);
		return data.map((d, i) => ({ ...d, trend: trend[i] }));
	});

	const chartConfig = $derived({
		value: { label: valueLabel, color },
		trend: { label: 'Trend', color }
	} satisfies Chart.ChartConfig);
</script>

<Card.Root class={cn('flex h-full min-h-0 flex-col ', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">{title}</Card.Title>
		<Card.Description class="text-xs">{description}</Card.Description>
		{#if periodOptions}
			<Card.Action>
				<Dropdown bind:value={period} options={periodOptions} size="sm" class="h-8 w-24" />
			</Card.Action>
		{/if}
	</Card.Header>

	<Card.Content class="flex min-h-0 flex-1 flex-col gap-4">
		<div class="flex items-center gap-4 text-[11px] text-muted-foreground">
			<span class="flex items-center gap-1.5">
				<span class="size-2 shrink-0 rounded-sm" style:background-color={color} aria-hidden="true"
				></span>
				{valueLabel}
			</span>
			<span class="flex items-center gap-1.5">
				<span
					class="h-0.5 w-3 shrink-0 rounded-full"
					style:background-color={color}
					aria-hidden="true"
				></span>
				Trend
			</span>
		</div>

		<Chart.Container config={chartConfig} class="h-full w-full">
			<BarChart
				data={chartData}
				x="label"
				series={[
					{ key: 'value', label: valueLabel, color },
					{ key: 'trend', label: 'Trend', color }
				]}
				bandPadding={0.6}
				props={{
					yAxis: { format: (d: number) => formatValue(d) }
				}}
				grid={{ x: false, y: true }}
				rule={false}
				axis={true}
				padding={{ left: 44, bottom: 36, top: 12, right: 8 }}
			>
				{#snippet marks({ context })}
					{#each context.series.visibleSeries as s (s.key)}
						{#if s.key === 'value'}
							<Bars seriesKey={s.key} rounded="top" radius={4} stroke="none" fillOpacity={0.45} />
						{:else}
							<Spline seriesKey={s.key} curve={curveMonotoneX} stroke={color} strokeWidth={2.5} />
							<Points seriesKey={s.key} r={3.5} fill={color} stroke="var(--card)" strokeWidth={2} />
						{/if}
					{/each}
				{/snippet}

				{#snippet tooltip()}
					<Chart.Tooltip>
						{#snippet formatter({ value: itemValue, name, item })}
							<div class="flex w-full flex-1 items-center justify-between gap-3">
								<span class="flex items-center gap-1.5 text-muted-foreground">
									<span
										class="size-2 shrink-0 rounded-full"
										style:background-color={item.config?.color ?? color}
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
			</BarChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>
