<script module lang="ts">
	import type { Component } from 'svelte';

	export interface MetricTileData {
		label: string;
		value: string;
		subtitle: string;
		trend?: string;
		trendDirection?: 'up' | 'down';
		icon: Component;
		tone?: 'violet' | 'amber' | 'emerald' | 'rose';
		info?: string;
		highlight?: string;
	}
</script>

<script lang="ts">
	import { TrendingUp, TrendingDown, Info } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import Tooltip from '$lib/components/reusable/tooltip/tooltip.svelte';

	let {
		label,
		value,
		subtitle,
		trend,
		trendDirection = 'up',
		icon: Icon,
		tone,
		info,
		highlight,
		variant = 'default',
		class: className
	}: MetricTileData & { variant?: 'default' | 'glass' | 'stat'; class?: string } = $props();

	const TONE_CLASSES: Record<NonNullable<MetricTileData['tone']>, string> = {
		violet: 'bg-chart-1/10 text-chart-1 dark:bg-chart-1/15 dark:text-chart-1',
		amber: 'bg-warning/10 text-warning dark:bg-warning/15 dark:text-warning',
		emerald: 'bg-success/10 text-success dark:bg-success/15 dark:text-success',
		rose: 'bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-destructive'
	};
</script>

{#if variant === 'stat'}
	<div
		class={cn(
			'flex flex-col justify-between gap-1 overflow-hidden rounded-xl bg-card p-4 shadow-sm',
			className
		)}
	>
		<div class="flex items-start justify-between gap-2">
			<div class="flex items-center gap-1">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
				{#if info}
					<Tooltip content={info}>
						<Info class="size-3 text-muted-foreground/60" aria-hidden="true" />
					</Tooltip>
				{/if}
			</div>
			<div
				class={cn('flex items-center justify-center rounded-lg', TONE_CLASSES[tone ?? 'violet'])}
				aria-hidden="true"
			>
				<Icon class="size-4" />
			</div>
		</div>

		<div>
			<p class="mt-3 text-xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
			<div class=" mt-1 flex flex-wrap items-center gap-1 text-[12px]">
				{#if highlight}
					<span class="font-semibold text-primary">{highlight}</span>
				{:else if trend}
					<span
						class={cn(
							'inline-flex items-center gap-0.5 font-medium tabular-nums',
							trendDirection === 'up'
								? 'text-success/90 dark:text-success/90'
								: 'text-destructive/90'
						)}
					>
						{#if trendDirection === 'up'}
							<TrendingUp class="size-3" aria-hidden="true" />
						{:else}
							<TrendingDown class="size-3" aria-hidden="true" />
						{/if}
						{trend}
					</span>
					<span class="text-muted-foreground/80">{subtitle}</span>
				{/if}
			</div>
		</div>
	</div>
{:else if variant === 'glass'}
	<div
		class={cn(
			'flex flex-col gap-3 rounded-xl border border-border/50 bg-card/30 p-4 shadow-lg backdrop-blur-xl dark:border-border/10 dark:bg-card/6',
			className
		)}
	>
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-1">
				<p class="text-xs font-medium text-muted-foreground">{label}</p>
				{#if info}
					<Tooltip content={info}>
						<Info class="size-3 text-muted-foreground/60" aria-hidden="true" />
					</Tooltip>
				{/if}
			</div>
			<div
				class={cn(
					'flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm backdrop-blur-sm',
					tone ? TONE_CLASSES[tone] : 'bg-card/60 text-muted-foreground dark:bg-card/10'
				)}
				aria-hidden="true"
			>
				<Icon class="size-4" />
			</div>
		</div>

		<p class="text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>

		<div class="flex flex-wrap items-center gap-1.5 text-xs">
			{#if highlight}
				<span class="font-semibold text-primary">{highlight}</span>
			{:else if trend}
				<span
					class={cn(
						'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums',
						trendDirection === 'up'
							? 'bg-success/15 text-success dark:text-success'
							: 'bg-destructive/15 text-destructive'
					)}
				>
					{#if trendDirection === 'up'}
						<TrendingUp class="size-3" aria-hidden="true" />
					{:else}
						<TrendingDown class="size-3" aria-hidden="true" />
					{/if}
					{trend}
				</span>
			{/if}
			<span class="text-muted-foreground">{subtitle}</span>
		</div>
	</div>
{:else}
	<div
		class={cn(
			'flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-xs',
			className
		)}
	>
		<div class="flex items-center justify-between">
			<div
				class="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
				aria-hidden="true"
			>
				<Icon class="size-4" />
			</div>
			{#if trend}
				<span
					class={cn(
						'flex items-center gap-0.5 text-xs font-semibold tabular-nums',
						trendDirection === 'up' ? 'text-success dark:text-success' : 'text-destructive'
					)}
				>
					{#if trendDirection === 'up'}
						<TrendingUp class="size-3" aria-hidden="true" />
					{:else}
						<TrendingDown class="size-3" aria-hidden="true" />
					{/if}
					{trend}
				</span>
			{/if}
		</div>

		<div>
			<p class="text-xs font-medium text-muted-foreground">{label}</p>
			<p class="mt-1 text-xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
		</div>

		<p class="text-[11px] text-muted-foreground">{subtitle}</p>
	</div>
{/if}
