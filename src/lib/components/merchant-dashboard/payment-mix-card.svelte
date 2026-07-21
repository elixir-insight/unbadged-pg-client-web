<script lang="ts">
	import { cn } from '$lib/utils';
	import { formatDashboardCurrency, type PaymentMixItem } from './dashboard-data';

	interface Props {
		data: PaymentMixItem[];
		error?: string | null;
		class?: string;
	}

	let { data, error = null, class: className }: Props = $props();

	const dotClasses = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];
	const total = $derived(data.reduce((sum, item) => sum + item.amount, 0));
	const segments = $derived.by(() => {
		let offset = 0;
		return data.map((item) => {
			const segment = { ...item, offset };
			offset += item.percentage;
			return segment;
		});
	});
</script>

<section
	class={cn(
		'flex h-full flex-col rounded-lg border border-border bg-card p-3 shadow-xs',
		className
	)}
>
	<div>
		<h2 class="text-sm font-semibold text-card-foreground">Payment mix</h2>
		<p class="text-xs text-muted-foreground">Share of captured value</p>
	</div>

	{#if error}
		<p class="mt-3 text-sm text-destructive" role="alert">{error}</p>
	{/if}

	{#if data.length}
		<div
			class="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 sm:flex-row lg:flex-col xl:flex-row"
		>
			<div class="relative size-40 shrink-0">
				<svg viewBox="0 0 40 40" class="size-full -rotate-90" aria-label="Payment mix chart">
					<circle cx="20" cy="20" r="15.9155" fill="none" stroke="var(--muted)" stroke-width="6" />
					{#each segments as segment (segment.label)}
						<circle
							cx="20"
							cy="20"
							r="15.9155"
							fill="none"
							stroke={segment.color}
							stroke-width="6"
							stroke-dasharray={`${segment.percentage} ${100 - segment.percentage}`}
							stroke-dashoffset={-segment.offset}
						/>
					{/each}
				</svg>
				<div class="absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-xs text-muted-foreground">Total</span>
					<strong class="text-sm font-semibold tabular-nums">
						{formatDashboardCurrency(total, true)}
					</strong>
				</div>
			</div>

			<ul class="w-full max-w-48 space-y-2" aria-label="Payment method breakdown">
				{#each data as item, index (item.label)}
					<li class="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs">
						<span class={cn('size-2 rounded-full', dotClasses[index % dotClasses.length])}></span>
						<span class="truncate text-muted-foreground">{item.label}</span>
						<span class="font-medium tabular-nums">{item.percentage}%</span>
					</li>
				{/each}
			</ul>
		</div>
	{:else if !error}
		<p class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
			No payment mix data available.
		</p>
	{/if}
</section>
