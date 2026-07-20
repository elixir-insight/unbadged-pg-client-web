<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Table,
		DateRangePicker,
		Dropdown,
		Button,
		FilterCards,
		SearchField
	} from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import type { DateRange } from 'bits-ui';
	import { getLocalTimeZone } from '@internationalized/date';
	import { getPayinPaymentList } from '$lib/data/payin-order-mock';
	import type { PayinPaymentListItem, PayinPaymentStatus } from '$lib/types/payin';
	import { CollectionsTabs, PaymentStatusBadge } from '$lib/components/transactions/collections';
	import {
		getCurrentScope,
		gotoScopedRoute,
		scopeQueryString
	} from '$lib/utils/transaction-scope.svelte';
	import { RefreshCw, X } from '$lib/assets/icons';

	const scope = $derived(getCurrentScope());
	const scopeQuery = $derived(scopeQueryString(scope));
	const mockData = $derived(getPayinPaymentList(scope));

	const DAY_MS = 86_400_000;

	type PaymentFilter = PayinPaymentStatus | 'refunded';

	const summaryCards: { label: string; filter: PaymentFilter | null }[] = [
		{ label: 'Payments', filter: null },
		{ label: 'Successful', filter: 'success' },
		{ label: 'Pending', filter: 'pending' },
		{ label: 'Refunded', filter: 'refunded' },
		{ label: 'Failed', filter: 'failed' }
	];

	const paymentMethodOptions = [
		{ value: 'UPI', label: 'UPI' },
		{ value: 'Net Banking', label: 'Net Banking' },
		{ value: 'Credit Card', label: 'Credit Card' },
		{ value: 'Debit Card', label: 'Debit Card' },
		{ value: 'Wallet', label: 'Wallet' }
	];

	let selectedCard = $state<string>('Payments');
	let paymentFilter = $state<PaymentFilter | undefined>(undefined);
	let paymentMethod = $state<string | undefined>(undefined);

	const columns: ColumnDef<PayinPaymentListItem>[] = [
		{ accessorKey: 'txnId', header: 'Transaction ID' },
		{ accessorKey: 'orderId', header: 'Order ID' },
		{ accessorKey: 'createdAt', header: 'Date & Time' },
		{ accessorKey: 'customer', header: 'Customer' },
		{ accessorKey: 'paymentMethod', header: 'Method' },
		{ accessorKey: 'attemptNumber', header: 'Attempt' },
		{ accessorKey: 'amount', header: 'Amount', enableSorting: true },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(PaymentStatusBadge, { status: info.getValue<PayinPaymentStatus>() })
		}
	];

	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let pageNumber = $state(1);
	const pageSize = 10;

	function selectCard(label: string) {
		const card = summaryCards.find((c) => c.label === label);
		selectedCard = label;
		paymentFilter = card?.filter ?? undefined;
		pageNumber = 1;
	}

	function onPaymentMethodChange(val: string) {
		paymentMethod = val;
		pageNumber = 1;
	}

	function removeFilter(key: 'date' | 'status' | 'method') {
		if (key === 'date') {
			dateRange = { start: undefined, end: undefined };
		} else if (key === 'status') {
			paymentFilter = undefined;
			selectedCard = 'Payments';
		} else if (key === 'method') {
			paymentMethod = undefined;
		}
		pageNumber = 1;
	}

	function clearAllFilters() {
		dateRange = { start: undefined, end: undefined };
		paymentFilter = undefined;
		paymentMethod = undefined;
		selectedCard = 'Payments';
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
				card.filter === null
					? dateFilteredData.length
					: card.filter === 'refunded'
						? dateFilteredData.filter((r) => r.status === 'refunded').length
						: dateFilteredData.filter((r) => r.status === card.filter).length;
		}
		return counts;
	});

	const filterCards = $derived(
		summaryCards.map((c) => ({ label: c.label, count: cardCounts[c.label] ?? 0 }))
	);

	const filteredData = $derived.by(() => {
		let result = dateFilteredData;
		if (paymentFilter) {
			result =
				paymentFilter === 'refunded'
					? result.filter((r) => r.status === 'refunded')
					: result.filter((r) => r.status === paymentFilter);
		}
		if (paymentMethod) {
			result = result.filter((r) => r.paymentMethod === paymentMethod);
		}
		return result;
	});

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'status' | 'method'; label: string; value: string }[] = [];

		if (dateRange.start && dateRange.end) {
			const tz = getLocalTimeZone();
			const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
			const start = dateRange.start.toDate(tz);
			const end = dateRange.end.toDate(tz);
			filters.push({ key: 'date', label: 'Date', value: `${fmt(start)} – ${fmt(end)}` });
		}

		if (paymentFilter) {
			const labels: Record<PaymentFilter, string> = {
				pending: 'Pending',
				failed: 'Failed',
				authorized: 'Authorized',
				success: 'Success',
				refunded: 'Refunded'
			};
			filters.push({ key: 'status', label: 'Status', value: labels[paymentFilter] });
		}

		if (paymentMethod) {
			const opt = paymentMethodOptions.find((o) => o.value === paymentMethod);
			filters.push({ key: 'method', label: 'Method', value: opt?.label ?? paymentMethod });
		}

		return filters;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredData.length / pageSize)));
	const pagedData = $derived(
		filteredData.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
	);
	const showingText = $derived(`Showing ${pagedData.length} of ${filteredData.length} payments`);
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
			<div class="flex flex-wrap items-center gap-2">
				<DateRangePicker
					bind:value={dateRange}
					onApply={() => {
						pageNumber = 1;
					}}
				/>
				<div class="w-50">
					<Dropdown
						bind:value={paymentMethod}
						placeholder="Payment Method"
						disabled={false}
						bordered={false}
						search={false}
						options={paymentMethodOptions}
						onValueChange={onPaymentMethodChange}
					/>
				</div>
			</div>
			<div class="w-full max-w-xs">
				<SearchField
					fields={[
						{ value: 'txnId', label: 'Transaction ID', placeholder: 'e.g. TXN-1001…' },
						{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD-2026-001…' },
						{ value: 'customer', label: 'Customer', placeholder: 'e.g. Arjun Mehta…' }
					]}
					field="txnId"
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
		<CollectionsTabs basePath="/management/transactions/collections" {scopeQuery} />

		<div class="border-t border-border p-4 flex gap-2 justify-between items-center">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<Button variant="outline">
				<RefreshCw />
			</Button>
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
				gotoScopedRoute(
					'/management/transactions/collections/payments/[txnId]',
					{ txnId: row.txnId },
					scope
				)}
		/>
	</div>
</div>
