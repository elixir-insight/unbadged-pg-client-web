<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ColumnDef } from '@tanstack/table-core';
	import { Button, CopyButton, Drawer, Table, createUrlPagination } from '$lib/components/reusable';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type ChargebackRow = PageData['rows'][number];

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	let selected = $state<ChargebackRow | null>(null);
	let detailsOpen = $state(false);

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

	function openDetails(row: ChargebackRow): void {
		selected = row;
		detailsOpen = true;
	}

	function getRowAriaLabel(row: ChargebackRow): string {
		return `View chargeback ${display(row.id)}`;
	}

	function openDispute(): void {
		const disputeId = selected?.disputeId.trim() ?? '';
		if (!disputeId || disputeId === '—') return;
		goto(resolve('/management/dispute/[disputeId]', { disputeId }));
	}
</script>

<section class="flex flex-col gap-4">
	<div class="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Organization</p>
		<div class="mt-1 flex items-center gap-2">
			<h1 class="font-mono text-lg font-semibold text-foreground">{data.orgId}</h1>
			<CopyButton value={data.orgId} label="Copy organization ID" />
		</div>
		<p class="mt-1 text-sm text-muted-foreground">Chargebacks recorded for this organization.</p>
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
				onRowClick={openDetails}
				{getRowAriaLabel}
			/>
		{:else}
			<div class="p-8 text-center">
				<p class="text-sm font-medium text-foreground">No chargebacks yet</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Chargebacks for this organization will appear here.
				</p>
			</div>
		{/if}
	</div>
</section>

<Drawer bind:open={detailsOpen} title="Chargeback details" direction="right">
	{#if selected}
		<dl class="grid gap-4">
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Dispute ID
				</dt>
				<dd class="mt-1 font-mono text-sm text-foreground">{display(selected.disputeId)}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Chargeback amount
				</dt>
				<dd class="mt-1 text-sm text-foreground">{selected.chargebackAmount}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Principal amount
				</dt>
				<dd class="mt-1 text-sm text-foreground">{selected.principalAmount}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Additional fees
				</dt>
				<dd class="mt-1 text-sm text-foreground">{selected.additionalFees}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Currency</dt>
				<dd class="mt-1 text-sm text-foreground">{display(selected.currency)}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Bank reference
				</dt>
				<dd class="mt-1 font-mono text-sm break-all text-foreground">{selected.bankReference}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Recorded by
				</dt>
				<dd class="mt-1 text-sm text-foreground">{selected.recordedBy}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Created at
				</dt>
				<dd class="mt-1 text-sm text-foreground">{selected.createdAt}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Updated at
				</dt>
				<dd class="mt-1 text-sm text-foreground">{selected.updatedAt}</dd>
			</div>
			<div>
				<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Notes</dt>
				<dd class="mt-1 text-sm whitespace-pre-wrap text-foreground">{display(selected.notes)}</dd>
			</div>
		</dl>
	{/if}

	{#snippet footer()}
		{#if selected?.disputeId.trim() && selected.disputeId !== '—'}
			<Button class="w-full" onclick={openDispute}>View dispute</Button>
		{/if}
	{/snippet}
</Drawer>
