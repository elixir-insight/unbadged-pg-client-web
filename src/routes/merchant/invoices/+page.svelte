<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import type { DateRange } from 'bits-ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getLocalTimeZone } from '@internationalized/date';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Button,
		Chip,
		DateRangePicker,
		Drawer,
		EmptyState,
		FilterCards,
		Modal,
		SearchField,
		Table,
		createUrlPagination,
		toast
	} from '$lib/components/reusable';
	import {
		InvoiceA4Sheet,
		InvoiceDetailsDrawer,
		InvoiceStatusBadge,
		InvoiceUrlCell
	} from '$lib/components/invoices';
	import type {
		Invoice,
		InvoiceCounts,
		InvoiceListRow,
		InvoiceSearchField,
		InvoiceStatus
	} from '$lib/types/invoice';
	import { isInvoiceSearchField } from '$lib/utils/invoices-store';
	import {
		cancelInvoice,
		filterInvoices,
		formatInvoiceAmount,
		formatInvoiceDateTime,
		getInvoiceCounts,
		loadInvoices
	} from '$lib/utils/invoices-store';
	import { debounce } from '$lib/utils/debounce.js';
	import { Plus, RefreshCw, X } from '$lib/assets/icons';

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
		{ value: 'id', label: 'Invoice Id', placeholder: 'e.g. inv_TeyCvL2N0eDw3A' },
		{ value: 'receiptNo', label: 'Receipt No.', placeholder: 'e.g. INV-202609-0001' },
		{ value: 'customerPhone', label: 'Customer Contact', placeholder: 'e.g. 7845753114' },
		{ value: 'customerEmail', label: 'Customer Email', placeholder: 'e.g. billing@acme.example' }
	];

	let invoices = $state<Invoice[]>(loadInvoices());
	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let searchField = $state('id');
	let drawerOpen = $state(false);
	let selectedInvoice = $state<Invoice | null>(null);
	let cancelOpen = $state(false);
	let refreshing = $state(false);

	const pagination = createUrlPagination({
		defaultLimit: 25,
		total: () => filtered.length
	});

	const fromDateMs = $derived(
		dateRange.start ? dateRange.start.toDate(getLocalTimeZone()).getTime() : null
	);
	const toDateMs = $derived(
		dateRange.end
			? dateRange.end.toDate(getLocalTimeZone()).getTime() + 24 * 60 * 60 * 1000 - 1
			: null
	);

	const selectedCard = $derived(
		summaryCards.find((card) => (card.status ?? '') === pagination.status)?.label ?? 'All'
	);

	const activeSearchField = $derived(
		isInvoiceSearchField(searchField) ? searchField : ('id' satisfies InvoiceSearchField)
	);

	const filtered = $derived(
		filterInvoices(invoices, {
			statusTab: selectedCard,
			search: pagination.search,
			searchField: activeSearchField,
			fromDateMs: fromDateMs !== null && toDateMs !== null ? fromDateMs : null,
			toDateMs: fromDateMs !== null && toDateMs !== null ? toDateMs : null
		})
	);
	const searchInput = $derived(pagination.search);

	const filterCards = $derived(
		summaryCards.map((card) => ({
			label: card.label,
			count: getInvoiceCounts(invoices)[card.label]
		}))
	);

	const tableRows = $derived(
		filtered.slice(pagination.skip, pagination.skip + pagination.limit) as InvoiceListRow[]
	);

	const activeFilters = $derived.by(() => {
		const filters: { key: 'search'; label: string; value: string }[] = [];
		if (pagination.search.trim()) {
			const field = searchFields.find((item) => item.value === searchField);
			filters.push({
				key: 'search',
				label: field?.label ?? 'Invoice Id',
				value: pagination.search.trim()
			});
		}
		return filters;
	});

	const showingText = $derived(
		filtered.length === 0 ? 'No invoices' : `${pagination.showingText} invoices`
	);

	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 200);

	function handleSearch(field: string, value: string) {
		if (isInvoiceSearchField(field)) searchField = field;
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
		searchField = 'id';
		pagination.clearAllFilters();
	}

	function refreshList() {
		refreshing = true;
		invoices = loadInvoices();
		refreshing = false;
	}

	function openInvoiceDetails(row: InvoiceListRow) {
		selectedInvoice = row;
		drawerOpen = true;
	}

	function handleCancel(invoice: Invoice) {
		selectedInvoice = invoice;
		cancelOpen = true;
	}

	function confirmCancel() {
		if (!selectedInvoice) return;
		const next = cancelInvoice(selectedInvoice.id);
		invoices = loadInvoices();
		selectedInvoice = next ?? selectedInvoice;
		cancelOpen = false;
		toast.success('Invoice cancelled');
	}

	function handlePrint() {
		window.print();
	}

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
</script>

<div class="flex flex-col gap-6 print:hidden">
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
				title="No invoices match your filters"
				description="Try a different search, or create a new invoice."
				actionLabel={activeFilters.length > 0 ? 'Clear filters' : 'Create invoice'}
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

<Drawer
	bind:open={drawerOpen}
	title="Invoice details"
	direction="right"
	class="max-w-3xl print:hidden"
>
	{#if selectedInvoice}
		<InvoiceDetailsDrawer invoice={selectedInvoice} onCancel={handleCancel} onPrint={handlePrint} />
	{/if}
</Drawer>

{#if selectedInvoice}
	<div class="invoice-print-root hidden print:block">
		<InvoiceA4Sheet invoice={selectedInvoice} />
	</div>
{/if}

<Modal
	bind:open={cancelOpen}
	title="Cancel invoice"
	description="This disables the payment link. Paid invoices cannot be cancelled."
	class="print:hidden"
>
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => (cancelOpen = false)}>Keep invoice</Button>
			<Button variant="destructive" onclick={confirmCancel}>Cancel invoice</Button>
		</div>
	{/snippet}
</Modal>
