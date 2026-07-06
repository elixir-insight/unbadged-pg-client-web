<script lang="ts">
	import { page } from '$app/state';
	import MerchantList from '$lib/components/merchant/merchant-list.svelte';
	import TransactionActivity from '$lib/components/transaction/transaction-activity.svelte';

	const urlView = $derived(page.url.searchParams.get('view') ?? 'landing');
</script>

{#if urlView === 'landing'}
	<MerchantList />
{:else}
	<TransactionActivity />
{/if}
