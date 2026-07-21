<script lang="ts">
	import { Area, LineChart, Points, Spline, Tooltip } from 'layerchart';
	import { curveMonotoneX } from 'd3-shape';
	import { cn } from '$lib/utils';

	export interface CollectionsTrendChartPoint {
		label: string;
		gross: number;
		net: number;
		transactionCount?: number;
	}

	interface Props {
		data: CollectionsTrendChartPoint[];
		granularity?: 'daily' | 'weekly';
		error?: string | null;
		onGranularityChange?: (granularity: 'daily' | 'weekly') => void;
		class?: string;
	}

	let {
		data,
		granularity = 'daily',
		error = null,
		onGranularityChange,
		class: className
	}: Props = $props();

	const chartData = $derived(data);
	const peakValue = $derived(
		Math.max(0, ...chartData.map((point) => Math.max(point.gross, point.net)))
	);
	const yMaximum = $derived(Math.max(1, peakValue) * 1.2);

	const compactCurrency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		notation: 'compact',
		maximumFractionDigits: 1
	});

	const tooltipCurrency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	});

	function formatAxisValue(value: number): string {
		return compactCurrency.format(value);
	}

	function formatTooltipValue(value: number): string {
		return tooltipCurrency.format(value);
	}
</script>

<section
	class={cn(
		'flex h-full min-h-0 flex-col rounded-xl border border-border bg-card p-5 shadow-xs',
		className
	)}
>
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-base font-semibold text-card-foreground">Collections Trend</h2>
			<p class="mt-0.5 text-sm text-muted-foreground">Gross vs Net (after fees)</p>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<div class="flex items-center gap-3 text-sm text-muted-foreground" aria-label="Chart legend">
				<span class="flex items-center gap-1.5">
					<span class="size-2.5 rounded-full bg-chart-1"></span>
					Gross
				</span>
				<span class="flex items-center gap-1.5">
					<span class="size-2.5 rounded-full bg-success"></span>
					Net
				</span>
			</div>
			<div
				role="group"
				aria-label="Chart interval"
				class="flex items-center rounded-lg border border-border bg-muted/40 p-0.5"
			>
				{#each [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }] as option (option.value)}
					<button
						type="button"
						aria-pressed={granularity === option.value}
						onclick={() => onGranularityChange?.(option.value as 'daily' | 'weekly')}
						class={cn(
							'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
							granularity === option.value
								? 'bg-card text-card-foreground shadow-xs'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if error}
		<p class="mt-4 text-sm text-destructive" role="alert">{error}</p>
	{/if}

	{#if chartData.length}
		<div
			class={cn(
				'mt-4 min-h-64 flex-1 text-xs',
				'[&_text]:stroke-transparent',
				'[&_.lc-axis-tick-label]:fill-muted-foreground [&_.lc-axis-tick-label]:font-normal',
				'[&_.lc-axis-tick]:stroke-0 [&_.lc-line]:stroke-border/60',
				'[&_.lc-rule-x-line:not(.lc-grid-x-rule)]:stroke-0 [&_.lc-rule-y-line:not(.lc-grid-y-rule)]:stroke-0',
				'[&_.lc-highlight-line]:stroke-border [&_.lc-highlight-point]:stroke-card'
			)}
		>
			<LineChart
				data={chartData}
				x="label"
				yDomain={[0, yMaximum]}
				series={[
					{ key: 'gross', label: 'Gross', color: 'var(--chart-1)' },
					{ key: 'net', label: 'Net', color: 'var(--success)' }
				]}
				grid={{ x: false, y: true }}
				rule={false}
				tooltipContext={{ mode: 'bisect-x' }}
				padding={{ left: 48, bottom: 24, top: 8, right: 8 }}
				props={{
					yAxis: { format: formatAxisValue, ticks: 4 },
					xAxis: { ticks: Math.min(6, chartData.length) }
				}}
			>
				{#snippet marks()}
					<Area
						seriesKey="gross"
						curve={curveMonotoneX}
						fill="color-mix(in oklch, var(--chart-1) 24%, transparent)"
						line={{ stroke: 'var(--chart-1)', strokeWidth: 2, curve: curveMonotoneX }}
					/>
					<Spline seriesKey="net" curve={curveMonotoneX} stroke="var(--success)" stroke-width={2} />
					<!-- Lines need 2+ points; markers keep single-bucket ranges visible. -->
					<Points
						seriesKey="gross"
						r={chartData.length === 1 ? 5 : 3.5}
						fill="var(--chart-1)"
						stroke="var(--card)"
						strokeWidth={2}
					/>
					<Points
						seriesKey="net"
						r={chartData.length === 1 ? 5 : 3.5}
						fill="var(--success)"
						stroke="var(--card)"
						strokeWidth={2}
					/>
				{/snippet}
				{#snippet tooltip()}
					<Tooltip.Root
						variant="none"
						contained="window"
						class="z-50 min-w-36 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
					>
						{#snippet children({ data: hoveredData })}
							<p class="mb-2 text-sm font-semibold">{hoveredData.label}</p>
							<div class="space-y-1.5">
								<div class="flex items-center justify-between gap-4 text-xs">
									<span class="flex items-center gap-2 text-muted-foreground">
										<span class="size-2 rounded-full bg-chart-1"></span>
										Gross
									</span>
									<span class="font-medium text-popover-foreground tabular-nums">
										{formatTooltipValue(Number(hoveredData.gross))}
									</span>
								</div>
								<div class="flex items-center justify-between gap-4 text-xs">
									<span class="flex items-center gap-2 text-muted-foreground">
										<span class="size-2 rounded-full bg-success"></span>
										Net
									</span>
									<span class="font-medium text-popover-foreground tabular-nums">
										{formatTooltipValue(Number(hoveredData.net))}
									</span>
								</div>
							</div>
						{/snippet}
					</Tooltip.Root>
				{/snippet}
			</LineChart>
		</div>
	{:else if !error}
		<p class="flex min-h-56 flex-1 items-center justify-center text-sm text-muted-foreground">
			No collection data available.
		</p>
	{/if}
</section>
