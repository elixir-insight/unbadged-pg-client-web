<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		class: className,
		children
	}: {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class={cn(className)}>
	<dl class="grid grid-cols-1 gap-y-3.5 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-4">
		{@render children()}
	</dl>
</div>
