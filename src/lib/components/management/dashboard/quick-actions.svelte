<script module lang="ts">
	import type { Component } from 'svelte';

	export interface QuickAction {
		id: string;
		label: string;
		description: string;
		icon: Component;
		href: string;
		tone?: 'primary' | 'violet' | 'amber' | 'emerald' | 'rose';
		iconSize?: 'default' | 'lg';
	}
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { ChevronRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let {
		actions,
		layout = 'list',
		class: className
	}: { actions: QuickAction[]; layout?: 'list' | 'grid'; class?: string } = $props();

	const TONE_CLASSES: Record<NonNullable<QuickAction['tone']>, string> = {
		primary: 'bg-primary/10 text-primary',
		violet: 'bg-chart-1/10 text-chart-1 dark:bg-chart-1/15 dark:text-chart-1',
		amber: 'bg-warning/10 text-warning dark:bg-warning/15 dark:text-warning',
		emerald: 'bg-success/10 text-success dark:bg-success/15 dark:text-success',
		rose: 'bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-destructive'
	};
</script>

<div
	class={cn(
		layout === 'grid'
			? 'grid h-full grid-cols-1 gap-4 sm:grid-cols-2'
			: 'flex h-full min-h-0 flex-col gap-2',
		className
	)}
>
	{#each actions as action (action.id)}
		{@const Icon = action.icon}
		<a
			href={resolve(...([action.href] as Parameters<typeof resolve>))}
			class={cn(
				'group flex flex-1 items-center gap-3 rounded-lg bg-card text-left shadow-sm transition-all duration-150 hover:bg-accent hover:shadow-md',
				layout === 'grid' ? 'p-6' : 'px-3 py-2 sm:py-0'
			)}
		>
			<div
				class={cn(
					'flex shrink-0 items-center justify-center rounded-lg',
					action.iconSize === 'lg' ? 'size-10' : 'size-8',
					TONE_CLASSES[action.tone ?? 'primary']
				)}
				aria-hidden="true"
			>
				<Icon class={action.iconSize === 'lg' ? 'size-5' : 'size-4'} />
			</div>
			<div class="min-w-0 flex-1">
				<p
					class={cn(
						'font-semibold text-foreground',
						layout === 'grid' ? 'text-sm' : 'truncate text-xs'
					)}
				>
					{action.label}
				</p>
				<p
					class={cn(
						'text-muted-foreground',
						layout === 'grid' ? 'text-xs' : 'truncate text-[11px]'
					)}
				>
					{action.description}
				</p>
			</div>
			<ChevronRight
				class={cn(
					'shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground',
					layout === 'grid' ? 'size-4' : 'size-3.5'
				)}
				aria-hidden="true"
			/>
		</a>
	{/each}
</div>
