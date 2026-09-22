<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		children
	}: {
		title: string;
		children: Snippet;
	} = $props();
</script>

<section class="flex flex-col gap-4">
	<h2 class="text-sm font-semibold text-foreground">{title}</h2>
	{@render children()}
</section>
