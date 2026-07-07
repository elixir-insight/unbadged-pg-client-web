<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Accent = 'primary' | 'info' | 'success' | 'warning';

	const accentStyles: Record<Accent, { bar: string; icon: string }> = {
		primary: {
			bar: 'bg-primary/50',
			icon: 'bg-primary/12 text-primary ring-primary/15'
		},
		info: {
			bar: 'bg-info/50',
			icon: 'bg-info/10 text-info ring-info/15'
		},
		success: {
			bar: 'bg-success/50',
			icon: 'bg-success/10 text-success ring-success/15'
		},
		warning: {
			bar: 'bg-warning/50',
			icon: 'bg-warning/10 text-warning ring-warning/15'
		}
	};

	let {
		title,
		description,
		icon,
		accent = 'primary',
		actions,
		footer,
		class: className,
		children
	}: {
		title: string;
		description?: string;
		icon: Component;
		accent?: Accent;
		actions?: Snippet;
		footer?: Snippet;
		class?: string;
		children: Snippet;
	} = $props();

	const styles = $derived(accentStyles[accent]);
</script>

<section
	class={cn(
		'overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/40 transition-shadow duration-200 hover:shadow-md',
		className
	)}
>
	<div class="relative overflow-hidden px-5 py-4">
		<div class="gradient-soft absolute inset-0 opacity-50"></div>
		<div class={cn('absolute inset-y-0 left-0 w-0.5 rounded-full', styles.bar)}></div>
		<div class="relative flex items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div
					class={cn(
						'flex size-8 shrink-0 items-center justify-center rounded-xl shadow-xs ring-1',
						styles.icon
					)}
				>
					<svelte:component this={icon} class="size-4" />
				</div>
				<div>
					<p class="text-sm font-semibold tracking-tight">{title}</p>
					{#if description}
						<p class="text-xs text-muted-foreground/80">{description}</p>
					{/if}
				</div>
			</div>
			{#if actions}
				<div class="shrink-0">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>

	<div class="border-t border-border/40">
		{@render children()}
	</div>

	{#if footer}
		<div class="border-t border-border/40">
			{@render footer()}
		</div>
	{/if}
</section>
