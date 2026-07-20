<script lang="ts">
	import { navigating } from '$app/state';
	import { RoleDetailSkeleton } from '$lib/components/role-management';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const showViewSkeleton = $derived(
		!!navigating?.to?.url.pathname.includes('/role-management/view-role/')
	);
</script>

{#if showViewSkeleton}
	<RoleDetailSkeleton />
{:else}
	{@render children()}
{/if}
