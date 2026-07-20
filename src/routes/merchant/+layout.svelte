<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { AppShell } from '$lib/components/reusable';

	let { children } = $props();

	const isErrorPage = $derived(page.error != null);

	const PAYIN_ROUTES = [
		'/merchant/disputes',
		'/merchant/settlements',
		'/merchant/transactions/collections'
	];

	const PAYOUT_ROUTES = [
		'/merchant/funds',
		'/merchant/beneficiaries',
		'/merchant/transactions/disbursements'
	];

	$effect(() => {
		const path = page.url.pathname;
		if (merchantSession.loading) return;

		if (
			PAYIN_ROUTES.some((r) => path === r || path.startsWith(r + '/')) &&
			!merchantSession.hasPayinAccess()
		) {
			goto(resolve('/merchant'));
		} else if (
			PAYOUT_ROUTES.some((r) => path === r || path.startsWith(r + '/')) &&
			!merchantSession.hasPayoutAccess()
		) {
			goto(resolve('/merchant'));
		}
	});
</script>

{#if isErrorPage}
	{@render children()}
{:else}
	<AppShell app="merchant">
		{@render children()}
	</AppShell>
{/if}
