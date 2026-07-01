<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getSettlementsStore } from '../settlements.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Chip } from '$lib/components/reusable';
	import SettlementRecordsTable from './SettlementRecordsTable.svelte';
	import type { SettlementRecord } from '$lib/data/partnerSettlementsDummyData';

	const store = getSettlementsStore();

	function navigateToRecord(record: SettlementRecord) {
		if (!store.selectedMerchantId) return;
		goto(
			resolve('/management/settlements/[merchantId]/[recordId]', {
				merchantId: store.selectedMerchantId,
				recordId: record.id
			})
		);
	}
</script>

{#if store.selectedMerchant && store.selectedPartner}
	<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div class="space-y-2">
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="text-xl font-semibold">{store.selectedMerchant.name}</h2>
				<Chip variant="secondary">{store.selectedPartner.name}</Chip>
			</div>
			<p class="text-sm text-muted-foreground">{store.selectedMerchant.city}</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<Button variant="outline" onclick={() => store.showFullHistory()}>View more</Button>
			<Button disabled={!store.actionableRecord} onclick={() => store.openAddEntryDrawer()}>
				Add new entry
			</Button>
		</div>
	</header>

	<Card>
		<CardContent class="p-0">
			<div class="border-b border-border/40 px-4 py-3">
				<h3 class="text-sm font-semibold">Recent settlement records</h3>
				<p class="text-xs text-muted-foreground">Last 5 cycles for this merchant</p>
			</div>
			<SettlementRecordsTable
				records={store.recentRecords}
				showActions={false}
				onRowClick={navigateToRecord}
			/>
		</CardContent>
	</Card>
{:else}
	<div class="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
		<p class="text-sm text-muted-foreground">Select a merchant to view settlement details.</p>
	</div>
{/if}
