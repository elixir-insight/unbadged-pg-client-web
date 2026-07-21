<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Button,
		Chip,
		DateRangePicker,
		EmptyState,
		FilterCards,
		SearchField,
		Table,
		createUrlPagination
	} from '$lib/components/reusable';
	import { CollectionsTabs, OrderStatusBadge } from '$lib/components/transactions/collections';
	import type { PayinOrderStatus } from '$lib/types/payin';
	import type { DateRange } from 'bits-ui';
	import { parseDate, type CalendarDate, type DateValue } from '@internationalized/date';
	import { debounce } from '$lib/utils/debounce.js';
	import { RefreshCw, X } from '$lib/assets/icons';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';
	import {
		getCurrentScope,
		gotoScopedRoute,
		scopeQueryString
	} from '$lib/utils/transaction-scope.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const summaryCards: {
		label: keyof PageData['counts'];
		status: PayinOrderStatus | null;
	}[] = [
		{ label: 'Orders', status: null },
		{ label: 'Successful', status: 'success' },
		{ label: 'Pending', status: 'pending' },
		{ label: 'Created', status: 'created' },
		{ label: 'Failed', status: 'failed' }
	];

	const statusOptions: { value: PayinOrderStatus; label: string }[] = [
		{ value: 'created', label: 'Created' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'success', label: 'Success' },
		{ value: 'failed', label: 'Failed' },
		{ value: 'expired', label: 'Expired' }
	];

	const searchFields = [{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD-2026-001…' }];

	const scope = $derived(getCurrentScope());
	const scopeQuery = $derived(scopeQueryString(scope));
	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	let orderStatus = $derived<PayinOrderStatus | undefined>(
		statusOptions.some((option) => option.value === pagination.status)
			? (pagination.status as PayinOrderStatus)
			: undefined
	);
	let selectedCard = $derived(
		summaryCards.find((card) => (card.status ?? '') === (orderStatus ?? ''))?.label ?? 'Orders'
	);
	let searchInput = $derived(pagination.search);
	let refreshing = $state(false);

	function parseUrlDate(value: string | null): CalendarDate | undefined {
		if (!value) return undefined;
		try {
			return parseDate(value);
		} catch {
			return undefined;
		}
	}

	let dateRange = $derived<DateRange>({
		start: parseUrlDate(page.url.searchParams.get('fromDate')),
		end: parseUrlDate(page.url.searchParams.get('toDate'))
	});

	function navigate(updates: Record<string, string | null>) {
		const url = new SvelteURL(page.url.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value) url.searchParams.set(key, value);
			else url.searchParams.delete(key);
		}
		const href =
			`${url.pathname}?${url.searchParams.toString()}` as `${typeof url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
	}

	function applyDateRange(range: DateRange) {
		navigate({
			fromDate: range.start?.toString() ?? null,
			toDate: range.end?.toString() ?? null,
			skip: null
		});
	}

	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 200);

	function selectCard(label: string) {
		const card = summaryCards.find((item) => item.label === label);
		pagination.setStatus(card?.status ?? '');
	}

	function removeFilter(key: 'date' | 'status' | 'search') {
		if (key === 'date') navigate({ fromDate: null, toDate: null, skip: null });
		if (key === 'status') pagination.setStatus('');
		if (key === 'search') pagination.setSearch('');
	}

	function clearAllFilters() {
		navigate({
			fromDate: null,
			toDate: null,
			status: null,
			search: null,
			skip: null
		});
	}

	async function refreshList() {
		refreshing = true;
		try {
			await invalidate('management-payment-orders:list');
		} finally {
			refreshing = false;
		}
	}

	const filterCards = $derived(
		summaryCards.map((card) => ({
			label: card.label,
			count: data.counts[card.label]
		}))
	);

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'status' | 'search'; label: string; value: string }[] = [];
		const fromDate = page.url.searchParams.get('fromDate');
		const toDate = page.url.searchParams.get('toDate');

		if (fromDate && toDate && dateRange.start && dateRange.end) {
			const formatDate = (value: DateValue) =>
				value.toDate('Asia/Kolkata').toLocaleDateString('en-IN', {
					day: '2-digit',
					month: 'short'
				});
			filters.push({
				key: 'date',
				label: 'Date',
				value: `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`
			});
		}

		if (orderStatus) {
			const option = statusOptions.find((item) => item.value === orderStatus);
			filters.push({ key: 'status', label: 'Status', value: option?.label ?? orderStatus });
		}

		if (pagination.search) {
			filters.push({ key: 'search', label: 'Order ID', value: pagination.search });
		}

		return filters;
	});

	const showingText = $derived(
		data.listError ? 'Unable to load orders' : `${pagination.showingText} orders`
	);

	const columns: ColumnDef<PageData['orders'][number]>[] = [
		{ accessorKey: 'orderId', header: 'Order ID' },
		{ accessorKey: 'createdAt', header: 'Date & Time' },
		{ accessorKey: 'customer', header: 'Customer' },
		{ accessorKey: 'amount', header: 'Amount', enableSorting: true },
		{ accessorKey: 'attemptId', header: 'Attempt ID' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(OrderStatusBadge, { status: info.getValue<PayinOrderStatus>() })
		}
	];

	function goToOrder(row: PageData['orders'][number]) {
		gotoScopedRoute(
			'/management/transactions/collections/orders/[orderId]',
			{ orderId: row.orderId },
			scope
		);
	}
</script>

<div class="flex flex-col gap-6">
	<FilterCards
		loading={false}
		skeletonCount={5}
		cards={filterCards}
		selected={selectedCard}
		onselect={selectCard}
		class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
	/>

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<DateRangePicker bind:value={dateRange} onApply={applyDateRange} />
			<div class="w-full max-w-xs">
				<SearchField
					fields={searchFields}
					field="orderId"
					value={searchInput}
					onSearch={(_field, value) => debouncedSearch(value)}
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
							onclick={() => removeFilter(filter.key)}
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
		<CollectionsTabs basePath="/management/transactions/collections" {scopeQuery} />

		<div class="flex items-center justify-between gap-2 border-t border-border p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<Button
				variant="outline"
				onclick={refreshList}
				disabled={refreshing}
				aria-label="Refresh orders"
			>
				<RefreshCw class={refreshing ? 'animate-spin' : undefined} />
			</Button>
		</div>

		{#if data.orders.length === 0}
			<EmptyState
				title={data.listError ? 'Unable to load orders' : 'No orders match your filters'}
				description={data.listError
					? data.listError
					: 'Try a different date range, status, or order ID.'}
				actionLabel={activeFilters.length > 0 ? 'Clear filters' : undefined}
				onaction={clearAllFilters}
			/>
		{:else}
			<Table
				data={data.orders}
				{columns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				onRowClick={goToOrder}
				variant="borderless"
			/>
		{/if}
	</div>
</div>
