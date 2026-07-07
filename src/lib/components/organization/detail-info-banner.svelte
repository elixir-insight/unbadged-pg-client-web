<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		icon,
		class: className,
		children
	}: {
		icon?: Component;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div
	class={cn('flex items-start gap-2.5 rounded-lg bg-muted/30 px-3 py-2.5 sm:px-4', className)}
	role="note"
>
	{#if icon}
		{@const Icon = icon}
		<Icon class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
	{/if}
	<div class="min-w-0 text-xs leading-relaxed text-muted-foreground">
		{@render children()}
	</div>
</div>
