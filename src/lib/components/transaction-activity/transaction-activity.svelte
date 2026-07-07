<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import {
		Chip,
		Dropdown,
		Table,
		RangeCalendar,
		SearchField,
		Calendar
	} from '$lib/components/reusable';
	import Breadcrumb from '$lib/components/reusable/breadcrumb/breadcrumb.svelte';
	import type { DropdownOption, SearchFieldOption } from '$lib/components/reusable';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import type { Snippet } from 'svelte';
	import type { ColumnDef } from '@tanstack/table-core';
	import {
		Eye,
		RotateCcw,
		Download,
		Copy,
		Check,
		AlertCircle,
		Info,
		X,
		Landmark,
		CreditCard,
		PhoneIcon,
		ArrowUpDown
	} from '$lib/assets/icons';
	import type { DateRange } from 'bits-ui';
	import { CalendarDate } from '@internationalized/date';
	import {
		merchants,
		virtualAccounts,
		allRefunds,
		type Refund,
		type RefundType
	} from '$lib/data/refunds-mock';
	import { createUrlPagination } from '$lib/components/reusable/pagination/use-url-pagination.svelte';
	import { goto } from '$app/navigation';
	import { debounce } from '$lib/utils/debounce';

	const LIMIT = 10;

	const pagination = createUrlPagination({
		defaultLimit: LIMIT,
		total: () => filteredRefunds.length
	});

	function updateParams(params: Record<string, string | null>, replaceState = true) {
		const url = new URL(page.url);
		for (const [key, value] of Object.entries(params)) {
			if (value == null || value === '') {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${url.pathname}${url.search}${url.hash}`, {
			replaceState,
			noScroll: true,
			keepFocus: true
		});
	}

	// ── URL params ────────────────────────────────────────────────────────────
	const urlSkip = $derived(Math.max(0, Number(page.url.searchParams.get('skip')) || 0));
	const urlFilter = $derived(page.url.searchParams.get('filter') ?? 'crn');
	const urlValue = $derived(page.url.searchParams.get('value') ?? '');
	const urlStatus = $derived(page.url.searchParams.get('status') ?? '');
	const urlPayment = $derived(page.url.searchParams.get('payment') ?? '');
	const urlCustomFrom = $derived(page.url.searchParams.get('customFrom') ?? '');
	const urlCustomTo = $derived(page.url.searchParams.get('customTo') ?? '');
	const urlMerchantId = $derived(page.url.searchParams.get('merchant') ?? merchants[0]?.id ?? '');
	const urlVaId = $derived(page.url.searchParams.get('va') ?? '');

	// ── Derived entities ──────────────────────────────────────────────────────
	const selectedMerchant = $derived(
		merchants.find((m) => m.id === urlMerchantId) ?? merchants[0] ?? null
	);
	const selectedVA = $derived(virtualAccounts.find((va) => va.id === urlVaId) ?? null);

	// ── Local state ───────────────────────────────────────────────────────────
	let activitySearchInput = $state(page.url.searchParams.get('value') ?? '');
	let activityField = $state(page.url.searchParams.get('filter') ?? 'crn');
	let selectedRefund = $state<Refund | null>(null);
	let detailsOpen = $state(false);
	let createRefundOpen = $state(false);
	let refundType = $state<RefundType>('Full');
	let partialAmount = $state('');
	let remarks = $state('');
	const maxRemarks = 250;
	let copiedField = $state<string | null>(null);
	let reportDrawerOpen = $state(false);
	let reportDateRange = $state<DateRange>({ start: undefined, end: undefined });
	let reportStatuses = $state<string[]>([]);
	let reportPayments = $state<string[]>([]);
	let reportFormat = $state<'csv' | 'xlsx'>('csv');
	let reportEmail = $state('');

	// ── Filtered + paged refunds ──────────────────────────────────────────────
	const merchantRefunds = $derived(allRefunds.filter((r) => r.merchantId === selectedMerchant?.id));
	const filteredRefunds = $derived(
		merchantRefunds.filter((r) => {
			if (urlValue) {
				const q = urlValue.toLowerCase();
				const fm: Record<string, string> = {
					crn: r.crn,
					utr: r.utr,
					customerName: r.customerName,
					refundId: r.refundId
				};
				if (!(fm[urlFilter] ?? '').toLowerCase().includes(q)) return false;
			}
			if (urlStatus && r.status !== urlStatus) return false;
			if (urlPayment && r.paymentMethod !== urlPayment) return false;
			return true;
		})
	);
	const pagedRefunds = $derived(filteredRefunds.slice(urlSkip, urlSkip + LIMIT));

	// ── Derived display values ────────────────────────────────────────────────
	// const vaDisplayName = $derived(selectedVA ? `Va ${selectedVA.id.replace('VA', '').padStart(3, '0')}` : '');

	function parseUrlDate(s: string): CalendarDate | undefined {
		if (!s) return undefined;
		const [y, m, d] = s.split('-').map(Number);
		return y && m && d ? new CalendarDate(y, m, d) : undefined;
	}

	const rangeCalendarValue = $derived({
		start: parseUrlDate(urlCustomFrom),
		end: parseUrlDate(urlCustomTo)
	});

	const reportFrom = $derived(reportDateRange.start?.toString() ?? '');
	const reportTo = $derived(reportDateRange.end?.toString() ?? '');
	const reportValid = $derived(reportFrom !== '' && reportTo !== '');

	const refundValid = $derived(
		refundType === 'Full' ||
			(partialAmount !== '' &&
				!isNaN(Number(partialAmount)) &&
				Number(partialAmount) > 0 &&
				Number(partialAmount) <= (selectedRefund?.originalAmount ?? 0))
	);

	const timelineSteps = $derived.by(() => {
		if (!selectedRefund) return [];
		const s = selectedRefund.status;
		return [
			{
				label: 'Refund Requested',
				desc: 'Request received and logged',
				date: selectedRefund.requestedDate,
				done: true,
				failed: false
			},
			{
				label: 'Processing',
				desc: 'Verification and bank initiation',
				date: selectedRefund.requestedDate,
				done: s !== 'pending',
				failed: false
			},
			{
				label: 'Bank Initiated',
				desc: 'Transferred to beneficiary bank',
				date: selectedRefund.completedDate ?? '—',
				done: ['success', 'failed', 'rejected'].includes(s),
				failed: false
			},
			{
				label: s === 'failed' ? 'Failed' : s === 'rejected' ? 'Rejected' : 'Completed',
				desc:
					s === 'failed'
						? 'Bank returned the transfer'
						: s === 'rejected'
							? 'Refund rejected by policy'
							: 'Amount credited to customer',
				date: selectedRefund.completedDate ?? '—',
				done: !!selectedRefund.completedDate,
				failed: s === 'failed' || s === 'rejected'
			}
		];
	});

	// ── Debounced search ──────────────────────────────────────────────────────
	const searchActivity = debounce((val: string) => {
		if (val !== urlValue) updateParams({ value: val || null, skip: '0' });
	}, 350);

	$effect(() => {
		searchActivity(activitySearchInput);
	});

	// ── Navigation ────────────────────────────────────────────────────────────
	function backToLanding() {
		updateParams(
			{
				view: null,
				va: null,
				skip: null,
				filter: null,
				value: null,
				status: null,
				payment: null,
				dateRange: null,
				customFrom: null,
				customTo: null
			},
			false
		);
	}

	function resetActivity() {
		activitySearchInput = '';
		activityField = 'crn';
		updateParams({
			skip: '0',
			filter: 'crn',
			value: null,
			status: null,
			payment: null,
			dateRange: null,
			customFrom: null,
			customTo: null
		});
	}

	function resetReport() {
		reportDateRange = { start: undefined, end: undefined };
		reportStatuses = [];
		reportPayments = [];
		reportFormat = 'csv';
		reportEmail = '';
	}

	function handleActivitySearch(newField: string, newValue: string) {
		// Compare against urlFilter (not activityField) because bind:field propagates
		// the new field back to activityField synchronously before onSearch fires,
		// making newField === activityField always true for field-change events.
		if (newField !== urlFilter) {
			updateParams({ filter: newField, value: null, skip: '0' });
			activitySearchInput = '';
		} else {
			activitySearchInput = newValue;
		}
	}

	function openDetails(r: Refund) {
		selectedRefund = r;
		detailsOpen = true;
	}
	function openCreateRefund(r: Refund) {
		selectedRefund = r;
		refundType = 'Full';
		partialAmount = '';
		remarks = '';
		createRefundOpen = true;
	}

	async function copyToClipboard(text: string, field: string) {
		await navigator.clipboard.writeText(text).catch(() => {});
		copiedField = field;
		setTimeout(() => (copiedField = null), 1500);
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	const fmt = (n: number) =>
		'₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const statusVariant = (s: string): 'success' | 'error' | 'warning' | 'info' | 'disabled' =>
		(({
			success: 'success',
			failed: 'error',
			pending: 'warning',
			processing: 'info',
			rejected: 'disabled'
		})[s] as ReturnType<typeof statusVariant>) ?? 'disabled';

	const statusLabel = (s: string) =>
		({
			success: 'Success',
			failed: 'Failed',
			pending: 'Pending',
			processing: 'Processing',
			rejected: 'Rejected'
		})[s] ?? s;

	function toggleArr(arr: string[], val: string): string[] {
		return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
	}

	// ── Column factory ────────────────────────────────────────────────────────
	function getColumns(s: {
		sortHeader: Snippet<[{ label: string }]>;
		currencyCell: Snippet<[{ value: number }]>;
		statusCell: Snippet<[{ value: string }]>;
		paymentCell: Snippet<[{ value: string }]>;
		actionCell: Snippet<[{ row: Refund }]>;
	}): ColumnDef<Refund>[] {
		return [
			{ accessorKey: 'customerName', header: 'Payee Name', enableSorting: false },
			{
				accessorKey: 'originalAmount',
				header: 'Txn Amount',
				enableSorting: false,
				cell: (c) => renderSnippet(s.currencyCell, { value: c.getValue() as number })
			},
			{
				accessorKey: 'refundAmount',
				header: () => renderSnippet(s.sortHeader, { label: 'Refund Amount' }),
				enableSorting: true,
				cell: (c) => renderSnippet(s.currencyCell, { value: c.getValue() as number })
			},
			{ accessorKey: 'refundId', header: 'Refund ID', enableSorting: false },
			{ accessorKey: 'utr', header: 'UTR', enableSorting: false },
			{
				accessorKey: 'status',
				header: 'Status',
				enableSorting: false,
				cell: (c) => renderSnippet(s.statusCell, { value: c.getValue() as string })
			},
			{ accessorKey: 'crn', header: 'CRN', enableSorting: false },
			{
				accessorKey: 'requestedDate',
				header: () => renderSnippet(s.sortHeader, { label: 'Refund Date' }),
				enableSorting: true
			},
			{
				accessorKey: 'paymentMethod',
				header: 'Payment Method',
				enableSorting: false,
				cell: (c) => renderSnippet(s.paymentCell, { value: c.getValue() as string })
			},
			{
				id: 'actions',
				header: '',
				enableSorting: false,
				cell: (c) => renderSnippet(s.actionCell, { row: c.row.original })
			}
		];
	}

	// ── Dropdown / search options ─────────────────────────────────────────────
	const refundStatusOptions: DropdownOption[] = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'processing', label: 'Processing' },
		{ value: 'success', label: 'Success' },
		{ value: 'failed', label: 'Failed' },
		{ value: 'rejected', label: 'Rejected' }
	];
	const paymentMethodOptions: DropdownOption[] = [
		{ value: 'UPI', label: 'UPI' },
		{ value: 'Net Banking', label: 'Net Banking' },
		{ value: 'Card', label: 'Card' }
	];
	const searchFieldOptions: SearchFieldOption[] = [
		{ value: 'crn', label: 'CRN', placeholder: 'Enter CRN...' },
		{ value: 'utr', label: 'UTR', placeholder: 'Enter UTR...' },
		{ value: 'customerName', label: 'Payee Name', placeholder: 'Enter Payee Name...' },
		{ value: 'refundId', label: 'Refund ID', placeholder: 'Enter Refund ID...' }
	];

	// ── Active filter chips ───────────────────────────────────────────────────
	function formatDisplayDate(s: string): string {
		if (!s) return '';
		const [, m, d] = s.split('-').map(Number);
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];
		return `${String(d).padStart(2, '0')} ${months[m - 1]}`;
	}

	function formatDateChipValue(from: string, to: string): string {
		if (from && to) return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
		if (from) return `From ${formatDisplayDate(from)}`;
		return `To ${formatDisplayDate(to)}`;
	}

	const activeFilters = $derived([
		...(urlCustomFrom || urlCustomTo
			? [{ key: 'date', label: 'Date', value: formatDateChipValue(urlCustomFrom, urlCustomTo) }]
			: []),
		...(urlPayment
			? [
					{
						key: 'payment',
						label: 'Payment Method',
						value: paymentMethodOptions.find((o) => o.value === urlPayment)?.label ?? urlPayment
					}
				]
			: []),
		...(urlStatus ? [{ key: 'status', label: 'Status', value: statusLabel(urlStatus) }] : [])
	]);

	const hasActiveFilters = $derived(activeFilters.length > 0);

	function removeFilter(key: string) {
		if (key === 'date') {
			updateParams({ customFrom: null, customTo: null, skip: '0' });
		} else if (key === 'payment') {
			updateParams({ payment: null, skip: '0' });
		} else if (key === 'status') {
			updateParams({ status: null, skip: '0' });
		}
	}
</script>

<!-- ── Activity View ─────────────────────────────────────────────────────── -->
<div class="flex flex-col gap-4">
	<!-- Header + breadcrumb -->
	<div class="shrink-0">
		<!-- <h1 class="text-2xl font-semibold tracking-tight text-foreground">{vaDisplayName}</h1> -->
		<Breadcrumb
			items={[
				{ label: 'All Merchants', onClick: backToLanding },
				{ label: 'Transaction Activity' }
			]}
			class="mt-1.5"
		/>
		<p class="mt-4 text-sm text-muted-foreground">
			Showing refunds for
			<span class="font-medium text-foreground">{selectedVA?.bankName}</span>
			<span class="mx-1.5 text-muted-foreground/40">·</span>
			<span class="font-mono text-xs">{selectedVA?.accountNumber}</span>
		</p>
	</div>

	<!-- Filter toolbar -->
	<div class="flex shrink-0 flex-wrap items-center gap-2.5">
		<Dropdown
			value={urlPayment || undefined}
			options={paymentMethodOptions}
			placeholder="Payment Method"
			size="sm"
			bordered
			class="w-40"
			onValueChange={(v) => updateParams({ payment: v, skip: '0' })}
		/>
		<Dropdown
			value={urlStatus || undefined}
			options={refundStatusOptions}
			placeholder="Status"
			size="sm"
			bordered
			class="w-28"
			onValueChange={(v) => updateParams({ status: v, skip: '0' })}
		/>

		<!-- Date Range -->
		<RangeCalendar
			value={rangeCalendarValue}
			onApply={(range) =>
				updateParams({
					customFrom: range.start?.toString() ?? null,
					customTo: range.end?.toString() ?? null,
					skip: '0'
				})}
		/>

		<div class="flex-1"></div>

		<SearchField
			fields={searchFieldOptions}
			bind:field={activityField}
			bind:value={activitySearchInput}
			onSearch={handleActivitySearch}
			class="min-w-72"
		/>

		<button
			onclick={() => {
				resetReport();
				reportDrawerOpen = true;
			}}
			class="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
		>
			<Download class="h-4 w-4" /> Generate Report
		</button>
	</div>

	<!-- Active filter chips -->
	{#if hasActiveFilters}
		<div class="flex shrink-0 flex-wrap items-center gap-2">
			{#each activeFilters as filter (filter.key)}
				<Chip variant="outline" class="h-auto gap-0 py-1 pl-3 pr-2">
					<span class="text-xs text-muted-foreground">{filter.label}:&nbsp;</span>
					<span class="text-xs font-medium text-foreground">{filter.value}</span>
					<button
						type="button"
						onclick={() => removeFilter(filter.key)}
						class="ml-1.5 cursor-pointer rounded-sm text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none"
						aria-label="Remove {filter.label} filter"
					>
						<X class="size-3" />
					</button>
				</Chip>
			{/each}
			<button
				type="button"
				onclick={resetActivity}
				class="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
			>
				Clear All
			</button>
		</div>
	{/if}

	<!-- Cell snippets -->
	{#snippet sortHeader({ label }: { label: string })}
		<span class="flex items-center gap-1.5"
			>{label}<ArrowUpDown class="h-3 w-3 shrink-0 opacity-40" /></span
		>
	{/snippet}

	{#snippet currencyCell({ value }: { value: number })}
		<span class="font-semibold text-foreground">{fmt(value)}</span>
	{/snippet}

	{#snippet statusCell({ value }: { value: string })}
		<Chip variant={statusVariant(value)}>{statusLabel(value)}</Chip>
	{/snippet}

	{#snippet paymentCell({ value }: { value: string })}
		<div class="flex items-center gap-1.5 text-sm text-foreground">
			{#if value === 'UPI'}<PhoneIcon class="h-4 w-4 shrink-0 text-muted-foreground" />
			{:else if value === 'Net Banking'}<Landmark class="h-4 w-4 shrink-0 text-muted-foreground" />
			{:else if value === 'Card'}<CreditCard class="h-4 w-4 shrink-0 text-muted-foreground" />
			{/if}
			{value}
		</div>
	{/snippet}

	{#snippet actionCell({ row }: { row: Refund })}
		<button
			onclick={(e) => {
				e.stopPropagation();
				openDetails(row);
			}}
			class="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
		>
			<Eye class="h-3.5 w-3.5" /> View
		</button>
	{/snippet}

	<!-- Table -->
	{#if pagedRefunds.length === 0 && filteredRefunds.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card py-20 text-center shadow-sm"
		>
			<p class="text-sm font-medium text-muted-foreground">No refunds found</p>
			<p class="text-xs text-muted-foreground/60">Try adjusting your filters or search query</p>
			<button
				onclick={resetActivity}
				class="mt-1 flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
			>
				<RotateCcw class="h-3.5 w-3.5" /> Reset filters
			</button>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
			<div class="overflow-x-auto">
				<Table
					data={pagedRefunds}
					columns={getColumns({ sortHeader, currencyCell, statusCell, paymentCell, actionCell })}
					onRowClick={openDetails}
					pageNumber={pagination.currentPage}
					setPageNumber={pagination.setPage}
					totalPages={pagination.pageCount}
				/>
			</div>
		</div>
	{/if}
</div>

<!-- ── Refund Details Drawer ─────────────────────────────────────────────── -->
{#if detailsOpen && selectedRefund}
	<div class="fixed inset-0 z-50">
		<div
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			onclick={() => (detailsOpen = false)}
			role="presentation"
		></div>
		<div class="absolute inset-y-0 right-0 flex w-full max-w-120 flex-col bg-background shadow-2xl">
			<div class="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-4">
				<div>
					<p class="text-sm font-semibold text-foreground">Refund Details</p>
					<p class="text-xs text-muted-foreground">{selectedRefund.refundId}</p>
				</div>
				<button
					onclick={() => (detailsOpen = false)}
					class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					><X class="h-4 w-4" /></button
				>
			</div>

			<div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
				<div class="rounded-xl border border-border/50 bg-card p-4">
					<div class="flex items-start justify-between">
						<div>
							<p class="text-2xl font-bold tracking-tight text-foreground">
								{fmt(selectedRefund.refundAmount)}
							</p>
							<p class="mt-1 text-sm text-muted-foreground">{selectedRefund.customerName}</p>
						</div>
						<Chip variant={statusVariant(selectedRefund.status)} class="mt-1"
							>{statusLabel(selectedRefund.status)}</Chip
						>
					</div>
					<div class="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
						<span
							class={cn(
								'inline-flex rounded-full px-2 py-0.5 font-medium',
								selectedRefund.refundType === 'Full'
									? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
									: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400'
							)}>{selectedRefund.refundType} Refund</span
						>
						<span>·</span><span>{selectedRefund.requestedDate}</span>
					</div>
				</div>

				<div class="rounded-xl border border-border/50 bg-card p-4">
					<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						Merchant Details
					</p>
					<div class="space-y-2.5">
						<div class="flex items-center justify-between">
							<span class="text-xs text-muted-foreground">Name</span><span
								class="text-xs font-medium text-foreground"
								>{merchants.find((m) => m.id === selectedRefund?.merchantId)?.name ?? '—'}</span
							>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-xs text-muted-foreground">Bank</span><span
								class="text-xs font-medium text-foreground">{selectedRefund.bank}</span
							>
						</div>
					</div>
				</div>

				<div class="rounded-xl border border-border/50 bg-card p-4">
					<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						Original Transaction
					</p>
					<div class="space-y-2.5">
						{#each [{ label: 'Transaction ID', value: selectedRefund.transactionId, copy: true }, { label: 'CRN', value: selectedRefund.crn, copy: true }, { label: 'UTR', value: selectedRefund.utr, copy: true }, { label: 'Payment Method', value: selectedRefund.paymentMethod, copy: false }, { label: 'Original Amount', value: fmt(selectedRefund.originalAmount), copy: false }] as field (field.label)}
							<div class="flex items-center justify-between gap-2">
								<span class="shrink-0 text-xs text-muted-foreground">{field.label}</span>
								<div class="flex items-center gap-1">
									<span class="truncate font-mono text-xs text-foreground">{field.value}</span>
									{#if field.copy}
										<button
											onclick={() => copyToClipboard(field.value, field.label)}
											class="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-muted-foreground"
										>
											{#if copiedField === field.label}<Check
													class="h-3 w-3 text-green-500"
												/>{:else}<Copy class="h-3 w-3" />{/if}
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="rounded-xl border border-border/50 bg-card p-4">
					<p class="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						Refund Timeline
					</p>
					{#each timelineSteps as step, i (step.label)}
						<div class="flex gap-3 pb-4 last:pb-0">
							<div class="flex flex-col items-center">
								<div
									class={cn(
										'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
										step.done && !step.failed
											? 'border-green-500 bg-green-500 text-white'
											: step.done && step.failed
												? 'border-red-500 bg-red-500 text-white'
												: 'border-border bg-background text-muted-foreground'
									)}
								>
									{#if step.done && !step.failed}<Check class="h-3.5 w-3.5" />
									{:else if step.done && step.failed}<X class="h-3.5 w-3.5" />
									{:else}<div class="h-2 w-2 rounded-full bg-border"></div>{/if}
								</div>
								{#if i < timelineSteps.length - 1}
									<div
										class={cn('mt-1 w-0.5 flex-1', step.done ? 'bg-green-500/30' : 'bg-border/50')}
										style="min-height:16px"
									></div>
								{/if}
							</div>
							<div class="min-w-0 flex-1 pb-1">
								<p
									class={cn(
										'text-sm font-medium',
										step.done ? 'text-foreground' : 'text-muted-foreground/60'
									)}
								>
									{step.label}
								</p>
								<p class="mt-0.5 text-xs text-muted-foreground/70">{step.desc}</p>
								<p class="mt-0.5 text-[11px] text-muted-foreground/50">{step.date}</p>
							</div>
						</div>
					{/each}
				</div>

				<div class="rounded-xl border border-border/50 bg-card p-4">
					<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						Remarks
					</p>
					<p class="text-sm leading-relaxed text-foreground/80">{selectedRefund.remarks}</p>
				</div>
			</div>

			<div class="flex shrink-0 items-center justify-end gap-2 border-t border-border/50 px-5 py-4">
				{#if selectedRefund.status === 'failed'}
					<button
						onclick={() => {
							detailsOpen = false;
							openCreateRefund(selectedRefund!);
						}}
						class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
					>
						<RotateCcw class="h-4 w-4" /> Retry Refund
					</button>
				{/if}
				{#if selectedRefund.status === 'success'}
					<button
						class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
					>
						<Download class="h-4 w-4" /> Download Receipt
					</button>
				{/if}
				<button
					onclick={() => (detailsOpen = false)}
					class="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Initiate / Retry Refund Drawer ─────────────────────────────────────── -->
{#if createRefundOpen && selectedRefund}
	<div class="fixed inset-0 z-50">
		<div
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			onclick={() => (createRefundOpen = false)}
			role="presentation"
		></div>
		<div class="absolute inset-y-0 right-0 flex w-full max-w-110 flex-col bg-background shadow-2xl">
			<div class="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-4">
				<div>
					<p class="text-sm font-semibold text-foreground">Initiate Refund</p>
					<p class="text-xs text-muted-foreground">Review transaction before proceeding</p>
				</div>
				<button
					onclick={() => (createRefundOpen = false)}
					class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					><X class="h-4 w-4" /></button
				>
			</div>
			<div class="flex-1 space-y-5 overflow-y-auto px-5 py-4">
				<div class="space-y-2.5 rounded-xl border border-border/50 bg-muted/20 p-4">
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						Transaction Summary
					</p>
					{#each [{ label: 'Merchant', value: merchants.find((m) => m.id === selectedRefund?.merchantId)?.name ?? '—' }, { label: 'Customer', value: selectedRefund.customerName }, { label: 'Transaction ID', value: selectedRefund.transactionId }, { label: 'CRN', value: selectedRefund.crn }, { label: 'UTR', value: selectedRefund.utr }, { label: 'Payment Method', value: selectedRefund.paymentMethod }, { label: 'Original Amount', value: fmt(selectedRefund.originalAmount) }, { label: 'Refundable Amount', value: fmt(selectedRefund.originalAmount) }] as f (f.label)}
						<div class="flex items-center justify-between gap-2 text-xs">
							<span class="shrink-0 text-muted-foreground">{f.label}</span><span
								class="truncate text-right font-medium text-foreground">{f.value}</span
							>
						</div>
					{/each}
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Refund Type</p>
					<div class="flex gap-3">
						{#each ['Full', 'Partial'] as t (t)}
							<label
								class={cn(
									'flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm transition-all',
									refundType === t
										? 'border-primary bg-primary/5 text-primary'
										: 'border-border/60 text-muted-foreground hover:border-border'
								)}
							>
								<input
									type="radio"
									name="refundType"
									value={t}
									bind:group={refundType}
									class="sr-only"
								/>
								<div
									class={cn(
										'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
										refundType === t ? 'border-primary' : 'border-border'
									)}
								>
									{#if refundType === t}<div class="h-2 w-2 rounded-full bg-primary"></div>{/if}
								</div>
								{t} Refund
							</label>
						{/each}
					</div>
				</div>
				{#if refundType === 'Partial'}
					<div class="space-y-1.5">
						<label class="text-sm font-medium text-foreground" for="partialAmt">Refund Amount</label
						>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
								>₹</span
							><input
								id="partialAmt"
								type="number"
								bind:value={partialAmount}
								placeholder="0.00"
								min="1"
								max={selectedRefund.originalAmount}
								class="h-9 w-full rounded-lg border border-border/60 bg-background pl-7 pr-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
							/>
						</div>
						<div class="flex items-center justify-between text-xs text-muted-foreground/70">
							<span>Maximum: {fmt(selectedRefund.originalAmount)}</span
							>{#if partialAmount && !isNaN(Number(partialAmount))}<span
									>Remaining: {fmt(selectedRefund.originalAmount - Number(partialAmount))}</span
								>{/if}
						</div>
						{#if partialAmount && (isNaN(Number(partialAmount)) || Number(partialAmount) <= 0 || Number(partialAmount) > selectedRefund.originalAmount)}
							<div
								class="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-500/10"
							>
								<AlertCircle class="h-3.5 w-3.5 text-red-500" />
								<p class="text-xs text-red-600 dark:text-red-400">
									{Number(partialAmount) <= 0
										? 'Amount must be greater than 0.'
										: Number(partialAmount) > selectedRefund.originalAmount
											? 'Amount exceeds the refundable limit.'
											: 'Please enter a valid amount.'}
								</p>
							</div>
						{/if}
					</div>
				{/if}
				<div class="space-y-1.5">
					<label class="text-sm font-medium text-foreground" for="refundRemarks"
						>Remarks <span class="font-normal text-muted-foreground/60">(optional)</span></label
					>
					<textarea
						id="refundRemarks"
						bind:value={remarks}
						maxlength={maxRemarks}
						rows={3}
						placeholder="Add a note about this refund…"
						class="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
					></textarea>
					<p class="text-right text-xs text-muted-foreground/60">{remarks.length}/{maxRemarks}</p>
				</div>
				<div
					class="flex items-start gap-2.5 rounded-lg border border-blue-200/60 bg-blue-50/50 px-3 py-2.5 dark:border-blue-500/20 dark:bg-blue-500/5"
				>
					<Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
					<p class="text-xs leading-relaxed text-blue-700 dark:text-blue-400">
						Once initiated, the refund will be processed within 5–7 business days depending on the
						bank.
					</p>
				</div>
			</div>
			<div class="flex shrink-0 items-center justify-end gap-2 border-t border-border/50 px-5 py-4">
				<button
					onclick={() => (createRefundOpen = false)}
					class="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>Cancel</button
				>
				<button
					disabled={!refundValid}
					onclick={() => (createRefundOpen = false)}
					class={cn(
						'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
						refundValid
							? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
							: 'cursor-not-allowed bg-muted text-muted-foreground'
					)}
				>
					<RotateCcw class="h-4 w-4" /> Initiate Refund
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Generate Report Drawer ─────────────────────────────────────────────── -->
{#if reportDrawerOpen}
	<div class="fixed inset-0 z-50">
		<div
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			onclick={() => (reportDrawerOpen = false)}
			role="presentation"
		></div>
		<div class="absolute inset-y-0 right-0 flex w-full max-w-110 flex-col bg-background shadow-2xl">
			<div class="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-4">
				<div>
					<p class="text-sm font-semibold text-foreground">Generate Report</p>
					<p class="text-xs text-muted-foreground">Export refund data with filters</p>
				</div>
				<button
					onclick={() => (reportDrawerOpen = false)}
					class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					><X class="h-4 w-4" /></button
				>
			</div>
			<div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<p class="text-sm font-medium text-foreground">
							Date Range <span class="text-red-500">*</span>
						</p>
						{#if !reportFrom || !reportTo}<span class="text-xs text-muted-foreground/60"
								>Required</span
							>{/if}
					</div>
					<Calendar bind:value={reportDateRange} placeholder="Select date range" />
				</div>
				<div class="space-y-3">
					<p class="text-sm font-medium text-foreground">
						Status <span class="text-xs font-normal text-muted-foreground">(optional)</span>
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each [{ value: 'success', label: 'Success' }, { value: 'failed', label: 'Failed' }, { value: 'processing', label: 'In Progress' }, { value: 'pending', label: 'Pending' }, { value: 'rejected', label: 'Rejected' }] as opt (opt.value)}
							<label class="flex cursor-pointer items-center gap-2.5">
								<div
									role="checkbox"
									aria-checked={reportStatuses.includes(opt.value)}
									tabindex="0"
									onclick={() => (reportStatuses = toggleArr(reportStatuses, opt.value))}
									onkeydown={(e) => {
										if (e.key === ' ' || e.key === 'Enter') {
											e.preventDefault();
											reportStatuses = toggleArr(reportStatuses, opt.value);
										}
									}}
									class={cn(
										'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
										reportStatuses.includes(opt.value)
											? 'border-primary bg-primary'
											: 'border-border hover:border-primary/50'
									)}
								>
									{#if reportStatuses.includes(opt.value)}<Check
											class="h-2.5 w-2.5 text-primary-foreground"
										/>{/if}
								</div>
								<span class="text-sm text-foreground">{opt.label}</span>
							</label>
						{/each}
					</div>
				</div>
				<div class="space-y-3">
					<p class="text-sm font-medium text-foreground">
						Payment Method <span class="text-xs font-normal text-muted-foreground">(optional)</span>
					</p>
					<div class="flex flex-wrap gap-x-6 gap-y-2">
						{#each [{ value: 'UPI', label: 'UPI' }, { value: 'Net Banking', label: 'Net Banking' }, { value: 'Card', label: 'Card' }] as opt (opt.value)}
							<label class="flex cursor-pointer items-center gap-2.5">
								<div
									role="checkbox"
									aria-checked={reportPayments.includes(opt.value)}
									tabindex="0"
									onclick={() => (reportPayments = toggleArr(reportPayments, opt.value))}
									onkeydown={(e) => {
										if (e.key === ' ' || e.key === 'Enter') {
											e.preventDefault();
											reportPayments = toggleArr(reportPayments, opt.value);
										}
									}}
									class={cn(
										'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
										reportPayments.includes(opt.value)
											? 'border-primary bg-primary'
											: 'border-border hover:border-primary/50'
									)}
								>
									{#if reportPayments.includes(opt.value)}<Check
											class="h-2.5 w-2.5 text-primary-foreground"
										/>{/if}
								</div>
								<span class="text-sm text-foreground">{opt.label}</span>
							</label>
						{/each}
					</div>
				</div>
				<div class="space-y-3">
					<p class="text-sm font-medium text-foreground">Format</p>
					<div class="flex gap-3">
						{#each [{ value: 'csv', label: 'CSV' }, { value: 'xlsx', label: 'XLSX' }] as fopt (fopt.value)}
							<label
								class={cn(
									'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all',
									reportFormat === fopt.value
										? 'border-primary bg-primary/5 text-primary'
										: 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
								)}
							>
								<input
									type="radio"
									name="reportFormat"
									value={fopt.value}
									bind:group={reportFormat}
									class="sr-only"
								/>
								{fopt.label}
								{#if reportFormat === fopt.value}<Check class="h-3.5 w-3.5" />{/if}
							</label>
						{/each}
					</div>
				</div>
				<div class="space-y-1.5">
					<label class="text-sm font-medium text-foreground" for="report-email"
						>Email <span class="font-normal text-muted-foreground/60"
							>(optional — comma-separated)</span
						></label
					>
					<input
						id="report-email"
						type="text"
						bind:value={reportEmail}
						placeholder="e.g. finance@acme.com, cfo@acme.com"
						class="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
					/>
					<p class="text-xs text-muted-foreground/60">
						Leave blank to download directly without emailing.
					</p>
				</div>
			</div>
			<div class="flex shrink-0 items-center justify-end gap-2 border-t border-border/50 px-5 py-4">
				<button
					onclick={() => (reportDrawerOpen = false)}
					class="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>Cancel</button
				>
				<button
					disabled={!reportValid}
					onclick={() => {
						if (reportValid) reportDrawerOpen = false;
					}}
					class={cn(
						'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all',
						reportValid
							? 'hover:bg-primary/90 active:scale-[0.98]'
							: 'cursor-not-allowed opacity-50'
					)}
				>
					<Download class="h-4 w-4" /> Generate Report
				</button>
			</div>
		</div>
	</div>
{/if}
