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
	import StatusBadge from './status-badge.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Plus, RefreshCw, X } from '$lib/assets/icons';

	type PayinStatus = 'success' | 'pending' | 'failed';

	interface PayinRow extends Record<string, unknown> {
		txnId: string;
		date: string;
		customer: string;
		method: string;
		amount: string;
		status: PayinStatus;
		_dateMs: number;
	}

	const DAY_MS = 86_400_000;
	const now = Date.now();

	function fmtDate(ms: number): string {
		return new Date(ms).toLocaleString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const mockData: PayinRow[] = [
		{
			txnId: 'TXN-1001',
			date: fmtDate(now - 1 * DAY_MS),
			customer: 'Arjun Mehta',
			method: 'UPI',
			amount: '₹4,500.00',
			status: 'success',
			_dateMs: now - 1 * DAY_MS
		},
		{
			txnId: 'TXN-1002',
			date: fmtDate(now - 2 * DAY_MS),
			customer: 'Priya Sharma',
			method: 'Net Banking',
			amount: '₹12,000.00',
			status: 'pending',
			_dateMs: now - 2 * DAY_MS
		},
		{
			txnId: 'TXN-1003',
			date: fmtDate(now - 3 * DAY_MS),
			customer: 'Vikram Nair',
			method: 'UPI',
			amount: '₹2,750.00',
			status: 'success',
			_dateMs: now - 3 * DAY_MS
		},
		{
			txnId: 'TXN-1004',
			date: fmtDate(now - 5 * DAY_MS),
			customer: 'Sneha Iyer',
			method: 'UPI',
			amount: '₹8,200.00',
			status: 'success',
			_dateMs: now - 5 * DAY_MS
		},
		{
			txnId: 'TXN-1005',
			date: fmtDate(now - 6 * DAY_MS),
			customer: 'Rahul Gupta',
			method: 'Debit Card',
			amount: '₹1,500.00',
			status: 'success',
			_dateMs: now - 6 * DAY_MS
		},
		{
			txnId: 'TXN-1006',
			date: fmtDate(now - 9 * DAY_MS),
			customer: 'Kavya Reddy',
			method: 'UPI',
			amount: '₹6,800.00',
			status: 'pending',
			_dateMs: now - 9 * DAY_MS
		},
		{
			txnId: 'TXN-1007',
			date: fmtDate(now - 12 * DAY_MS),
			customer: 'Amit Kumar',
			method: 'Net Banking',
			amount: '₹25,000.00',
			status: 'success',
			_dateMs: now - 12 * DAY_MS
		},
		{
			txnId: 'TXN-1008',
			date: fmtDate(now - 14 * DAY_MS),
			customer: 'Divya Krishnan',
			method: 'Credit Card',
			amount: '₹3,200.00',
			status: 'failed',
			_dateMs: now - 14 * DAY_MS
		},
		{
			txnId: 'TXN-1009',
			date: fmtDate(now - 18 * DAY_MS),
			customer: 'Suresh Patel',
			method: 'UPI',
			amount: '₹9,500.00',
			status: 'success',
			_dateMs: now - 18 * DAY_MS
		},
		{
			txnId: 'TXN-1010',
			date: fmtDate(now - 22 * DAY_MS),
			customer: 'Meera Pillai',
			method: 'Wallet',
			amount: '₹750.00',
			status: 'success',
			_dateMs: now - 22 * DAY_MS
		},
		{
			txnId: 'TXN-1011',
			date: fmtDate(now - 25 * DAY_MS),
			customer: 'Rajesh Verma',
			method: 'UPI',
			amount: '₹15,000.00',
			status: 'pending',
			_dateMs: now - 25 * DAY_MS
		},
		{
			txnId: 'TXN-1012',
			date: fmtDate(now - 28 * DAY_MS),
			customer: 'Anita Bose',
			method: 'Net Banking',
			amount: '₹42,000.00',
			status: 'success',
			_dateMs: now - 28 * DAY_MS
		},
		{
			txnId: 'TXN-1013',
			date: fmtDate(now - 35 * DAY_MS),
			customer: 'Kiran Singh',
			method: 'Credit Card',
			amount: '₹5,600.00',
			status: 'failed',
			_dateMs: now - 35 * DAY_MS
		},
		{
			txnId: 'TXN-1014',
			date: fmtDate(now - 45 * DAY_MS),
			customer: 'Pooja Menon',
			method: 'UPI',
			amount: '₹11,200.00',
			status: 'success',
			_dateMs: now - 45 * DAY_MS
		},
		{
			txnId: 'TXN-1015',
			date: fmtDate(now - 52 * DAY_MS),
			customer: 'Dev Joshi',
			method: 'Debit Card',
			amount: '₹2,300.00',
			status: 'success',
			_dateMs: now - 52 * DAY_MS
		},
		{
			txnId: 'TXN-1016',
			date: fmtDate(now - 60 * DAY_MS),
			customer: 'Riya Desai',
			method: 'Wallet',
			amount: '₹450.00',
			status: 'pending',
			_dateMs: now - 60 * DAY_MS
		},
		{
			txnId: 'TXN-1017',
			date: fmtDate(now - 72 * DAY_MS),
			customer: 'Sanjay Rao',
			method: 'Net Banking',
			amount: '₹18,900.00',
			status: 'success',
			_dateMs: now - 72 * DAY_MS
		},
		{
			txnId: 'TXN-1018',
			date: fmtDate(now - 85 * DAY_MS),
			customer: 'Nandini Ghosh',
			method: 'Credit Card',
			amount: '₹7,100.00',
			status: 'success',
			_dateMs: now - 85 * DAY_MS
		},
		{
			txnId: 'TXN-1019',
			date: fmtDate(now - 95 * DAY_MS),
			customer: 'Mohan Das',
			method: 'UPI',
			amount: '₹3,400.00',
			status: 'failed',
			_dateMs: now - 95 * DAY_MS
		},
		{
			txnId: 'TXN-1020',
			date: fmtDate(now - 110 * DAY_MS),
			customer: 'Lakshmi Kumar',
			method: 'Net Banking',
			amount: '₹22,500.00',
			status: 'success',
			_dateMs: now - 110 * DAY_MS
		}
	];

	const summaryCards: { label: string; status: string | null }[] = [
		{ label: 'Transactions', status: null },
		{ label: 'Successful', status: 'success' },
		{ label: 'Refunds', status: 'refunded' },
		{ label: 'Disputes', status: 'disputed' },
		{ label: 'Failures', status: 'failed' }
	];

	const paymentStatusOptions = [
		{ value: 'success', label: 'Success' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'failed', label: 'Failed' }
	];

	const paymentMethodOptions = [
		{ value: 'UPI', label: 'UPI' },
		{ value: 'Net Banking', label: 'Net Banking' },
		{ value: 'Credit Card', label: 'Credit Card' },
		{ value: 'Debit Card', label: 'Debit Card' },
		{ value: 'Wallet', label: 'Wallet' }
	];

	let selectedCard = $state<string>('All');
	let paymentStatus = $state<string | undefined>(undefined);
	let paymentMethod = $state<string | undefined>(undefined);

	const columns: ColumnDef<PayinRow>[] = [
		{ accessorKey: 'txnId', header: 'Transaction ID' },
		{ accessorKey: 'date', header: 'Date & Time' },
		{ accessorKey: 'customer', header: 'Customer' },
		{ accessorKey: 'method', header: 'Payment Method' },
		{ accessorKey: 'amount', header: 'Amount', enableSorting: true },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => renderComponent(StatusBadge, { status: info.getValue<PayinStatus>() })
		}
	];

	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let pageNumber = $state(1);
	const pageSize = 10;

	function selectCard(label: string) {
		const card = summaryCards.find((c) => c.label === label);
		selectedCard = label;
		paymentStatus = card?.status ?? undefined;
		pageNumber = 1;
	}

	// function onPaymentStatusChange(val: string) {
	// 	paymentStatus = val;
	// 	const match = summaryCards.find((c) => c.status === val);
	// 	selectedCard = match ? match.label : 'All';
	// 	pageNumber = 1;
	// }

	function onPaymentMethodChange(val: string) {
		paymentMethod = val;
		pageNumber = 1;
	}

	function removeFilter(key: 'date' | 'status' | 'method') {
		if (key === 'date') {
			dateRange = { start: undefined, end: undefined };
		} else if (key === 'status') {
			paymentStatus = undefined;
			selectedCard = 'All';
		} else if (key === 'method') {
			paymentMethod = undefined;
		}
		pageNumber = 1;
	}

	function clearAllFilters() {
		dateRange = { start: undefined, end: undefined };
		paymentStatus = undefined;
		paymentMethod = undefined;
		selectedCard = 'All';
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
		let result = dateFilteredData;
		if (paymentStatus) {
			result = result.filter((r) => r.status === paymentStatus);
		}
		if (paymentMethod) {
			result = result.filter((r) => r.method === paymentMethod);
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

		if (paymentStatus) {
			const opt = paymentStatusOptions.find((o) => o.value === paymentStatus);
			filters.push({ key: 'status', label: 'Status', value: opt?.label ?? paymentStatus });
		}

		if (paymentMethod) {
			const opt = paymentMethodOptions.find((o) => o.value === paymentMethod);
			filters.push({ key: 'method', label: 'Payment Method', value: opt?.label ?? paymentMethod });
		}

		return filters;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredData.length / pageSize)));
	const pagedData = $derived(
		filteredData.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
	);
	const showingText = $derived(
		`Showing ${pagedData.length} of ${filteredData.length} transactions`
	);
</script>

<div class="flex flex-col gap-6">
	<!-- Summary cards -->
	<FilterCards
		loading={false}
		skeletonCount={5}
		cards={filterCards}
		bind:selected={selectedCard}
		onselect={selectCard}
		class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
	/>

	<!-- Filter bar -->
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
						{ value: 'customer', label: 'Customer', placeholder: 'e.g. Arjun Mehta…' },
						{ value: 'method', label: 'Payment Method', placeholder: 'e.g. UPI…' },
						{ value: 'amount', label: 'Amount', placeholder: 'e.g. 4500…' }
					]}
					field="txnId"
					value=""
				/>
			</div>
		</div>

		<!-- Active filter chips -->
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

	<!-- Transactions table -->
	<div class="border-border rounded-lg border bg-background shadow-sm">
		<div class="p-4 flex gap-2 justify-between items-center">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button variant="outline">
					<RefreshCw />
				</Button>
				<Button>
					<Plus />

					Payment Link</Button
				>
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
			loading={false}
			skeletonRows={8}
			onRowClick={(row) => goto(resolve('/merchant/transactions/payins/[id]', { id: row.txnId }))}
		/>
	</div>
</div>
