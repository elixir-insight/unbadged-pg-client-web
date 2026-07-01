<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const tabs = [
		{ label: 'Pay-ins', path: '/merchant/transactions/payins' },
		{ label: 'Pay-outs', path: '/merchant/transactions/payouts' }
	];

	const isDetailPage = $derived(
		page.url.pathname.startsWith(resolve('/merchant/transactions/payins') + '/') ||
			page.url.pathname.startsWith(resolve('/merchant/transactions/payouts') + '/')
	);
</script>

<div class="flex flex-col gap-4">
	{#if !isDetailPage}
		<nav class="border-border flex gap-1 border-b">
			{#each tabs as tab (tab.path)}
				<a
					href={resolve(
						tab.path as '/merchant/transactions/payins' | '/merchant/transactions/payouts'
					)}
					class="relative px-3 pb-2 text-sm font-medium transition-colors {page.url.pathname.startsWith(
						resolve(tab.path as '/merchant/transactions/payins' | '/merchant/transactions/payouts')
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
