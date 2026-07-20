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
	import { payoutMockData } from '$lib/data/payout-mock';
	import type { PayoutRow } from '$lib/types/payout';
	import { DisbursementStatusBadge } from '$lib/components/transactions/disbursements';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Plus, RefreshCw, X } from '$lib/assets/icons';

	const DAY_MS = 86_400_000;
	const mockData = payoutMockData;

	const summaryCards: { label: string; status: string | null }[] = [
		{ label: 'Transactions', status: null },
		{ label: 'Successful', status: 'success' },
		{ label: 'Pending', status: 'pending' },
		{ label: 'Failed', status: 'failed' }
	];

	const transactionStatusOptions = [
		{ value: 'success', label: 'Success' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'failed', label: 'Failed' }
	];

	const transactionTypeOptions = [
		{ value: 'IMPS', label: 'IMPS' },
		{ value: 'NEFT', label: 'NEFT' },
		{ value: 'RTGS', label: 'RTGS' },
		{ value: 'UPI', label: 'UPI' }
	];

	let selectedCard = $state<string>('Transactions');
	let transactionStatus = $state<string | undefined>(undefined);
	let transactionType = $state<string | undefined>(undefined);

	const columns: ColumnDef<PayoutRow>[] = [
		{ accessorKey: 'beneficiaryName', header: 'Beneficiary' },
		{ accessorKey: 'crn', header: 'CRN' },
		{ accessorKey: 'utr', header: 'UTR' },
		{ accessorKey: 'clientOrderId', header: 'Client Order ID' },
		{ accessorKey: 'transactionAmount', header: 'Amount', enableSorting: true },
		{ accessorKey: 'createdAt', header: 'Date & Time' },
		{ accessorKey: 'transactionType', header: 'Type' },
		{
			accessorKey: 'transactionStatus',
			header: 'Status',
			cell: (info) => renderComponent(DisbursementStatusBadge, { status: info.getValue<string>() })
		}
	];

	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let pageNumber = $state(1);
	const pageSize = 10;

	function selectCard(label: string) {
		const card = summaryCards.find((c) => c.label === label);
		selectedCard = label;
		transactionStatus = card?.status ?? undefined;
		pageNumber = 1;
	}

	function onTransactionTypeChange(val: string) {
		transactionType = val;
		pageNumber = 1;
	}

	function removeFilter(key: 'date' | 'status' | 'type') {
		if (key === 'date') {
			dateRange = { start: undefined, end: undefined };
		} else if (key === 'status') {
			transactionStatus = undefined;
			selectedCard = 'Transactions';
		} else if (key === 'type') {
			transactionType = undefined;
		}
		pageNumber = 1;
	}

	function clearAllFilters() {
		dateRange = { start: undefined, end: undefined };
		transactionStatus = undefined;
		transactionType = undefined;
		selectedCard = 'Transactions';
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
					: dateFilteredData.filter((r) => r.transactionStatus === card.status).length;
		}
		return counts;
	});

	const filterCards = $derived(
		summaryCards.map((c) => ({ label: c.label, count: cardCounts[c.label] ?? 0 }))
	);

	const filteredData = $derived.by(() => {
		let result = dateFilteredData;
		if (transactionStatus) {
			result = result.filter((r) => r.transactionStatus === transactionStatus);
		}
		if (transactionType) {
			result = result.filter((r) => r.transactionType === transactionType);
		}
		return result;
	});

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'status' | 'type'; label: string; value: string }[] = [];

		if (dateRange.start && dateRange.end) {
			const tz = getLocalTimeZone();
			const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
			const start = dateRange.start.toDate(tz);
			const end = dateRange.end.toDate(tz);
			filters.push({ key: 'date', label: 'Date', value: `${fmt(start)} – ${fmt(end)}` });
		}

		if (transactionStatus) {
			const opt = transactionStatusOptions.find((o) => o.value === transactionStatus);
			filters.push({ key: 'status', label: 'Status', value: opt?.label ?? transactionStatus });
		}

		if (transactionType) {
			const opt = transactionTypeOptions.find((o) => o.value === transactionType);
			filters.push({
				key: 'type',
				label: 'Transaction Type',
				value: opt?.label ?? transactionType
			});
		}

		return filters;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredData.length / pageSize)));
	const pagedData = $derived(
		filteredData.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
	);
	const showingText = $derived(`Showing ${pagedData.length} of ${filteredData.length} payouts`);
</script>

<div class="flex flex-col gap-6">
	<!-- Summary cards -->
	<FilterCards
		loading={false}
		skeletonCount={4}
		cards={filterCards}
		bind:selected={selectedCard}
		onselect={selectCard}
		class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
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
						bind:value={transactionType}
						placeholder="Transaction Type"
						disabled={false}
						bordered={false}
						search={false}
						options={transactionTypeOptions}
						onValueChange={onTransactionTypeChange}
					/>
				</div>
			</div>
			<div class="w-full max-w-xs">
				<SearchField
					fields={[
						{
							value: 'clientOrderId',
							label: 'Client Order ID',
							placeholder: 'e.g. PO-1001…'
						},
						{
							value: 'beneficiaryName',
							label: 'Beneficiary',
							placeholder: 'e.g. Arjun Mehta…'
						},
						{ value: 'crn', label: 'CRN', placeholder: 'e.g. CRN-2026001…' },
						{ value: 'utr', label: 'UTR', placeholder: 'e.g. 123456789012…' }
					]}
					field="clientOrderId"
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

	<!-- Payouts table -->
	<div class="rounded-lg border border-border bg-background shadow-sm">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button variant="outline">
					<RefreshCw />
				</Button>
				<Button>
					<Plus />
					New Payout
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
			loading={false}
			skeletonRows={8}
			onRowClick={(row) =>
				goto(resolve('/merchant/transactions/disbursements/[id]', { id: row.clientOrderId }))}
		/>
	</div>
</div>
