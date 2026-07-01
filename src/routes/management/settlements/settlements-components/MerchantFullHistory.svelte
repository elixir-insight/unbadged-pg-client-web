<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getSettlementsStore } from '../settlements.svelte';
	import { Button } from '$lib/components/ui/button';
	import SettlementFiltersBar from './SettlementFiltersBar.svelte';
	import SettlementRecordsTable from './SettlementRecordsTable.svelte';
	import { RECORDS_PAGE_SIZE, type RecordRowAction } from '../settlements-shared';
	import type { SettlementRecord } from '$lib/data/partnerSettlementsDummyData';
	import { ArrowLeft } from '$lib/assets/icons';

	const store = getSettlementsStore();

	const showingText = $derived(
		store.filteredRecords.length === 0
			? 'No records'
			: `Showing ${(store.pageNumber - 1) * RECORDS_PAGE_SIZE + 1}–${Math.min(store.pageNumber * RECORDS_PAGE_SIZE, store.filteredRecords.length)} of ${store.filteredRecords.length}`
	);

	function navigateToRecord(record: SettlementRecord) {
		if (!store.selectedMerchantId) return;
		goto(
			resolve('/management/settlements/[merchantId]/[recordId]', {
				merchantId: store.selectedMerchantId,
				recordId: record.id
			})
		);
	}

	function handleAction(record: SettlementRecord, action: RecordRowAction) {
		if (action === 'view') {
			navigateToRecord(record);
			return;
		}
		store.openRecordDrawer(record, action === 'settle' ? 'settle' : 'edit');
	}
</script>

{#if store.selectedMerchant}
	<header class="mb-6 space-y-4">
		<button
			type="button"
			class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			onclick={() => store.showQuickView()}
		>
			<ArrowLeft class="size-4" />
			Back to quick view
		</button>

		<div class="flex flex-wrap items-start justify-between gap-4">
			<h2 class="text-xl font-semibold">{store.selectedMerchant.name}</h2>
			<Button disabled={!store.actionableRecord} onclick={() => store.openAddEntryDrawer()}>
				Add new entry
			</Button>
		</div>
	</header>

	<div class="space-y-4">
		<SettlementFiltersBar
			statusFilter={store.statusFilter}
			fromDate={store.fromDate}
			toDate={store.toDate}
			onStatusChange={(status) => store.setStatusFilter(status)}
			onFromDateChange={(value) => store.setFromDate(value)}
			onToDateChange={(value) => store.setToDate(value)}
		/>

		<SettlementRecordsTable
			records={store.paginatedRecords}
			pageNumber={store.pageNumber}
			setPageNumber={(page) => store.setPage(page)}
			totalPages={store.totalPages}
			{showingText}
			variant="full"
			onRowClick={navigateToRecord}
			onAction={handleAction}
		/>
	</div>
{/if}
