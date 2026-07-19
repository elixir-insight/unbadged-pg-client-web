<script lang="ts">
	import { navigating } from '$app/state';
	import { UserDetailSkeleton, UserFormSkeleton } from '$lib/components/user-management';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const targetPath = $derived(navigating?.to?.url.pathname ?? '');

	const showDetailSkeleton = $derived(
		targetPath.includes('/user-management/view-user/') ||
			targetPath.includes('/user-management/create-user/preview') ||
			/\/user-management\/edit-user\/[^/]+\/preview/.test(targetPath)
	);

	const showFormSkeleton = $derived(
		!showDetailSkeleton &&
			(targetPath.includes('/user-management/create-user') ||
				targetPath.includes('/user-management/edit-user/'))
	);
</script>

{#if showDetailSkeleton}
	<UserDetailSkeleton />
{:else if showFormSkeleton}
	<UserFormSkeleton />
{:else}
	{@render children()}
{/if}
