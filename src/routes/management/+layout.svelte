<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { AppShell } from '$lib/components/reusable';
	import { merchantSession } from '$lib/stores/auth/session.svelte';

	let { children } = $props();

	const isErrorPage = $derived(page.error != null);

	const PAYIN_ROUTES = [
		'/management/collections',
		'/management/settlements',
		'/management/transactions/collections'
	];

	const PAYOUT_ROUTES = [
		'/management/disbursements',
		'/management/fund-transfer',
		'/management/transactions/disbursements'
	];

	$effect(() => {
		const path = page.url.pathname;
		if (merchantSession.loading) return;

		if (
			PAYIN_ROUTES.some((route) => path === route || path.startsWith(route + '/')) &&
			!merchantSession.hasPayinAccess()
		) {
			goto(resolve('/management'));
		} else if (
			PAYOUT_ROUTES.some((route) => path === route || path.startsWith(route + '/')) &&
			!merchantSession.hasPayoutAccess()
		) {
			goto(resolve('/management'));
		}
	});
</script>

{#if isErrorPage}
	{@render children()}
{:else}
	<AppShell app="management">
		{@render children()}
	</AppShell>
{/if}
