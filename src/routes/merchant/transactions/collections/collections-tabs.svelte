<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const tabs = [
		{ label: 'Orders', path: '/merchant/transactions/collections/orders' as const },
		{ label: 'Payments', path: '/merchant/transactions/collections/payments' as const }
	];
</script>

<nav class="border-border flex gap-1 border-b px-4">
	{#each tabs as tab (tab.path)}
		<a
			href={resolve(tab.path)}
			class="relative px-3 pb-2.5 pt-3.5 text-sm font-medium transition-colors {page.url.pathname.startsWith(
				resolve(tab.path)
			)
				? 'text-foreground border-foreground -mb-px border-b-2'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			{tab.label}
		</a>
	{/each}
</nav>
