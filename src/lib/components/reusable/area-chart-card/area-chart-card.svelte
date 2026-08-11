<script lang="ts">
	import { cn } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		buildAreaPaths,
		chartStrokeClass,
		type ChartColorToken,
		type ChartPoint
	} from '../chart/chart-utils';

	let {
		title,
		description,
		data = [],
		color = 'chart-1',
		height = 160,
		loading = false,
		emptyMessage = 'No data available',
		valueFormatter = (value: number) => value.toLocaleString('en-IN'),
		class: className
	}: {
		title: string;
		description?: string;
		data?: ChartPoint[];
		color?: ChartColorToken;
		height?: number;
		loading?: boolean;
		emptyMessage?: string;
		valueFormatter?: (value: number) => string;
		class?: string;
	} = $props();

	const chartWidth = 400;
	const gradientId = $derived(`area-gradient-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);

	const paths = $derived(buildAreaPaths(data, chartWidth, height));
	const xLabels = $derived(data.map((point) => point.label));
</script>

<div class={cn('rounded-lg border border-border bg-card shadow-xs', className)}>
	<div class="flex flex-col gap-4 p-4">
		<div>
			<h3 class="text-sm font-medium text-foreground">{title}</h3>
			{#if description}
				<p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
			{/if}
		</div>

		{#if loading}
			<Skeleton class="w-full rounded-md" style={`height: ${height}px`} />
		{:else if data.length === 0}
			<div
				class="flex items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground"
				style={`height: ${height}px`}
			>
				{emptyMessage}
			</div>
		{:else}
			<div class="relative w-full overflow-hidden">
				<svg
					viewBox={`0 0 ${chartWidth} ${height}`}
					class="h-auto w-full"
					role="img"
					aria-label={title}
					preserveAspectRatio="none"
				>
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color={`var(--${color})`} stop-opacity="0.35" />
							<stop offset="100%" stop-color={`var(--${color})`} stop-opacity="0.02" />
						</linearGradient>
					</defs>

					<path d={paths.area} fill={`url(#${gradientId})`} />
					<path
						d={paths.line}
						fill="none"
						class={cn('stroke-2', chartStrokeClass[color])}
						stroke-linecap="round"
						stroke-linejoin="round"
					/>

					{#each paths.coords as point, index (index)}
						<circle
							cx={point.x}
							cy={point.y}
							r="3"
							class={cn(chartStrokeClass[color], 'fill-card stroke-2')}
						>
							<title>{xLabels[index]}: {valueFormatter(data[index].value)}</title>
						</circle>
					{/each}
				</svg>

				<div class="mt-2 flex justify-between gap-2">
					{#each xLabels as label, index (label + index)}
						<span class="truncate text-[10px] text-muted-foreground">{label}</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
