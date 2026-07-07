<script lang="ts">
	import { Chip, Table } from '$lib/components/reusable';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import { Eye, PhoneIcon, Landmark, ArrowLeftRight } from '$lib/assets/icons';
	import type { Snippet } from 'svelte';
	import type { ColumnDef } from '@tanstack/table-core';
	import type { PayinTransaction, TransactionType } from '$lib/data/payin-transactions-mock';
	import { statusVariant, statusLabel } from './status';

	interface Props {
		data: PayinTransaction[];
		loading?: boolean;
		pageNumber: number;
		totalPages: number;
		setPageNumber: (page: number) => void;
		onView: (row: PayinTransaction) => void;
	}

	let { data, loading = false, pageNumber, totalPages, setPageNumber, onView }: Props = $props();

	const fmt = (n: number) =>
		'₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const typeIcon = {
		UPI: PhoneIcon,
		'Net Banking': Landmark,
		'Bank Transfer': ArrowLeftRight
	} as const;

	function getColumns(s: {
		utrCell: Snippet<[{ value: string | null }]>;
		amountCell: Snippet<[{ value: number }]>;
		typeCell: Snippet<[{ value: TransactionType }]>;
		statusCell: Snippet<[{ value: PayinTransaction['status'] }]>;
		actionCell: Snippet<[{ row: PayinTransaction }]>;
	}): ColumnDef<PayinTransaction>[] {
		return [
			{ accessorKey: 'payerName', header: 'Payer Name', enableSorting: false },
			{ accessorKey: 'clientOrderId', header: 'Client Order ID', enableSorting: false },
			{ accessorKey: 'crn', header: 'CRN', enableSorting: false },
			{
				accessorKey: 'utr',
				header: 'UTR',
				enableSorting: false,
				cell: (c) => renderSnippet(s.utrCell, { value: c.getValue() as string | null })
			},
			{ accessorKey: 'gatewayTxnId', header: 'Gateway Txn ID', enableSorting: false },
			{
				accessorKey: 'amount',
				header: 'Amount',
				enableSorting: false,
				cell: (c) => renderSnippet(s.amountCell, { value: c.getValue() as number })
			},
			{
				accessorKey: 'transactionType',
				header: 'Transaction Type',
				enableSorting: false,
				cell: (c) => renderSnippet(s.typeCell, { value: c.getValue() as TransactionType })
			},
			{ accessorKey: 'transactionDate', header: 'Transaction Date', enableSorting: false },
			{
				accessorKey: 'status',
				header: 'Transaction Status',
				enableSorting: false,
				cell: (c) =>
					renderSnippet(s.statusCell, { value: c.getValue() as PayinTransaction['status'] })
			},
			{
				id: 'actions',
				header: '',
				enableSorting: false,
				cell: (c) => renderSnippet(s.actionCell, { row: c.row.original })
			}
		];
	}
</script>

{#snippet utrCell({ value }: { value: string | null })}
	{#if value}
		<span class="font-mono text-xs text-foreground">{value}</span>
	{:else}
		<span class="text-xs text-muted-foreground/60">NIL</span>
	{/if}
{/snippet}

{#snippet amountCell({ value }: { value: number })}
	<span class="font-semibold text-foreground">{fmt(value)}</span>
{/snippet}

{#snippet typeCell({ value }: { value: TransactionType })}
	{@const Icon = typeIcon[value]}
	<div class="flex items-center gap-1.5 text-sm text-foreground">
		<Icon class="h-4 w-4 shrink-0 text-muted-foreground" />
		{value}
	</div>
{/snippet}

{#snippet statusCell({ value }: { value: PayinTransaction['status'] })}
	<Chip variant={statusVariant(value)}>{statusLabel(value)}</Chip>
{/snippet}

{#snippet actionCell({ row }: { row: PayinTransaction })}
	<button
		type="button"
		onclick={(e) => {
			e.stopPropagation();
			onView(row);
		}}
		class="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
	>
		<Eye class="h-3.5 w-3.5" /> View
	</button>
{/snippet}

<div class="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
	<div class="overflow-x-auto">
		<Table
			{data}
			columns={getColumns({ utrCell, amountCell, typeCell, statusCell, actionCell })}
			{loading}
			onRowClick={onView}
			{pageNumber}
			{totalPages}
			{setPageNumber}
		/>
	</div>
</div>
