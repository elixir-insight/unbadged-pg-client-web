<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Table,
		DateRangePicker,
		Button,
		FilterCards,
		SearchField
	} from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import type { DateRange } from 'bits-ui';
	import { getLocalTimeZone } from '@internationalized/date';
	import { payinOrderListMock } from '$lib/data/payin-order-mock';
	import type { PayinOrderListItem, PayinOrderStatus } from '$lib/types/payin';
	import { CollectionsTabs, OrderStatusBadge } from '$lib/components/transactions/collections';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Plus, RefreshCw, X } from '$lib/assets/icons';

	const DAY_MS = 86_400_000;
	const mockData = payinOrderListMock;

	const summaryCards: { label: string; status: PayinOrderStatus | null }[] = [
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

	let selectedCard = $state<string>('Orders');
	let orderStatus = $state<PayinOrderStatus | undefined>(undefined);

	const columns: ColumnDef<PayinOrderListItem>[] = [
		{ accessorKey: 'orderId', header: 'Order ID' },
		{ accessorKey: 'createdAt', header: 'Date & Time' },
		{ accessorKey: 'customer', header: 'Customer' },
		{ accessorKey: 'amount', header: 'Amount', enableSorting: true },
		{ accessorKey: 'attemptCount', header: 'Attempts', enableSorting: true },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(OrderStatusBadge, { status: info.getValue<PayinOrderStatus>() })
		}
	];

	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let pageNumber = $state(1);
	const pageSize = 10;

	function selectCard(label: string) {
		const card = summaryCards.find((c) => c.label === label);
		selectedCard = label;
		orderStatus = card?.status ?? undefined;
		pageNumber = 1;
	}

	function removeFilter(key: 'date' | 'status') {
		if (key === 'date') {
			dateRange = { start: undefined, end: undefined };
		} else if (key === 'status') {
			orderStatus = undefined;
			selectedCard = 'Orders';
		}
		pageNumber = 1;
	}

	function clearAllFilters() {
		dateRange = { start: undefined, end: undefined };
		orderStatus = undefined;
		selectedCard = 'Orders';
		pageNumber = 1;
	}

	const dateFilter = $derived.by(() => {
		if (dateRange.start && dateRange.end) {
			const tz = getLocalTimeZone();
			return {
				start: dateRange.start.toDate(tz).getTime(),
				end: dateRange.end.toDate(tz).getTime() + DAY_MS
			};
		}
		return null;
	});

	const dateFilteredData = $derived(
		dateFilter
			? mockData.filter((r) => r._dateMs >= dateFilter.start && r._dateMs <= dateFilter.end)
			: mockData
	);

	const cardCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const card of summaryCards) {
			counts[card.label] =
				card.status === null
					? dateFilteredData.length
					: dateFilteredData.filter((r) => r.status === card.status).length;
		}
		return counts;
	});

	const filterCards = $derived(
		summaryCards.map((c) => ({ label: c.label, count: cardCounts[c.label] ?? 0 }))
	);

	const filteredData = $derived.by(() => {
		if (!orderStatus) return dateFilteredData;
		return dateFilteredData.filter((r) => r.status === orderStatus);
	});

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'status'; label: string; value: string }[] = [];

		if (dateRange.start && dateRange.end) {
			const tz = getLocalTimeZone();
			const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
			const start = dateRange.start.toDate(tz);
			const end = dateRange.end.toDate(tz);
			filters.push({ key: 'date', label: 'Date', value: `${fmt(start)} – ${fmt(end)}` });
		}

		if (orderStatus) {
			const opt = statusOptions.find((o) => o.value === orderStatus);
			filters.push({ key: 'status', label: 'Status', value: opt?.label ?? orderStatus });
		}

		return filters;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredData.length / pageSize)));
	const pagedData = $derived(
		filteredData.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
	);
	const showingText = $derived(`Showing ${pagedData.length} of ${filteredData.length} orders`);
</script>

<div class="flex flex-col gap-6">
	<FilterCards
		loading={false}
		skeletonCount={5}
		cards={filterCards}
		bind:selected={selectedCard}
		onselect={selectCard}
		class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
	/>

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<DateRangePicker
				bind:value={dateRange}
				onApply={() => {
					pageNumber = 1;
				}}
			/>
			<div class="w-full max-w-xs">
				<SearchField
					fields={[
						{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD-2026-001…' },
						{ value: 'customer', label: 'Customer', placeholder: 'e.g. Arjun Mehta…' },
						{ value: 'amount', label: 'Amount', placeholder: 'e.g. 4500…' }
					]}
					field="orderId"
					value=""
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

	<div class="border-border overflow-hidden rounded-lg border bg-background shadow-sm">
		<CollectionsTabs basePath="/merchant/transactions/collections" />

		<div class="border-t border-border p-4 flex gap-2 justify-between items-center">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button variant="outline">
					<RefreshCw />
				</Button>
				<Button>
					<Plus />
					Payment Link
				</Button>
			</div>
		</div>

		<Table
			data={pagedData}
			{columns}
			{pageNumber}
			{totalPages}
			setPageNumber={(p) => {
				pageNumber = p;
			}}
			onRowClick={(row) =>
				goto(
					resolve('/merchant/transactions/collections/orders/[orderId]', { orderId: row.orderId })
				)}
		/>
	</div>
</div>
