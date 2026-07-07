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

<div class={cn('rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5', className)}>
	{@render children()}
</div>
