<script lang="ts">
	import { cn } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		buildDonutSegments,
		chartBgClass,
		chartFillClass,
		type DonutSegment
	} from '../chart/chart-utils';

	let {
		segments = [],
		centerLabel,
		centerValue,
		size = 168,
		loading = false,
		emptyMessage = 'No data available',
		valueFormatter = (value: number) => value.toLocaleString('en-IN'),
		class: className
	}: {
		segments?: DonutSegment[];
		centerLabel?: string;
		centerValue?: string;
		size?: number;
		loading?: boolean;
		emptyMessage?: string;
		valueFormatter?: (value: number) => string;
		class?: string;
	} = $props();

	const total = $derived(segments.reduce((sum, segment) => sum + segment.value, 0));
	const arcs = $derived(buildDonutSegments(segments, size));
	const resolvedCenterValue = $derived(centerValue ?? (total > 0 ? valueFormatter(total) : '—'));
</script>

<div class={cn('rounded-lg border border-border bg-card shadow-xs', className)}>
	<div class="flex flex-col gap-4 p-4">
		{#if loading}
			<div class="flex flex-col items-center gap-4">
				<Skeleton class="rounded-full" style={`width: ${size}px; height: ${size}px`} />
				<div class="grid w-full gap-2">
					<Skeleton class="h-3 w-full" />
					<Skeleton class="h-3 w-4/5" />
					<Skeleton class="h-3 w-3/5" />
				</div>
			</div>
		{:else if segments.length === 0 || total === 0}
			<div
				class="flex items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground"
				style={`height: ${size}px`}
			>
				{emptyMessage}
			</div>
		{:else}
			<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
				<div class="relative shrink-0" style={`width: ${size}px; height: ${size}px`}>
					<svg
						viewBox={`0 0 ${size} ${size}`}
						class="h-full w-full"
						role="img"
						aria-label="Donut chart"
					>
						{#each arcs as arc (arc.label)}
							<path d={arc.path} class={chartFillClass[arc.color]}>
								<title>{arc.label}: {valueFormatter(arc.value)} ({arc.percent.toFixed(1)}%)</title>
							</path>
						{/each}
					</svg>

					<div
						class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
					>
						{#if centerLabel}
							<p class="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
								{centerLabel}
							</p>
						{/if}
						<p class="font-mono text-sm font-semibold tabular-nums text-foreground">
							{resolvedCenterValue}
						</p>
					</div>
				</div>

				<ul class="min-w-0 flex-1 space-y-2">
					{#each arcs as arc (arc.label)}
						<li class="flex items-center justify-between gap-3 text-sm">
							<div class="flex min-w-0 items-center gap-2">
								<span class={cn('size-2.5 shrink-0 rounded-full', chartBgClass[arc.color])}></span>
								<span class="truncate text-foreground">{arc.label}</span>
							</div>
							<div class="shrink-0 text-right">
								<p class="font-mono text-xs tabular-nums text-foreground">
									{valueFormatter(arc.value)}
								</p>
								<p class="text-[10px] text-muted-foreground">{arc.percent.toFixed(1)}%</p>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
