<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import type { SettlementRecord, SettlementStatus } from '$lib/data/partnerSettlementsDummyData';
	import {
		formatInrDetailed,
		formatRecordDate,
		formatEntriesLabel
	} from '$lib/data/partnerSettlementsDummyData';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import SettlementStatusBadge from './SettlementStatusBadge.svelte';
	import {
		getRecordActionLabel,
		getRecordRowAction,
		type RecordRowAction
	} from '../settlements-shared';
	import { ArrowRight, History, Pencil } from '@lucide/svelte/icons';

	let {
		records,
		pageNumber = 1,
		setPageNumber,
		totalPages = 1,
		showActions = true,
		showingText = '',
		variant = 'default',
		onRowClick,
		onAction
	}: {
		records: SettlementRecord[];
		pageNumber?: number;
		setPageNumber?: (page: number) => void;
		totalPages?: number;
		showActions?: boolean;
		showingText?: string;
		variant?: 'default' | 'full';
		onRowClick?: (record: SettlementRecord) => void;
		onAction?: (record: SettlementRecord, action: RecordRowAction) => void;
	} = $props();

	const columns: ColumnDef<SettlementRecord>[] = $derived.by(() => {
		const cols: ColumnDef<SettlementRecord>[] = [
			{
				accessorKey: 'date',
				header: 'Date',
				cell: ({ row }) => formatRecordDate(row.original.date)
			},
			{
				accessorKey: 'commissionEarned',
				header: variant === 'full' ? 'Commission earned (INR)' : 'Commission earned',
				cell: ({ row }) => renderSnippet(commissionCell, { amount: row.original.commissionEarned })
			},
			{
				accessorKey: 'entriesCount',
				header: 'Entries',
				cell: ({ row }) => formatEntriesLabel(row.original.entriesCount)
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ row }) =>
					renderSnippet(statusCell, { status: row.original.status as SettlementStatus })
			}
		];

		if (showActions) {
			cols.push({
				id: 'actions',
				header: '',
				cell: ({ row }) => renderSnippet(actionCell, { record: row.original })
			});
		}

		return cols;
	});

	function handleActionClick(event: MouseEvent, record: SettlementRecord) {
		event.stopPropagation();
		onAction?.(record, getRecordRowAction(record.status));
	}
</script>

{#snippet commissionCell({ amount }: { amount: number })}
	<span class="font-semibold">{formatInrDetailed(amount)}</span>
{/snippet}

{#snippet statusCell({ status }: { status: SettlementStatus })}
	<SettlementStatusBadge {status} />
{/snippet}

{#snippet actionCell({ record }: { record: SettlementRecord })}
	{#if onAction}
		{@const action = getRecordRowAction(record.status)}
		<Button
			variant={action === 'settle' ? 'default' : 'outline'}
			size="sm"
			class="h-8 gap-1.5 text-xs"
			onclick={(event) => handleActionClick(event, record)}
		>
			{#if action === 'settle'}
				<ArrowRight class="size-3.5" />
			{:else if action === 'edit'}
				<Pencil class="size-3.5" />
			{:else}
				<History class="size-3.5" />
			{/if}
			{getRecordActionLabel(action)}
		</Button>
	{/if}
{/snippet}

{#if variant === 'full'}
	<Card class="overflow-hidden border-border/50 shadow-sm">
		<CardContent class="p-0">
			<Table
				data={records as unknown as Record<string, unknown>[]}
				columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
				{pageNumber}
				setPageNumber={setPageNumber ?? (() => {})}
				{totalPages}
				{showingText}
				onRowClick={onRowClick
					? (row) => onRowClick(row as unknown as SettlementRecord)
					: undefined}
				variant="borderless"
			/>
		</CardContent>
	</Card>
{:else}
	<Table
		data={records as unknown as Record<string, unknown>[]}
		columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
		{pageNumber}
		setPageNumber={setPageNumber ?? (() => {})}
		{totalPages}
		{showingText}
		onRowClick={onRowClick ? (row) => onRowClick(row as unknown as SettlementRecord) : undefined}
		variant="borderless"
	/>
{/if}
