<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		getEntriesByRecordId,
		getMerchantById,
		getPartnerById,
		getRecordById,
		deleteEntryFromRecord,
		formatInrDetailed,
		formatRecordDate
	} from '$lib/data/partnerSettlementsDummyData';
	import type { SettlementEntry } from '$lib/data/partnerSettlementsDummyData';
	import Breadcrumb from '$lib/components/reusable/breadcrumb/breadcrumb.svelte';
	import Modal from '$lib/components/reusable/modal/modal.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Chip } from '$lib/components/reusable';
	import { Plus } from '$lib/assets/icons';
	import SettlementRecordStats from './SettlementRecordStats.svelte';
	import SettlementEntriesTable from './SettlementEntriesTable.svelte';
	import SettlementStatusBadge from './SettlementStatusBadge.svelte';
	import ManagementSettlementDrawer from './ManagementSettlementDrawer.svelte';
	import { getSettlementsStore } from '../settlements.svelte';

	let {
		merchantId,
		recordId
	}: {
		merchantId: string;
		recordId: string;
	} = $props();

	const store = getSettlementsStore();

	const merchant = $derived(getMerchantById(merchantId));
	const record = $derived.by(() => {
		void store.entriesRevision;
		return getRecordById(recordId);
	});
	const partner = $derived(merchant ? getPartnerById(merchant.partnerId) : undefined);
	const recordEntries = $derived.by(() => {
		void store.entriesRevision;
		return record ? getEntriesByRecordId(record.id) : [];
	});

	const breadcrumbItems = $derived.by(() => {
		const items = [{ label: 'Partner settlements', href: '/management/settlements' }];
		if (partner) {
			items.push({
				label: partner.name,
				href: `/management/settlements?partner=${partner.id}`
			});
		}
		if (merchant) {
			items.push({
				label: merchant.name,
				href: `/management/settlements?partner=${partner?.id ?? ''}&merchant=${merchant.id}`
			});
		}
		if (record) {
			items.push({
				label: formatRecordDate(record.date),
				href: `/management/settlements/${merchantId}/${recordId}`
			});
		}
		return items;
	});

	$effect(() => {
		if (record) store.drawerRecordId = record.id;
	});

	function openAddEntry() {
		if (!record) return;
		store.drawerMode = 'add';
		store.drawerRecordId = record.id;
		store.drawerOpen = true;
	}

	function handleEditEntry() {
		if (!record) return;
		store.drawerMode = 'edit';
		store.drawerRecordId = record.id;
		store.drawerOpen = true;
	}

	let deleteConfirmOpen = $state(false);
	let entryPendingDelete = $state<SettlementEntry | null>(null);

	function requestDeleteEntry(entry: SettlementEntry) {
		entryPendingDelete = entry;
		deleteConfirmOpen = true;
	}

	function cancelDeleteEntry() {
		deleteConfirmOpen = false;
		entryPendingDelete = null;
	}

	function confirmDeleteEntry() {
		if (!entryPendingDelete) return;
		deleteEntryFromRecord(entryPendingDelete.id);
		store.notifyEntriesChanged();
		cancelDeleteEntry();
	}

	$effect(() => {
		if (!deleteConfirmOpen) entryPendingDelete = null;
	});
</script>

<div class="space-y-6">
	<Breadcrumb items={breadcrumbItems} />

	{#if merchant && record && partner}
		<header class="space-y-2">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-semibold">{merchant.name}</h1>
				<Chip variant="secondary">{partner.name}</Chip>
				<SettlementStatusBadge status={record.status} />
			</div>
			<p class="text-sm text-muted-foreground">
				Partner settlements · {formatRecordDate(record.date)}
			</p>
		</header>

		<SettlementRecordStats {record} entries={recordEntries} />

		<Card class="overflow-hidden border-border/50 shadow-sm">
			<CardContent class="p-0">
				<div
					class="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-3"
				>
					<div class="flex items-center gap-2">
						<h2 class="text-sm font-semibold">Settlement entries</h2>
						<span
							class="inline-flex size-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
						>
							{recordEntries.length}
						</span>
					</div>
					<Button size="sm" class="gap-1.5" onclick={openAddEntry}>
						<Plus class="size-4" />
						Add entry
					</Button>
				</div>
				<SettlementEntriesTable
					entries={recordEntries}
					onEdit={handleEditEntry}
					onDelete={requestDeleteEntry}
				/>
			</CardContent>
		</Card>
	{:else}
		<div class="rounded-lg border border-dashed border-border p-8 text-center">
			<p class="text-sm text-muted-foreground">Record not found.</p>
			<Button
				variant="outline"
				class="mt-4"
				onclick={() => goto(resolve('/management/settlements'))}
			>
				Back to settlements
			</Button>
		</div>
	{/if}
</div>

<ManagementSettlementDrawer />

<Modal
	bind:open={deleteConfirmOpen}
	title="Delete entry?"
	description="This will permanently remove this settlement entry."
>
	{#if entryPendingDelete}
		<p class="text-sm text-muted-foreground">
			{formatRecordDate(entryPendingDelete.date)} · {formatInrDetailed(entryPendingDelete.amount)}
		</p>
	{/if}

	{#snippet footer()}
		<Button variant="outline" onclick={cancelDeleteEntry}>No</Button>
		<Button variant="destructive" onclick={confirmDeleteEntry}>Yes, delete</Button>
	{/snippet}
</Modal>
