<script module lang="ts">
	import type { Component } from 'svelte';

	export interface SecondaryStat {
		label: string;
		value: string;
		trend: string;
		trendDirection?: 'up' | 'down';
		icon: Component;
	}
</script>

<script lang="ts">
	import { TrendingUp, TrendingDown } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let { stats, class: className }: { stats: SecondaryStat[]; class?: string } = $props();
</script>

<div
	class={cn(
		'flex flex-col divide-y divide-border rounded-xl border border-border bg-card shadow-xs',
		className
	)}
>
	{#each stats as stat (stat.label)}
		{@const Icon = stat.icon}
		<div class="flex flex-1 items-center gap-3 px-4 py-2">
			<div
				class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
				aria-hidden="true"
			>
				<Icon class="size-4" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-[11px] font-medium text-muted-foreground">{stat.label}</p>
				<p class="text-lg font-bold tracking-tight tabular-nums text-foreground">{stat.value}</p>
			</div>
			<div class="flex shrink-0 items-center gap-1 text-[11px] font-medium tabular-nums">
				{#if stat.trendDirection === 'up'}
					<TrendingUp class="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
					<span class="text-emerald-600 dark:text-emerald-400">{stat.trend}</span>
				{:else}
					<TrendingDown class="size-3.5 text-destructive" aria-hidden="true" />
					<span class="text-destructive">{stat.trend}</span>
				{/if}
			</div>
		</div>
	{/each}
</div>
