<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import type { DateRange } from 'bits-ui';
	import { invalidate } from '$app/navigation';
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
		CreatePaymentLinkModal,
		PaymentLinkDetailsDrawer,
		PaymentLinkStatusBadge,
		PaymentLinkUrlCell
	} from '$lib/components/payment-links';
	import type {
		PaymentLink,
		PaymentLinkCounts,
		PaymentLinkListRow,
		PaymentLinkStatus
	} from '$lib/types/payment-link';
	import { formatPaymentLinkAmount, formatPaymentLinkDate } from '$lib/utils/payment-links-store';
	import { isPaymentLinkCancellable } from '$lib/utils/payment-link-map';
	import { debounce } from '$lib/utils/debounce.js';
	import { Plus, RefreshCw, X } from '$lib/assets/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type StatusTab = keyof PaymentLinkCounts;

	const summaryCards: { label: StatusTab; status: PaymentLinkStatus | null }[] = [
		{ label: 'All', status: null },
		{ label: 'Issued', status: 'issued' },
		{ label: 'Attempted', status: 'attempted' },
		{ label: 'Paid', status: 'paid' },
		{ label: 'Cancelled', status: 'cancelled' },
		{ label: 'Expired', status: 'expired' }
	];

	const searchFields = [
		{ value: 'id', label: 'Payment Link ID', placeholder: 'e.g. inv_TR8w6NeWPKWZ3B…' }
	];

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	let selectedCard = $derived(
		summaryCards.find((card) => (card.status ?? '') === pagination.status)?.label ?? 'All'
	);
	let searchField = $state('id');
	let searchInput = $derived(pagination.search);
	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let createModalOpen = $state(false);
	let drawerOpen = $state(false);
	let selectedLink = $state<PaymentLink | null>(null);
	let cancelConfirmOpen = $state(false);
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
			await invalidate('payment-links:list');
		} finally {
			refreshing = false;
		}
	}

	function handleLinkCreated(link: PaymentLink) {
		selectedLink = link;
		cancelConfirmOpen = false;
		drawerOpen = true;
		pagination.clearAllFilters();
		void invalidate('payment-links:list');
	}

	function handleLinkCancelled(link: PaymentLink) {
		selectedLink = link;
		cancelConfirmOpen = false;
		void invalidate('payment-links:list');
	}

	function openLinkDetails(link: PaymentLinkListRow) {
		selectedLink = link;
		cancelConfirmOpen = false;
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
				label: 'Payment Link ID',
				value: pagination.search.trim()
			});
		}
		return filters;
	});

	const showingText = $derived(
		data.listError
			? 'Unable to load payment links'
			: data.pagination.total === 0
				? 'No payment links'
				: `${pagination.showingText} payment links`
	);

	const columns: ColumnDef<PaymentLinkListRow>[] = [
		{
			accessorKey: 'id',
			header: 'Payment Link ID',
			cell: (info) => {
				const value = info.getValue<string>();
				return value;
			}
		},
		{
			accessorKey: 'createdAt',
			header: 'Created At',
			cell: (info) => formatPaymentLinkDate(info.row.original.createdAt)
		},
		{
			accessorKey: 'amount',
			header: 'Amount',
			cell: (info) => formatPaymentLinkAmount(info.getValue<number>())
		},
		{
			accessorKey: 'paymentLinkUrl',
			header: 'Payment Link',
			cell: (info) => renderComponent(PaymentLinkUrlCell, { url: info.getValue<string>() })
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(PaymentLinkStatusBadge, { status: info.getValue<PaymentLink['status']>() })
		},
		{
			accessorKey: 'receiptNo',
			header: 'Receipt No.',
			cell: (info) => info.getValue<string | null>() ?? '—'
		}
	];

	const tableRows = $derived(data.links as PaymentLinkListRow[]);
</script>

<div class="flex flex-col gap-6">
	<FilterCards
		loading={false}
		skeletonCount={6}
		cards={filterCards}
		selected={selectedCard}
		onselect={selectCard}
		class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
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
					aria-label="Refresh payment links"
				>
					<RefreshCw class={refreshing ? 'animate-spin' : undefined} />
				</Button>
				<Button onclick={() => (createModalOpen = true)}>
					<Plus />
					Create Payment Link
				</Button>
			</div>
		</div>

		{#if tableRows.length === 0}
			<EmptyState
				title={data.listError
					? 'Unable to load payment links'
					: 'No payment links match your filters'}
				description={data.listError
					? data.listError
					: 'Try a different payment link ID, or create a new link.'}
				actionLabel={data.listError
					? undefined
					: activeFilters.length > 0
						? 'Clear filters'
						: 'Create Payment Link'}
				onaction={() => (activeFilters.length > 0 ? clearAllFilters() : (createModalOpen = true))}
			/>
		{:else}
			<Table
				data={tableRows}
				{columns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				onRowClick={openLinkDetails}
				variant="borderless"
			/>
		{/if}
	</div>
</div>

<CreatePaymentLinkModal bind:open={createModalOpen} onCreated={handleLinkCreated} />

<Drawer
	bind:open={drawerOpen}
	title="Payment Link Details"
	direction="right"
	class="h-full max-w-md"
>
	{#if selectedLink}
		<PaymentLinkDetailsDrawer
			link={selectedLink}
			bind:confirmOpen={cancelConfirmOpen}
			onCancelled={handleLinkCancelled}
		/>
	{/if}
	{#snippet footer()}
		{#if selectedLink && isPaymentLinkCancellable(selectedLink.status)}
			<Button
				type="button"
				variant="destructive"
				class="w-full"
				onclick={() => (cancelConfirmOpen = true)}
			>
				Cancel payment link
			</Button>
		{/if}
	{/snippet}
</Drawer>
