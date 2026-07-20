<script module lang="ts">
	export interface StatusDatum {
		label: string;
		amount: number;
		percentage: number;
		color: string;
	}
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import { PieChart, ArcChart } from 'layerchart';
	import { cn } from '$lib/utils';

	// Concentric ring sizing for the `radial` chart variant (fixed px, tuned for the size-52/@md:size-64 container).
	const RADIAL_RING_THICKNESS = 12;
	const RADIAL_RING_GAP = 5;
	const RADIAL_MAX_OUTER_RADIUS = 90;
	const RADIAL_TRACK_OPACITY = 0.16;

	let {
		title,
		description,
		data,
		totalLabel = 'Total',
		formatValue = (v: number) => `${v}`,
		showAmount = true,
		chartType = 'pie',
		class: className
	}: {
		title: string;
		description?: string;
		data: StatusDatum[];
		totalLabel?: string;
		formatValue?: (value: number) => string;
		showAmount?: boolean;
		chartType?: 'pie' | 'radial';
		class?: string;
	} = $props();

	const total = $derived(data.reduce((sum, item) => sum + item.amount, 0));

	const chartConfig = $derived(
		Object.fromEntries(
			data.map((item) => [
				item.label.toLowerCase().replace(/\s+/g, '_'),
				{ label: item.label, color: item.color }
			])
		) as Chart.ChartConfig
	);

	// One ring per status, ordered outer → inner to match the legend's top-to-bottom order.
	// The track (the arc's unfilled remainder) uses the ring's own color at low opacity —
	// a "mild" tint instead of a flat neutral gray — so each ring reads as a lighter version of itself.
	const radialSeries = $derived(
		data.map((item, i) => {
			const outerRadius = RADIAL_MAX_OUTER_RADIUS - i * (RADIAL_RING_THICKNESS + RADIAL_RING_GAP);
			const innerRadius = outerRadius - RADIAL_RING_THICKNESS;
			return {
				key: item.label,
				label: item.label,
				color: item.color,
				data: [item],
				props: {
					innerRadius,
					outerRadius,
					cornerRadius: 3,
					track: { fill: item.color, fillOpacity: RADIAL_TRACK_OPACITY }
				}
			};
		})
	);
</script>

<Card.Root size="sm" class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">{title}</Card.Title>
		<Card.Description class="text-xs">{description}</Card.Description>
	</Card.Header>

	<Card.Content class="@container flex min-h-0 flex-1 flex-col items-center justify-center">
		<div
			class="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 @sm:flex-row"
		>
			<div
				class={cn(
					'relative flex shrink-0 items-center justify-center',
					chartType === 'radial' ? 'size-52 @md:size-64' : 'size-44 @md:size-52'
				)}
			>
				<Chart.Container config={chartConfig} class="h-full w-full">
					{#if chartType === 'radial'}
						<ArcChart
							{data}
							series={radialSeries}
							value="percentage"
							maxValue={100}
							props={{ arc: { motion: 'tween' } }}
						>
							{#snippet tooltip()}
								<Chart.Tooltip hideLabel>
									{#snippet formatter({ value, name, item })}
										<div class="flex w-full flex-1 items-center justify-between gap-3">
											<span class="flex items-center gap-1.5 text-muted-foreground">
												<span
													class="size-2 shrink-0 rounded-full"
													style:background-color={item.color}
													aria-hidden="true"
												></span>
												{name}
											</span>
											<span class="font-mono font-medium text-foreground tabular-nums">
												{value}%
											</span>
										</div>
									{/snippet}
								</Chart.Tooltip>
							{/snippet}
						</ArcChart>
					{:else}
						<PieChart
							{data}
							key="label"
							value="amount"
							c="color"
							innerRadius={56}
							padding={9}
							props={{ pie: { motion: 'tween' } }}
						>
							{#snippet tooltip()}
								<Chart.Tooltip hideLabel />
							{/snippet}
						</PieChart>
					{/if}
				</Chart.Container>
				<div class="pointer-events-none absolute flex flex-col items-center">
					<span
						class={cn(
							'font-medium text-muted-foreground',
							chartType === 'radial' ? 'text-xs' : 'text-[10px]'
						)}>{totalLabel}</span
					>
					<span
						class={cn(
							'font-bold text-foreground tabular-nums',
							chartType === 'radial' ? 'text-lg' : 'text-sm'
						)}>{formatValue(total)}</span
					>
				</div>
			</div>

			<ul class="flex min-w-0 shrink-0 flex-col gap-1.5" aria-label="Status breakdown">
				{#each data as item (item.label)}
					<li class="flex min-w-0 items-center gap-2 text-xs">
						<span
							class="size-2 shrink-0 rounded-full"
							style:background-color={item.color}
							aria-hidden="true"
						></span>
						<span class="min-w-0 truncate text-sm text-muted-foreground">{item.label}</span>
						<span class="shrink-0 pl-3 text-sm font-semibold text-foreground tabular-nums"
							>{item.percentage}%</span
						>
						{#if showAmount}
							<span class="shrink-0 text-sm text-muted-foreground tabular-nums"
								>({formatValue(item.amount)})</span
							>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</Card.Content>
</Card.Root>
