<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import type { DateRange } from 'bits-ui';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Button,
		Chip,
		DateRangePicker,
		Drawer,
		EmptyState,
		FilterCards,
		SearchField,
		Table,
		createUrlPagination
	} from '$lib/components/reusable';
	import {
		InvoiceDetailsDrawer,
		InvoiceStatusBadge,
		InvoiceUrlCell
	} from '$lib/components/invoices';
	import type { Invoice, InvoiceCounts, InvoiceListRow, InvoiceStatus } from '$lib/types/invoice';
	import { formatInvoiceAmount, formatInvoiceDateTime } from '$lib/utils/invoices-store';
	import { debounce } from '$lib/utils/debounce.js';
	import { Plus, RefreshCw, X } from '$lib/assets/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type StatusTab = keyof InvoiceCounts;

	const summaryCards: { label: StatusTab; status: InvoiceStatus | null }[] = [
		{ label: 'All', status: null },
		{ label: 'Issued', status: 'issued' },
		{ label: 'Attempted', status: 'attempted' },
		{ label: 'Overdue', status: 'overdue' },
		{ label: 'Paid', status: 'paid' },
		{ label: 'Cancelled', status: 'cancelled' },
		{ label: 'Expired', status: 'expired' }
	];

	const searchFields = [
		{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD_H2TVXHOHU8' }
	];

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	let selectedCard = $derived(
		summaryCards.find((card) => (card.status ?? '') === pagination.status)?.label ?? 'All'
	);
	let searchField = $state('orderId');
	let searchInput = $derived(pagination.search);
	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let drawerOpen = $state(false);
	let selectedInvoice = $state<Invoice | null>(null);
	let refreshing = $state(false);

	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 200);

	function handleSearch(_field: string, value: string) {
		debouncedSearch(value);
	}

	function selectCard(label: string) {
		const card = summaryCards.find((item) => item.label === label);
		pagination.setStatus(card?.status ?? '');
	}

	function removeSearchFilter() {
		pagination.setSearch('');
	}

	function clearAllFilters() {
		dateRange = { start: undefined, end: undefined };
		pagination.clearAllFilters();
	}

	async function refreshList() {
		refreshing = true;
		try {
			await invalidate('invoices:list');
		} finally {
			refreshing = false;
		}
	}

	function openInvoiceDetails(row: InvoiceListRow) {
		selectedInvoice = row;
		drawerOpen = true;
	}

	const filterCards = $derived(
		summaryCards.map((card) => ({ label: card.label, count: data.counts[card.label] }))
	);

	const activeFilters = $derived.by(() => {
		const filters: { key: 'search'; label: string; value: string }[] = [];
		if (pagination.search.trim()) {
			filters.push({
				key: 'search',
				label: 'Order ID',
				value: pagination.search.trim()
			});
		}
		return filters;
	});

	const showingText = $derived(
		data.listError
			? 'Unable to load invoices'
			: data.pagination.total === 0
				? 'No invoices'
				: `${pagination.showingText} invoices`
	);

	const columns: ColumnDef<InvoiceListRow>[] = [
		{
			accessorKey: 'id',
			header: 'Invoice Id',
			cell: (info) => info.getValue<string>()
		},
		{
			accessorKey: 'createdAt',
			header: 'Created At',
			cell: (info) => formatInvoiceDateTime(info.row.original.createdAt)
		},
		{
			accessorKey: 'amount',
			header: 'Amount',
			cell: (info) => formatInvoiceAmount(info.getValue<number>())
		},
		{
			accessorKey: 'receiptNo',
			header: 'Receipt No.',
			cell: (info) => info.getValue<string>()
		},
		{
			accessorKey: 'customerName',
			header: 'Customer',
			cell: (info) => info.getValue<string>()
		},
		{
			accessorKey: 'paymentLinkUrl',
			header: 'Payment Link',
			cell: (info) => renderComponent(InvoiceUrlCell, { url: info.getValue<string | null>() })
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(InvoiceStatusBadge, {
					status: info.getValue<Invoice['status']>()
				})
		}
	];

	const tableRows = $derived(data.invoices as InvoiceListRow[]);
</script>

<div class="flex flex-col gap-6">
	<FilterCards
		loading={false}
		skeletonCount={7}
		cards={filterCards}
		selected={selectedCard}
		onselect={selectCard}
		class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
	/>

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<DateRangePicker bind:value={dateRange} />
			<div class="w-full max-w-xs">
				<SearchField
					fields={searchFields}
					bind:field={searchField}
					value={searchInput}
					onSearch={handleSearch}
				/>
			</div>
		</div>

		{#if activeFilters.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				{#each activeFilters as filter (filter.key)}
					<Chip variant="outline" class="h-auto gap-1.5 rounded-full px-3 py-1 text-xs">
						<span class="text-muted-foreground">{filter.label}:</span>
						<span class="font-semibold">{filter.value}</span>
						<button
							type="button"
							onclick={removeSearchFilter}
							aria-label="Remove {filter.label} filter"
							class="ml-0.5 cursor-pointer rounded-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none"
						>
							<X class="size-3" />
						</button>
					</Chip>
				{/each}
				<button
					type="button"
					onclick={clearAllFilters}
					class="text-sm font-medium text-primary hover:underline focus-visible:outline-none"
				>
					Clear All
				</button>
			</div>
		{/if}
	</div>

	<div class="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					onclick={refreshList}
					disabled={refreshing}
					aria-label="Refresh invoices"
				>
					<RefreshCw class={refreshing ? 'animate-spin' : undefined} />
				</Button>
				<Button onclick={() => goto(resolve('/merchant/invoices/create'))}>
					<Plus />
					Create invoice
				</Button>
			</div>
		</div>

		{#if tableRows.length === 0}
			<EmptyState
				title={data.listError ? 'Unable to load invoices' : 'No invoices match your filters'}
				description={data.listError
					? data.listError
					: 'Try a different Order ID, or create a new invoice.'}
				actionLabel={data.listError
					? undefined
					: activeFilters.length > 0
						? 'Clear filters'
						: 'Create invoice'}
				onaction={() =>
					activeFilters.length > 0 ? clearAllFilters() : goto(resolve('/merchant/invoices/create'))}
			/>
		{:else}
			<Table
				data={tableRows}
				{columns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				onRowClick={openInvoiceDetails}
				variant="borderless"
			/>
		{/if}
	</div>
</div>

<Drawer bind:open={drawerOpen} title="Invoice details" direction="right" class="max-w-md">
	{#if selectedInvoice}
		<InvoiceDetailsDrawer invoice={selectedInvoice} />
	{/if}
</Drawer>
