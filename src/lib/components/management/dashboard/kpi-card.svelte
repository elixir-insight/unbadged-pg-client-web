<script module lang="ts">
	import type { Component } from 'svelte';

	export interface KpiCardData {
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

	let {
		label,
		value,
		trend,
		trendDirection = 'up',
		icon: Icon,
		class: className
	}: KpiCardData & { class?: string } = $props();
</script>

<div
	class={cn(
		'relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-3 shadow-md',
		className
	)}
	style="background-image: radial-gradient(140% 140% at 0% 0%, color-mix(in oklch, var(--primary), transparent 88%) 0%, transparent 55%);"
>
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-muted-foreground">{label}</span>
		<div
			class="flex size-6 items-center justify-center rounded-lg bg-muted text-muted-foreground"
			aria-hidden="true"
		>
			<Icon class="size-3.5" />
		</div>
	</div>

	<p class="text-xl font-bold tracking-tight text-foreground">{value}</p>

	<div class="flex items-center gap-1 text-xs font-medium text-muted-foreground">
		{#if trendDirection === 'up'}
			<TrendingUp class="size-3.5 text-primary" aria-hidden="true" />
		{:else}
			<TrendingDown class="size-3.5 text-destructive" aria-hidden="true" />
		{/if}
		<span>{trend}</span>
	</div>
</div>
