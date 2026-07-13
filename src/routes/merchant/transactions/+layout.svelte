<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { merchantSession } from '$lib/stores/auth/session.svelte';

	let { children } = $props();

	const tabs = $derived([
		...(merchantSession.hasPayinAccess()
			? [{ label: 'Collections', path: '/merchant/transactions/collections' as const }]
			: []),
		...(merchantSession.hasPayoutAccess()
			? [{ label: 'Disbursements', path: '/merchant/transactions/disbursements' as const }]
			: [])
	]);

	const isDetailPage = $derived(
		page.url.pathname.startsWith(resolve('/merchant/transactions/collections') + '/') ||
			page.url.pathname.startsWith(resolve('/merchant/transactions/disbursements') + '/')
	);

	$effect(() => {
		const path = page.url.pathname;
		if (merchantSession.loading) return;

		if (path === resolve('/merchant/transactions')) {
			if (merchantSession.hasPayinAccess()) {
				goto(resolve('/merchant/transactions/collections'));
			} else if (merchantSession.hasPayoutAccess()) {
				goto(resolve('/merchant/transactions/disbursements'));
			} else {
				goto(resolve('/merchant'));
			}
		} else if (
			path.startsWith(resolve('/merchant/transactions/collections')) &&
			!merchantSession.hasPayinAccess()
		) {
			goto(resolve('/merchant'));
		} else if (
			path.startsWith(resolve('/merchant/transactions/disbursements')) &&
			!merchantSession.hasPayoutAccess()
		) {
			goto(resolve('/merchant'));
		}
	});
</script>

<div class="flex flex-col gap-4">
	{#if !isDetailPage}
		<nav class="border-border flex gap-1 border-b">
			{#each tabs as tab (tab.path)}
				<a
					href={resolve(tab.path)}
					class="relative px-3 pb-2 text-sm font-medium transition-colors {page.url.pathname.startsWith(
						resolve(tab.path)
					)
						? 'text-foreground border-foreground -mb-px border-b-2'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	{/if}
	{@render children()}
</div>
