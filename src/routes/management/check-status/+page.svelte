<script lang="ts">
	import { Tabs } from '$lib/components/reusable';
	import SingleTransactionTab from './single-transaction-tab.svelte';
	import BulkTransactionsTab from './bulk-transactions-tab.svelte';
	import ScanSearch from '@lucide/svelte/icons/scan-search';
	import Layers from '@lucide/svelte/icons/layers';

	let activeTab = $state('single');
</script>

<div class="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
	<header class="space-y-1">
		<h1 class="text-xl font-semibold text-foreground sm:text-2xl">Check Status</h1>
		<p class="text-sm text-muted-foreground">Look up the status of one or many transactions.</p>
	</header>

	<Tabs
		bind:value={activeTab}
		class="w-full gap-6 [&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:w-full sm:[&_[data-slot=tabs-list]]:w-fit"
		triggerClass="data-active:bg-gradient-to-r data-active:from-primary data-active:to-primary/80 data-active:text-primary-foreground data-active:shadow-sm min-h-9 flex-1 px-2 text-xs sm:flex-initial sm:px-3 sm:text-sm"
		tabs={[
			{
				value: 'single',
				label: 'Single Transaction',
				icon: ScanSearch,
				content: singleTab
			},
			{
				value: 'bulk',
				label: 'Bulk Transactions',
				icon: Layers,
				content: bulkTab
			}
		]}
	/>
</div>

{#snippet singleTab()}
	<SingleTransactionTab />
{/snippet}

{#snippet bulkTab()}
	<BulkTransactionsTab />
{/snippet}
