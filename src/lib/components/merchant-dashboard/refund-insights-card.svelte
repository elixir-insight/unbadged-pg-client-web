<script module lang="ts">
	export interface RefundStatusCounts {
		completed: number;
		initiated: number;
		failed: number;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props extends RefundStatusCounts {
		class?: string;
	}

	let { completed, initiated, failed, class: className }: Props = $props();

	const segments = $derived([
		{ label: 'Completed', value: completed, color: 'bg-success' },
		{ label: 'Initiated', value: initiated, color: 'bg-warning' },
		{ label: 'Failed', value: failed, color: 'bg-destructive' }
	]);

	const total = $derived(completed + initiated + failed || 1);
</script>

<div
	class={cn(
		'flex h-full min-h-0 flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<div class="flex shrink-0 items-baseline justify-between">
		<p class="text-sm font-semibold">Refund insights</p>
		<p class="text-xs text-muted-foreground">{total} refunds</p>
	</div>

	<div class="mt-6 flex h-2.5 w-full shrink-0 overflow-hidden rounded-full bg-muted">
		{#each segments as segment (segment.label)}
			<div
				class={cn('h-full', segment.color)}
				style="width: {(segment.value / total) * 100}%"
			></div>
		{/each}
	</div>

	<div class="flex min-h-0 flex-1 flex-col justify-evenly">
		{#each segments as segment (segment.label)}
			<div class="flex items-center justify-between px-4 pt-2 text-sm">
				<div class="flex items-center gap-3">
					<span class={cn('size-2.5 shrink-0 rounded-full', segment.color)}></span>
					<span class="text-muted-foreground">{segment.label}</span>
				</div>
				<div class="flex items-baseline gap-2">
					<span class="font-semibold">{segment.value}</span>
					<span class="text-xs text-muted-foreground"
						>({Math.round((segment.value / total) * 100)}%)</span
					>
				</div>
			</div>
		{/each}
	</div>
</div>
