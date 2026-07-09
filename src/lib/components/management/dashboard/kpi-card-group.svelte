<script lang="ts">
	import { TrendingUp, TrendingDown } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import type { KpiCardData } from './kpi-card.svelte';

	let { cards, class: className }: { cards: KpiCardData[]; class?: string } = $props();
</script>

<div
	class={cn(
		'flex divide-x divide-border rounded-xl border border-border bg-card shadow-xs',
		className
	)}
>
	{#each cards as card (card.label)}
		{@const Icon = card.icon}
		<div class="flex flex-1 flex-col gap-2 p-3">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted-foreground">{card.label}</span>
				<div
					class="flex size-6 items-center justify-center rounded-lg bg-muted text-muted-foreground"
					aria-hidden="true"
				>
					<Icon class="size-3.5" />
				</div>
			</div>

			<p class="text-xl font-bold tracking-tight text-foreground tabular-nums">{card.value}</p>

			<div class="flex items-center gap-1 text-xs font-medium text-muted-foreground">
				{#if card.trendDirection === 'up'}
					<TrendingUp class="size-3.5 text-primary" aria-hidden="true" />
				{:else}
					<TrendingDown class="size-3.5 text-destructive" aria-hidden="true" />
				{/if}
				<span class="tabular-nums">{card.trend}</span>
			</div>
		</div>
	{/each}
</div>
