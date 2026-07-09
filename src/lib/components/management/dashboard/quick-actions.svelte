<script module lang="ts">
	import type { Component } from 'svelte';

	export interface QuickAction {
		id: string;
		label: string;
		description: string;
		icon: Component;
		href: string;
	}
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { ChevronRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let { actions, class: className }: { actions: QuickAction[]; class?: string } = $props();
</script>

<div class={cn('flex h-full min-h-0 flex-col gap-2', className)}>
	{#each actions as action (action.id)}
		{@const Icon = action.icon}
		<a
			href={resolve(...([action.href] as Parameters<typeof resolve>))}
			class="group flex flex-1 items-center gap-3 rounded-lg border border-border bg-card px-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"
		>
			<div
				class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				aria-hidden="true"
			>
				<Icon class="size-4" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-xs font-semibold text-foreground">{action.label}</p>
				<p class="truncate text-[11px] text-muted-foreground">{action.description}</p>
			</div>
			<ChevronRight
				class="size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
				aria-hidden="true"
			/>
		</a>
	{/each}
</div>
