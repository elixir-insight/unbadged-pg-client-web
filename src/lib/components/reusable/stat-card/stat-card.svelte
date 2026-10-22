<script module lang="ts">
	import type { Component } from 'svelte';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

	export interface StatCardBadge {
		label: string;
		variant?: BadgeVariant;
		trend?: 'up' | 'down';
	}

	export interface StatCardTrend {
		label: string;
		direction: 'up' | 'down';
	}

	export type StatCardIconVariant = 'muted' | 'success' | 'warning' | 'error';
</script>

<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import { TrendingUp, TrendingDown } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props {
		label: string;
		value: string;
		unit?: string;
		badge?: StatCardBadge;
		icon?: Component;
		// iconVariant?: StatCardIconVariant;
		subtext?: string;
		trend?: StatCardTrend;
		sparkline?: number[];
		class?: string;
	}

	let {
		label,
		value,
		unit,
		badge,
		icon: Icon,
		// iconVariant = 'muted',
		subtext,
		trend,
		sparkline,
		class: className
	}: Props = $props();

	const points = $derived.by(() => {
		if (!sparkline || sparkline.length < 2) return '';
		const min = Math.min(...sparkline);
		const max = Math.max(...sparkline);
		const range = max - min || 1;
		const stepX = 100 / (sparkline.length - 1);
		return sparkline.map((v, i) => `${i * stepX},${28 - ((v - min) / range) * 26}`).join(' ');
	});
</script>

<div
	class={cn(
		'relative isolate flex flex-col justify-center overflow-hidden rounded-lg border border-border/60 bg-linear-to-br from-chart-3/12 via-background to-chart-4/6 px-4 py-5 shadow-xs backdrop-blur-sm',
		className
	)}
>
	{#if Icon}
		<Icon class="pointer-events-none absolute -right-4 -bottom-4 -z-10 size-24 text-chart-3/10" />
	{/if}

	<div class="flex items-start justify-between gap-2">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>

		{#if badge}
			<Chip variant={badge.variant ?? 'default'} class="shrink-0">
				{#if badge.trend === 'up'}
					<TrendingUp data-icon="inline-start" />
				{:else if badge.trend === 'down'}
					<TrendingDown data-icon="inline-start" />
				{/if}
				{badge.label}
			</Chip>
		{/if}
	</div>

	<p class="mt-2 text-lg font-semibold tracking-tight">
		{value}
		{#if unit}
			<span class="text-sm font-normal text-muted-foreground">{unit}</span>
		{/if}
	</p>

	{#if subtext}
		<p class="mt-1 text-xs text-muted-foreground">{subtext}</p>
	{/if}

	{#if trend}
		<p
			class={cn(
				'mt-2 flex items-center gap-1 text-xs font-medium',
				trend.direction === 'up'
					? 'text-success dark:text-success'
					: 'text-destructive dark:text-destructive'
			)}
		>
			{#if trend.direction === 'up'}
				<TrendingUp class="size-3.5" />
			{:else}
				<TrendingDown class="size-3.5" />
			{/if}
			{trend.label}
		</p>
	{/if}

	{#if points}
		<svg viewBox="0 0 100 28" preserveAspectRatio="none" class="mt-2 h-8 w-full">
			<polyline
				{points}
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-primary"
			/>
		</svg>
	{/if}
</div>
