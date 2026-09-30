<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
	{@render children()}
</div>
