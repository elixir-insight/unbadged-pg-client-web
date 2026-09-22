<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ColumnDef } from '@tanstack/table-core';
	import { Table, createUrlPagination } from '$lib/components/reusable';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type ChargebackRow = PageData['rows'][number];

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	const columns: ColumnDef<ChargebackRow>[] = [
		{ accessorKey: 'disputeId', header: 'Dispute ID' },
		{ accessorKey: 'chargebackAmount', header: 'Chargeback amount' },
		{ accessorKey: 'principalAmount', header: 'Principal amount' },
		{ accessorKey: 'additionalFees', header: 'Additional fees' },
		{ accessorKey: 'bankReference', header: 'Bank reference' },
		{ accessorKey: 'createdAt', header: 'Created at' }
	];

	function display(value: string): string {
		return value.trim() || '—';
	}

	function openChargeback(row: ChargebackRow): void {
		const disputeId = row.disputeId.trim();
		const chargebackId = row.id.trim();
		if (!disputeId || disputeId === '—' || !chargebackId || chargebackId === '—') return;
		goto(
			resolve('/merchant/chargeback/[disputeId]/[chargebackId]', {
				disputeId,
				chargebackId
			})
		);
	}

	function isRowClickable(row: ChargebackRow): boolean {
		const disputeId = row.disputeId.trim();
		const chargebackId = row.id.trim();
		return Boolean(disputeId) && disputeId !== '—' && Boolean(chargebackId) && chargebackId !== '—';
	}

	function getRowAriaLabel(row: ChargebackRow): string {
		return `View chargeback ${display(row.id)}`;
	}
</script>

<section class="flex flex-col gap-4">
	<div>
		<h1 class="text-lg font-semibold text-foreground">Chargebacks</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Review chargebacks raised against your payment disputes.
		</p>
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
		{#if data.listError}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">Unable to load chargebacks</p>
				<p class="mt-1 text-xs text-destructive">{data.listError}</p>
			</div>
		{:else if data.rows.length > 0}
			<Table
				data={data.rows}
				{columns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				variant="borderless"
				onRowClick={openChargeback}
				{isRowClickable}
				{getRowAriaLabel}
			/>
		{:else}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">No chargebacks yet</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Chargebacks raised from a dispute will appear here.
				</p>
			</div>
		{/if}
	</div>
</section>
