<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		title,
		description,
		icon,
		class: className,
		children
	}: {
		title: string;
		description?: string;
		icon?: Component;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<section class={cn('rounded-xl border border-border bg-card p-5 shadow', className)}>
	<div class="mb-4 flex items-start gap-3">
		{#if icon}
			{@const Icon = icon}
			<div
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow"
			>
				<Icon class="size-4" />
			</div>
		{/if}
		<div>
			<h2 class="text-sm font-semibold text-foreground">{title}</h2>
			{#if description}
				<p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
			{/if}
		</div>
	</div>
	{@render children()}
</section>
