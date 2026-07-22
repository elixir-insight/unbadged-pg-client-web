<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { formatAbsoluteTime } from '$lib/utils/format-time';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Button,
		Chip,
		DateRangePicker,
		Dropdown,
		EmptyState,
		FilterCards,
		SearchField,
		Table,
		createUrlPagination
	} from '$lib/components/reusable';
	import { CollectionsTabs, PaymentStatusBadge } from '$lib/components/transactions/collections';
	import type { PayinPaymentStatus } from '$lib/types/payin';
	import type { DateRange } from 'bits-ui';
	import { parseDate, type CalendarDate, type DateValue } from '@internationalized/date';
	import { debounce } from '$lib/utils/debounce.js';
	import { RefreshCw, X } from '$lib/assets/icons';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type PaymentFilter = 'success' | 'pending' | 'failed';

	const summaryCards: {
		label: keyof PageData['counts'];
		filter: PaymentFilter | null;
		disabled?: boolean;
	}[] = [
		{ label: 'Payments', filter: null },
		{ label: 'Successful', filter: 'success' },
		{ label: 'Pending', filter: 'pending' },
		{ label: 'Refunds', filter: null, disabled: true },
		{ label: 'Failed', filter: 'failed' }
	];

	const paymentMethodOptions = [
		{ value: 'UPI', label: 'UPI' },
		{ value: 'NETBANKING', label: 'Net Banking' },
		{ value: 'CARD', label: 'Card' }
	];

	const searchFields = [
		{ value: 'payinAttemptId', label: 'Transaction ID', placeholder: 'e.g. PAT-1001…' },
		{ value: 'orderId', label: 'Order ID', placeholder: 'e.g. ORD-2026-001…' },
		{ value: 'settlementId', label: 'Settlement ID', placeholder: 'e.g. SETL-1001…' }
	];

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.pagination.total
	});

	let paymentFilter = $derived<PaymentFilter | undefined>(
		pagination.status === 'success' ||
			pagination.status === 'pending' ||
			pagination.status === 'failed'
			? pagination.status
			: undefined
	);
	let selectedCard = $derived(
		summaryCards.find((card) => card.filter === (paymentFilter ?? null) && !card.disabled)?.label ??
			'Payments'
	);
	let paymentMethod = $derived(pagination.type || undefined);
	let searchField = $derived(page.url.searchParams.get('searchField') ?? 'payinAttemptId');
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

	const debouncedSearch = debounce(
		(input: { field: string; value: string }) =>
			navigate({
				searchField: input.field,
				search: input.value || null,
				skip: null
			}),
		200
	);

	function handleSearch(field: string, value: string) {
		debouncedSearch({ field, value });
	}

	function selectCard(label: string) {
		const card = summaryCards.find((item) => item.label === label);
		if (!card?.disabled) pagination.setStatus(card?.filter ?? '');
	}

	function removeFilter(key: 'date' | 'status' | 'method' | 'search') {
		if (key === 'date') navigate({ fromDate: null, toDate: null, skip: null });
		if (key === 'status') pagination.setStatus('');
		if (key === 'method') pagination.setType('');
		if (key === 'search') navigate({ search: null, skip: null });
	}

	function clearAllFilters() {
		navigate({
			fromDate: null,
			toDate: null,
			status: null,
			type: null,
			search: null,
			searchField: null,
			skip: null
		});
	}

	async function refreshList() {
		refreshing = true;
		try {
			await invalidate('payment-attempts:list');
		} finally {
			refreshing = false;
		}
	}

	const filterCards = $derived(
		summaryCards.map((card) => ({
			label: card.label,
			count: data.counts[card.label],
			disabled: card.disabled
		}))
	);

	const activeFilters = $derived.by(() => {
		const filters: {
			key: 'date' | 'status' | 'method' | 'search';
			label: string;
			value: string;
		}[] = [];
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

		if (paymentFilter) {
			const labels: Record<PaymentFilter, string> = {
				success: 'Success',
				pending: 'Pending',
				failed: 'Failed'
			};
			filters.push({ key: 'status', label: 'Status', value: labels[paymentFilter] });
		}

		if (paymentMethod) {
			const option = paymentMethodOptions.find((item) => item.value === paymentMethod);
			filters.push({ key: 'method', label: 'Method', value: option?.label ?? paymentMethod });
		}

		if (pagination.search) {
			const option = searchFields.find((item) => item.value === searchField);
			filters.push({
				key: 'search',
				label: option?.label ?? 'Search',
				value: pagination.search
			});
		}

		return filters;
	});

	const showingText = $derived(
		data.vanSetupMessage
			? 'Collection account not set up'
			: data.listError
				? 'Unable to load payments'
				: `${pagination.showingText} payments`
	);

	const columns: ColumnDef<PageData['payments'][number]>[] = [
		{ accessorKey: 'txnId', header: 'Transaction ID' },
		{ accessorKey: 'orderId', header: 'Order ID' },
		{
			accessorKey: 'createdAt',
			header: 'Date & Time',
			cell: (info) => {
				const value = info.getValue<string>();
				if (!value) return '—';
				if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) return value;
				return formatAbsoluteTime(value);
			}
		},
		{ accessorKey: 'customer', header: 'Customer' },
		{ accessorKey: 'paymentMethod', header: 'Method' },
		{ accessorKey: 'paymentChannel', header: 'Channel' },
		{ accessorKey: 'amount', header: 'Amount', enableSorting: true },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(PaymentStatusBadge, { status: info.getValue<PayinPaymentStatus>() })
		}
	];

	function goToPayment(row: PageData['payments'][number]) {
		goto(resolve('/merchant/transactions/collections/payments/[txnId]', { txnId: row.txnId }));
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
			<div class="flex flex-wrap items-center gap-2">
				<DateRangePicker bind:value={dateRange} onApply={applyDateRange} />
				<div class="w-50">
					<Dropdown
						value={paymentMethod}
						placeholder="Payment Method"
						disabled={false}
						bordered={false}
						search={false}
						options={paymentMethodOptions}
						onValueChange={(value) => pagination.setType(value)}
					/>
				</div>
			</div>
			<div class="w-full max-w-xs">
				<SearchField
					fields={searchFields}
					field={searchField}
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
		<CollectionsTabs basePath="/merchant/transactions/collections" />

		<div class="flex items-center justify-between gap-2 border-t border-border p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<Button
				variant="outline"
				onclick={refreshList}
				disabled={refreshing}
				aria-label="Refresh payments"
			>
				<RefreshCw class={refreshing ? 'animate-spin' : undefined} />
			</Button>
		</div>

		{#if data.payments.length === 0}
			<EmptyState
				title={data.vanSetupMessage
					? 'Collection account not set up'
					: data.listError
						? 'Unable to load payments'
						: 'No payments match your filters'}
				description={data.vanSetupMessage
					? data.vanSetupMessage
					: data.listError
						? data.listError
						: 'Try a different date range, payment method, status, or identifier.'}
				actionLabel={!data.vanSetupMessage && activeFilters.length > 0
					? 'Clear filters'
					: undefined}
				onaction={clearAllFilters}
			/>
		{:else}
			{#key `${data.pagination.page}:${data.payments[0]?.txnId ?? 'empty'}:${data.payments.length}`}
				<Table
					data={data.payments}
					{columns}
					pageNumber={pagination.currentPage}
					totalPages={pagination.pageCount}
					setPageNumber={pagination.setPage}
					onRowClick={goToPayment}
					variant="borderless"
				/>
			{/key}
		{/if}
	</div>
</div>
