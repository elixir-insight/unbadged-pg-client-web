<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		label,
		class: className,
		children
	}: {
		label: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class={cn('flex flex-col gap-2', className)}>
	<p class="text-sm font-medium text-foreground">{label}</p>
	{@render children()}
</div>
