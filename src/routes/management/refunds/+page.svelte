<script lang="ts">
	import { page } from '$app/state';
	import MerchantList from '$lib/components/merchant/MerchantList.svelte';
	import TransactionActivity from '$lib/components/transaction/TransactionActivity.svelte';

	const urlView = $derived(page.url.searchParams.get('view') ?? 'landing');
</script>

{#if urlView === 'landing'}
	<MerchantList />
{:else}
	<TransactionActivity />
{/if}
