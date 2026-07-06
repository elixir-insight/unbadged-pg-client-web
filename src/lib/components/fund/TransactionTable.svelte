<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { DateRange } from 'bits-ui';
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURL } from 'svelte/reactivity';
	import { CalendarDate } from '@internationalized/date';
	import type { ColumnDef } from '@tanstack/table-core';

	import {
		Chip,
		Button,
		Breadcrumb,
		Input,
		Drawer,
		Modal,
		SearchField,
		RangeCalendar,
		Dropdown,
		Table,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { SearchFieldOption } from '$lib/components/reusable';
	import { renderSnippet } from '$lib/components/ui/data-table';

	import {
		RefreshCw,
		Download,
		AlertCircle,
		X,
		Eye,
		Copy,
		Check,
		CheckCircle2,
		Loader2
	} from '$lib/assets/icons';

	import type { Transaction } from '$lib/types/funds';

	let {
		transactions,
		total
	}: {
		transactions: Transaction[];
		total: number;
	} = $props();

	// ── URL navigation ────────────────────────────────────────────────────
	function navigate(updates: Record<string, string | null>, replace = true) {
		const url = new SvelteURL(page.url.toString());
		for (const [k, v] of Object.entries(updates)) {
			if (v === null || v === '') url.searchParams.delete(k);
			else url.searchParams.set(k, v);
		}
		const href =
			`${page.url.pathname}?${url.searchParams.toString()}` as `${typeof page.url.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: replace, noScroll: true, keepFocus: true });
	}

	// ── Pagination ────────────────────────────────────────────────────────
	const pagination = createUrlPagination({ total: () => total });

	// ── Filter options ────────────────────────────────────────────────────
	const statusOptions = [
		{ value: '', label: 'All Status' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'failed', label: 'Failed' },
		{ value: 'reversed', label: 'Reversed' }
	];

	const searchFields: SearchFieldOption[] = [
		{ value: 'crn', label: 'CRN', placeholder: 'Search by CRN…' },
		{ value: 'utr', label: 'UTR', placeholder: 'Search by UTR…' },
		{ value: 'txnId', label: 'Txn ID', placeholder: 'Search by Txn ID…' }
	];

	// ── Derived URL params ────────────────────────────────────────────────
	const selectedStatus = $derived(page.url.searchParams.get('status') ?? '');
	const searchField = $derived(page.url.searchParams.get('field') ?? 'crn');
	const searchValue = $derived(page.url.searchParams.get('search') ?? '');
	const fromDate = $derived(page.url.searchParams.get('fromDate') ?? '');
	const toDate = $derived(page.url.searchParams.get('toDate') ?? '');
	const hasFilters = $derived(!!selectedStatus || !!fromDate || !!toDate || !!searchValue);

	const dateRangeValue = $derived.by<DateRange>(() => {
		function parseCalDate(s: string) {
			if (!s) return undefined;
			const [y, m, d] = s.split('-').map(Number);
			return new CalendarDate(y, m, d);
		}
		return { start: parseCalDate(fromDate), end: parseCalDate(toDate) };
	});

	function applyDateRange(range: DateRange) {
		function fmt(d: DateRange['start']) {
			if (!d) return null;
			return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
		}
		navigate({ fromDate: fmt(range.start), toDate: fmt(range.end), skip: null });
	}

	function clearFilters() {
		navigate({ status: null, fromDate: null, toDate: null, search: null, field: null, skip: null });
	}

	// ── Refresh ───────────────────────────────────────────────────────────
	let refreshing = $state(false);
	async function handleRefresh() {
		refreshing = true;
		await invalidateAll();
		refreshing = false;
	}

	// ── Transaction drawer ────────────────────────────────────────────────
	let drawerOpen = $state(false);
	let selectedTxn = $state<Transaction | null>(null);

	function openDrawer(txn: Transaction) {
		selectedTxn = txn;
		drawerOpen = true;
	}

	// ── Export modal ──────────────────────────────────────────────────────
	let exportOpen = $state(false);
	let exportFormat = $state<'csv' | 'excel'>('csv');
	let exportLoading = $state(false);
	let exportDone = $state(false);
	let exportFrom = $state('');
	let exportTo = $state('');

	async function generateReport() {
		if (!exportFrom || !exportTo || exportFrom > exportTo) return;
		exportLoading = true;
		await new Promise((r) => setTimeout(r, 1200));
		exportLoading = false;
		exportDone = true;
	}

	function closeExportModal() {
		exportOpen = false;
		exportDone = false;
		exportFrom = '';
		exportTo = '';
		exportFormat = 'csv';
	}

	// ── Copy ──────────────────────────────────────────────────────────────
	let copiedKey = $state<string | null>(null);
	async function copyToClipboard(value: string, key: string) {
		try {
			await navigator.clipboard.writeText(value);
			copiedKey = key;
			setTimeout(() => (copiedKey = null), 2000);
		} catch {
			/* silent */
		}
	}

	// ── Formatters ────────────────────────────────────────────────────────
	function formatCurrency(n: number) {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 2
		}).format(n / 100);
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-IN', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function statusVariant(s: Transaction['status']): 'success' | 'error' | 'warning' {
		if (s === 'Completed') return 'success';
		if (s === 'Failed') return 'error';
		return 'warning';
	}

	onMount(() => {
		document.querySelector('.app-shell-content')?.scrollTo({ top: 0, behavior: 'instant' });
	});

	// ── Active filter chips ───────────────────────────────────────────────
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

	const activeFilterChips = $derived([
		...(fromDate || toDate
			? [{ key: 'date', label: 'Date', value: formatDateChipValue(fromDate, toDate) }]
			: []),
		...(selectedStatus
			? [
					{
						key: 'status',
						label: 'Status',
						value: selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)
					}
				]
			: [])
	]);

	const hasActiveChips = $derived(activeFilterChips.length > 0);

	function removeFilterChip(key: string) {
		if (key === 'date') navigate({ fromDate: null, toDate: null, skip: null });
		else if (key === 'status') navigate({ status: null, skip: null });
	}

	// ── Column definitions ────────────────────────────────────────────────
	function getColumns(s: {
		currencyCell: Snippet<[{ value: number }]>;
		utrCell: Snippet<[{ value: string | null }]>;
		statusCell: Snippet<[{ value: Transaction['status'] }]>;
		dateTimeCell: Snippet<[{ value: string }]>;
		actionCell: Snippet<[{ row: Transaction }]>;
	}): ColumnDef<Transaction>[] {
		return [
			{ accessorKey: 'txnId', header: 'Txn ID', enableSorting: false },
			{
				accessorKey: 'openingBalance',
				header: 'Opening Bal.',
				enableSorting: false,
				cell: (c) => renderSnippet(s.currencyCell, { value: c.getValue() as number })
			},
			{
				accessorKey: 'closingBalance',
				header: 'Closing Bal.',
				enableSorting: false,
				cell: (c) => renderSnippet(s.currencyCell, { value: c.getValue() as number })
			},
			{
				accessorKey: 'utr',
				header: 'UTR',
				enableSorting: false,
				cell: (c) => renderSnippet(s.utrCell, { value: c.getValue() as string | null })
			},
			{ accessorKey: 'crn', header: 'CRN', enableSorting: false },
			{ accessorKey: 'sourceAccount', header: 'Source', enableSorting: false },
			{ accessorKey: 'accountNumber', header: 'Account No.', enableSorting: false },
			{
				accessorKey: 'amount',
				header: 'Amount',
				enableSorting: false,
				cell: (c) => renderSnippet(s.currencyCell, { value: c.getValue() as number })
			},
			{
				accessorKey: 'status',
				header: 'Status',
				enableSorting: false,
				cell: (c) => renderSnippet(s.statusCell, { value: c.getValue() as Transaction['status'] })
			},
			{
				accessorKey: 'dateTime',
				header: 'Date & Time',
				enableSorting: false,
				cell: (c) => renderSnippet(s.dateTimeCell, { value: c.getValue() as string })
			},
			{
				id: 'actions',
				header: '',
				enableSorting: false,
				cell: (c) => renderSnippet(s.actionCell, { row: c.row.original })
			}
		];
	}
</script>

<!-- ════════════════════════════════════════════════════════════════════ -->
<!--  Transaction Explorer                                                -->
<!-- ════════════════════════════════════════════════════════════════════ -->
<div class="min-h-full space-y-6 p-6 lg:p-8">
	<!-- ── Explorer header ───────────────────────────────────────────────── -->
	<div class="space-y-4">
		<Breadcrumb
			items={[
				{ label: 'Funds', href: '/merchant/funds' },
				{ label: 'Inward Fund Transactions', href: '/merchant/funds' }
			]}
			class="block"
		/>

		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="text-xl font-semibold tracking-tight">Inward Fund Transactions</h1>
				<p class="mt-0.5 text-sm text-muted-foreground">
					<span class="font-medium text-foreground">{total.toLocaleString()}</span>
					{total === 1 ? 'transaction' : 'transactions'}
					{hasFilters ? 'matched' : 'total'}
				</p>
			</div>

			<div class="flex shrink-0 items-center gap-2">
				<button
					type="button"
					onclick={handleRefresh}
					aria-label="Refresh transactions"
					class="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				>
					<RefreshCw class={['size-3.5', refreshing && 'animate-spin'].filter(Boolean).join(' ')} />
				</button>
				<Button variant="outline" size="sm" onclick={() => (exportOpen = true)} class="rounded-xl">
					<Download class="mr-1.5 size-3.5" />
					Export
				</Button>
			</div>
		</div>
	</div>

	<!-- Gradient accent line -->
	<div class="h-px bg-linear-to-r from-primary/40 via-primary/10 to-transparent"></div>

	<!-- ── Filter toolbar ────────────────────────────────────────────────── -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-3">
			<Dropdown
				value={selectedStatus}
				options={statusOptions}
				onValueChange={(v) => navigate({ status: v || null, skip: null })}
				placeholder="All Status"
				size="sm"
				bordered
				class="w-32 shrink-0"
			/>

			<RangeCalendar value={dateRangeValue} onApply={applyDateRange} />
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<SearchField
				fields={searchFields}
				field={searchField}
				value={searchValue}
				class="min-w-48 flex-1"
				onSearch={(f, v) =>
					navigate({ field: f !== 'crn' ? f : null, search: v || null, skip: null })}
			/>
			{#if hasFilters}
				<button
					type="button"
					onclick={clearFilters}
					class="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none"
				>
					<X class="size-3 shrink-0" />
					Clear filters
				</button>
			{/if}
		</div>
	</div>

	<!-- ── Active filter chips ───────────────────────────────────────────── -->
	{#if hasActiveChips}
		<div class="flex flex-wrap items-center gap-2">
			{#each activeFilterChips as chip (chip.key)}
				<Chip variant="outline" class="h-auto gap-0 py-1 pl-3 pr-2">
					<span class="text-xs text-muted-foreground">{chip.label}:&nbsp;</span>
					<span class="text-xs font-medium text-foreground">{chip.value}</span>
					<button
						type="button"
						onclick={() => removeFilterChip(chip.key)}
						class="ml-1.5 cursor-pointer rounded-sm text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none"
						aria-label="Remove {chip.label} filter"
					>
						<X class="size-3" />
					</button>
				</Chip>
			{/each}
			<button
				type="button"
				onclick={clearFilters}
				class="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
			>
				Clear All
			</button>
		</div>
	{/if}

	<!-- ── Cell snippets ─────────────────────────────────────────────────── -->
	{#snippet currencyCell({ value }: { value: number })}
		<span class="tabular-nums text-xs">{formatCurrency(value)}</span>
	{/snippet}

	{#snippet utrCell({ value }: { value: string | null })}
		{#if value}
			<span class="font-mono text-xs">{value}</span>
		{:else}
			<span class="text-xs text-muted-foreground/40">—</span>
		{/if}
	{/snippet}

	{#snippet statusCell({ value }: { value: Transaction['status'] })}
		<Chip variant={statusVariant(value)}>{value}</Chip>
	{/snippet}

	{#snippet dateTimeCell({ value }: { value: string })}
		<div class="whitespace-nowrap">
			<p class="text-xs">{formatDate(value)}</p>
			<p class="mt-0.5 text-xs text-muted-foreground">{formatTime(value)}</p>
		</div>
	{/snippet}

	{#snippet actionCell({ row }: { row: Transaction })}
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				openDrawer(row);
			}}
			aria-label="View transaction {row.txnId}"
			class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
		>
			<Eye class="size-3.5" />
			View
		</button>
	{/snippet}

	<!-- ── Table card ─────────────────────────────────────────────────────── -->
	<div class="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
		<div class="overflow-x-auto">
			<Table
				data={transactions}
				columns={getColumns({ currencyCell, utrCell, statusCell, dateTimeCell, actionCell })}
				onRowClick={openDrawer}
				pageNumber={pagination.currentPage}
				setPageNumber={pagination.setPage}
				totalPages={pagination.pageCount}
			/>
		</div>
	</div>
</div>

<!-- ════════════════════════════════════════════════════════════════════ -->
<!--  Transaction Detail Drawer                                           -->
<!-- ════════════════════════════════════════════════════════════════════ -->
<Drawer bind:open={drawerOpen} direction="right" title="Transaction Details">
	{#if selectedTxn}
		<div class="space-y-5 py-2">
			<!-- Hero: Amount + Status -->
			<div class="flex items-start justify-between rounded-2xl bg-muted/40 px-5 py-5">
				<div>
					<p class="text-xs text-muted-foreground">Amount</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(selectedTxn.amount)}</p>
				</div>
				<Chip variant={statusVariant(selectedTxn.status)} class="mt-1">{selectedTxn.status}</Chip>
			</div>

			<!-- Transaction section -->
			<div>
				<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
					Transaction
				</p>
				<dl class="divide-y divide-border/50">
					{#each [{ label: 'Txn ID', value: selectedTxn.txnId, copy: true }, { label: 'CRN', value: selectedTxn.crn, copy: true }, { label: 'UTR', value: selectedTxn.utr ?? '—', copy: !!selectedTxn.utr }, { label: 'Date', value: formatDate(selectedTxn.dateTime), copy: false }, { label: 'Time', value: formatTime(selectedTxn.dateTime), copy: false }] as row (row.label)}
						<div class="flex items-center justify-between gap-4 py-2.5">
							<dt class="text-xs text-muted-foreground">{row.label}</dt>
							<dd class="flex items-center gap-1.5">
								<span class="text-right font-mono text-xs font-medium">{row.value}</span>
								{#if row.copy}
									<button
										type="button"
										onclick={() => copyToClipboard(row.value, row.label)}
										aria-label="Copy {row.label}"
										class="text-muted-foreground/40 transition-colors hover:text-muted-foreground focus-visible:outline-none"
									>
										{#if copiedKey === row.label}
											<Check class="size-3 text-emerald-500" />
										{:else}
											<Copy class="size-3" />
										{/if}
									</button>
								{/if}
							</dd>
						</div>
					{/each}
				</dl>
			</div>

			<!-- Balance section -->
			<div>
				<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
					Balance
				</p>
				<dl class="divide-y divide-border/50">
					{#each [{ label: 'Opening Balance', value: formatCurrency(selectedTxn.openingBalance) }, { label: 'Closing Balance', value: formatCurrency(selectedTxn.closingBalance) }] as row (row.label)}
						<div class="flex items-center justify-between gap-4 py-2.5">
							<dt class="text-xs text-muted-foreground">{row.label}</dt>
							<dd class="text-xs font-semibold tabular-nums">{row.value}</dd>
						</div>
					{/each}
				</dl>
			</div>

			<!-- Account section -->
			<div>
				<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
					Account
				</p>
				<dl class="divide-y divide-border/50">
					{#each [{ label: 'Bank Name', value: selectedTxn.bankName, mono: false, copy: false }, { label: 'Account Holder', value: selectedTxn.accountHolder, mono: false, copy: false }, { label: 'Account No.', value: selectedTxn.accountNumber, mono: true, copy: true }, { label: 'Source', value: selectedTxn.sourceAccount, mono: false, copy: false }, { label: 'Usage', value: selectedTxn.accountUsage, mono: false, copy: false }] as row (row.label)}
						<div class="flex items-center justify-between gap-4 py-2.5">
							<dt class="text-xs text-muted-foreground">{row.label}</dt>
							<dd class="flex items-center gap-1.5">
								<span class="text-right text-xs font-medium {row.mono ? 'font-mono' : ''}"
									>{row.value}</span
								>
								{#if row.copy}
									<button
										type="button"
										onclick={() => copyToClipboard(row.value, 'acct-' + row.label)}
										aria-label="Copy {row.label}"
										class="text-muted-foreground/40 transition-colors hover:text-muted-foreground focus-visible:outline-none"
									>
										{#if copiedKey === 'acct-' + row.label}
											<Check class="size-3 text-emerald-500" />
										{:else}
											<Copy class="size-3" />
										{/if}
									</button>
								{/if}
							</dd>
						</div>
					{/each}
				</dl>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		<Button variant="outline" class="w-full" onclick={() => (drawerOpen = false)}>Close</Button>
	{/snippet}
</Drawer>

<!-- ════════════════════════════════════════════════════════════════════ -->
<!--  Export Report Modal                                                 -->
<!-- ════════════════════════════════════════════════════════════════════ -->
<Modal
	bind:open={exportOpen}
	title="Export Inward Fund Report"
	description="Select a date range and file format."
>
	{#if exportDone}
		<div class="flex flex-col items-center gap-4 py-6 text-center">
			<div class="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
				<CheckCircle2 class="size-7 text-emerald-600 dark:text-emerald-400" />
			</div>
			<div>
				<p class="font-semibold">Report ready</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Your {exportFormat.toUpperCase()} report has been generated.
				</p>
			</div>
			<Button class="w-full" onclick={() => {}}>
				<Download class="mr-2 size-4" />
				Download Report
			</Button>
		</div>
	{:else}
		<div class="space-y-4 py-1">
			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1.5">
					<label for="export-from" class="text-xs font-medium">From Date</label>
					<Input id="export-from" type="date" bind:value={exportFrom} />
				</div>
				<div class="space-y-1.5">
					<label for="export-to" class="text-xs font-medium">To Date</label>
					<Input id="export-to" type="date" bind:value={exportTo} min={exportFrom} />
				</div>
			</div>

			{#if exportFrom && exportTo && exportFrom > exportTo}
				<p class="flex items-center gap-1.5 text-xs text-destructive">
					<AlertCircle class="size-3.5 shrink-0" />
					From Date cannot be later than To Date.
				</p>
			{/if}

			<div class="space-y-2">
				<p class="text-xs font-medium">File Format</p>
				<div class="flex gap-2">
					{#each [{ v: 'csv', label: 'CSV' }, { v: 'excel', label: 'Excel (.xlsx)' }] as const as fmt (fmt.v)}
						<button
							type="button"
							onclick={() => (exportFormat = fmt.v)}
							class={[
								'flex flex-1 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
								exportFormat === fmt.v
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border bg-background text-foreground hover:bg-accent'
							].join(' ')}
						>
							{fmt.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		{#if !exportDone}
			<div class="flex w-full gap-3">
				<Button variant="outline" class="flex-1" onclick={closeExportModal}>Cancel</Button>
				<Button
					class="flex-1"
					onclick={generateReport}
					disabled={!exportFrom || !exportTo || exportFrom > exportTo || exportLoading}
				>
					{#if exportLoading}
						<Loader2 class="mr-2 size-4 animate-spin" />
						Generating…
					{:else}
						Generate Report
					{/if}
				</Button>
			</div>
		{:else}
			<Button variant="outline" class="w-full" onclick={closeExportModal}>Close</Button>
		{/if}
	{/snippet}
</Modal>
