<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		actions,
		class: className,
		children
	}: {
		actions?: Snippet;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<section class={cn(className)}>
	{#if actions}
		<div class="mb-2.5 flex justify-end">
			<div class="flex shrink-0 items-center gap-2">
				{@render actions()}
			</div>
		</div>
	{/if}
	{@render children()}
</section>
