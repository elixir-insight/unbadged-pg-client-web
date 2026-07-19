<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/reusable';

	let { children } = $props();

	const isErrorPage = $derived(page.status >= 400);
</script>

{#if isErrorPage}
	{@render children()}
{:else}
	<AppShell app="partner">
		{@render children()}
	</AppShell>
{/if}
