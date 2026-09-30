<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		action,
		children
	}: {
		title: string;
		/** Rendered on the heading's line, aligned right (e.g. a "Same as" checkbox). */
		action?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section class="flex flex-col gap-4">
	{#if action}
		<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<h2 class="text-sm font-semibold text-foreground">{title}</h2>
			{@render action()}
		</div>
	{:else}
		<h2 class="text-sm font-semibold text-foreground">{title}</h2>
	{/if}
	{@render children()}
</section>
