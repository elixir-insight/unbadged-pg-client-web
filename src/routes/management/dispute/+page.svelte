<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ColumnDef } from '@tanstack/table-core';
	import { onMount } from 'svelte';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { SearchField, Table } from '$lib/components/reusable';
	import DisputeStatusBadge from '$lib/components/transactions/disputes/dispute-status-badge.svelte';
	import {
		loadStoredDisputes,
		upsertStoredDispute,
		type DisputeStatus,
		type StoredDispute
	} from '$lib/utils/management-disputes';

	type DisputeSearchField = 'transactionId' | 'orderId' | 'disputeId';
	type DisputeRow = StoredDispute & Record<string, unknown>;

	const searchFields = [
		{ value: 'transactionId', label: 'Transaction ID', placeholder: 'e.g. PAT-1001…' },
		{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD-2026-001…' },
		{ value: 'disputeId', label: 'Dispute ID', placeholder: 'e.g. DSP-1001…' }
	];

	let searchField = $state<DisputeSearchField>('transactionId');
	let searchInput = $state('');
	let disputes = $state<DisputeRow[]>([]);

	function formatDate(value: string): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '—';

		return new Intl.DateTimeFormat('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}

	const columns: ColumnDef<DisputeRow>[] = [
		{ accessorKey: 'disputeId', header: 'Dispute ID' },
		{ accessorKey: 'orderId', header: 'Order ID' },
		{ accessorKey: 'transactionId', header: 'Transaction ID' },
		{ accessorKey: 'amount', header: 'Amount' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(DisputeStatusBadge, { status: info.getValue<DisputeStatus>() })
		},
		{ accessorKey: 'raisedOn', header: 'Raised on' },
		{
			accessorKey: 'evidenceDueBy',
			header: 'Evidence due by',
			cell: (info) => formatDate(info.getValue<string>())
		}
	];

	const incomingDispute = $derived.by(() => {
		const transactionId = page.url.searchParams.get('transactionId');
		if (!transactionId) return null;

		return {
			orderId: page.url.searchParams.get('orderId') ?? '—',
			transactionId,
			amount: page.url.searchParams.get('amount') ?? '—',
			status: 'Raised' as const,
			raisedOn: formatDate(page.url.searchParams.get('raisedOn') ?? '')
		};
	});

	const filteredDisputes = $derived.by(() => {
		const query = searchInput.trim().toLowerCase();
		if (!query) return disputes;

		return disputes.filter((dispute) => dispute[searchField].toLowerCase().includes(query));
	});

	function updateSearch(field: string, value: string): void {
		if (field === 'transactionId' || field === 'orderId' || field === 'disputeId') {
			searchField = field;
		}
		searchInput = value;
	}

	function openDispute(disputeId: string): void {
		goto(resolve('/management/dispute/[disputeId]', { disputeId }));
	}

	function openDisputeRow(dispute: DisputeRow): void {
		openDispute(dispute.disputeId);
	}

	function getRowAriaLabel(dispute: DisputeRow): string {
		return `View dispute ${dispute.disputeId}`;
	}

	function setPageNumber(): void {
		// Local dispute data is displayed on a single page.
	}

	onMount(() => {
		const storedDisputes = incomingDispute
			? upsertStoredDispute(incomingDispute)
			: loadStoredDisputes();
		disputes = storedDisputes.map((dispute) => ({ ...dispute }));
	});
</script>

<section class="flex flex-col gap-4">
	<div>
		<h1 class="text-lg font-semibold text-foreground">Disputes</h1>
		<p class="mt-1 text-sm text-muted-foreground">Review and manage payment disputes.</p>
	</div>

	<div class="w-full self-end sm:max-w-md">
		<SearchField
			fields={searchFields}
			field={searchField}
			value={searchInput}
			onSearch={updateSearch}
		/>
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
		{#if filteredDisputes.length > 0}
			<Table
				data={filteredDisputes}
				{columns}
				pageNumber={1}
				totalPages={1}
				{setPageNumber}
				variant="borderless"
				onRowClick={openDisputeRow}
				{getRowAriaLabel}
			/>
		{:else if disputes.length > 0}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">No matching disputes</p>
				<p class="mt-1 text-xs text-muted-foreground">Try a different search value.</p>
			</div>
		{:else}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">No disputes raised</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Raise a dispute from a payment details page to see it here.
				</p>
			</div>
		{/if}
	</div>
</section>
