<script module lang="ts">
	export interface RefundStatusCounts {
		completed: number;
		initiated: number;
		failed: number;
	}
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { RadialSpiralChart, type RadialSpiralSegment } from '$lib/components/reusable';
	import { ArrowRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props extends RefundStatusCounts {
		class?: string;
	}

	let { completed, initiated, failed, class: className }: Props = $props();

	const segments = $derived([
		{ label: 'Completed', value: completed, color: 'var(--color-chart-1)' },
		{ label: 'Initiated', value: initiated, color: 'var(--color-chart-2)' },
		{ label: 'Failed', value: failed, color: 'var(--color-chart-3)' }
	] satisfies RadialSpiralSegment[]);
</script>

<div
	class={cn(
		'flex h-full min-h-0 flex-col rounded-lg border border-border bg-background p-3 shadow-xs',
		className
	)}
>
	<div class="flex shrink-0 items-center justify-between">
		<p class="text-sm font-semibold">Refund insights</p>
		<a
			href={resolve('/merchant/transactions')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	<div class="flex min-h-0 flex-1 items-center justify-center">
		<RadialSpiralChart {segments} unitLabel="refunds" class="w-full md:h-full md:max-h-44" />
	</div>
</div>
