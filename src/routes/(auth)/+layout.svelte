<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme.svelte';

	let { children } = $props();

	onMount(() => {
		theme.init();
	});
</script>

<div class="flex h-dvh w-full overflow-hidden p-0 lg:gap-3 lg:p-4">
	<!-- White-label auth layout: single centred column, no media panel. -->
	<div class="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background">
		{@render children()}
	</div>
</div>
