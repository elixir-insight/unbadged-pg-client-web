<script lang="ts" module>
	export type CardDataTrend = 'up' | 'down' | 'neutral';
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { Snippet } from 'svelte';

	let {
		label,
		value,
		subText,
		trend,
		trendLabel,
		loading = false,
		class: className,
		icon
	}: {
		label: string;
		value: string;
		subText?: string;
		trend?: CardDataTrend;
		trendLabel?: string;
		loading?: boolean;
		class?: string;
		icon?: Snippet;
	} = $props();

	const trendClass = $derived(
		trend === 'up'
			? 'text-success'
			: trend === 'down'
				? 'text-destructive'
				: 'text-muted-foreground'
	);
</script>

<div class={cn('rounded-lg border border-border bg-card shadow-xs', className)}>
	<div class="flex flex-col gap-2 p-4">
		{#if loading}
			<Skeleton class="h-3.5 w-2/5" />
			<Skeleton class="h-7 w-3/5" />
			<Skeleton class="h-3 w-1/2" />
		{:else}
			<div class="flex items-start justify-between gap-2">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
				{#if icon}
					<div class="shrink-0 text-muted-foreground">
						{@render icon()}
					</div>
				{/if}
			</div>

			<p class="font-mono text-xl font-semibold text-foreground tabular-nums">{value}</p>

			{#if subText || trendLabel}
				<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
					{#if trendLabel && trend}
						<span class={cn('font-medium', trendClass)}>{trendLabel}</span>
					{/if}
					{#if subText}
						<p class="text-muted-foreground">{subText}</p>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>
