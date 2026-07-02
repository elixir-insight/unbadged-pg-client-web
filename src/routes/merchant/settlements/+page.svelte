<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import {
		Chip,
		Button,
		MultiSelect,
		StatCard,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { StatCardTone } from '$lib/components/reusable';

	// ── Types + mock data — one-line swap for a real API call later, e.g.:
	// const settlements = await api.get<Settlement[]>('/merchant/settlements');
	type SettlementStatus = 'success' | 'reject' | 'in_review';

	type Settlement = {
		id: string;
		utr: string | null;
		amount: number;
		fees: number;
		netAmount: number;
		status: SettlementStatus;
		settledOn: string | null;
		transactionCount: number;
	};

	const settlements: Settlement[] = [
		{
			id: 'STL-20260701-0001',
			utr: 'UTR2607010001',
			amount: 184500,
			fees: 3690,
			netAmount: 180810,
			status: 'success',
			settledOn: '2026-07-01',
			transactionCount: 42
		},
		{
			id: 'STL-20260701-0002',
			utr: 'UTR2607010002',
			amount: 92300,
			fees: 1846,
			netAmount: 90454,
			status: 'success',
			settledOn: '2026-07-01',
			transactionCount: 18
		},
		{
			id: 'STL-20260630-0014',
			utr: 'UTR2606300014',
			amount: 256000,
			fees: 5120,
			netAmount: 250880,
			status: 'success',
			settledOn: '2026-06-30',
			transactionCount: 61
		},
		{
			id: 'STL-20260630-0013',
			utr: null,
			amount: 47500,
			fees: 950,
			netAmount: 46550,
			status: 'reject',
			settledOn: null,
			transactionCount: 9
		},
		{
			id: 'STL-20260630-0012',
			utr: 'UTR2606300012',
			amount: 133200,
			fees: 2664,
			netAmount: 130536,
			status: 'success',
			settledOn: '2026-06-30',
			transactionCount: 27
		},
		{
			id: 'STL-20260629-0027',
			utr: null,
			amount: 68900,
			fees: 1378,
			netAmount: 67522,
			status: 'in_review',
			settledOn: null,
			transactionCount: 14
		},
		{
			id: 'STL-20260629-0026',
			utr: 'UTR2606290026',
			amount: 312400,
			fees: 6248,
			netAmount: 306152,
			status: 'success',
			settledOn: '2026-06-29',
			transactionCount: 73
		},
		{
			id: 'STL-20260629-0025',
			utr: null,
			amount: 15600,
			fees: 312,
			netAmount: 15288,
			status: 'reject',
			settledOn: null,
			transactionCount: 3
		},
		{
			id: 'STL-20260628-0041',
			utr: 'UTR2606280041',
			amount: 89000,
			fees: 1780,
			netAmount: 87220,
			status: 'success',
			settledOn: '2026-06-28',
			transactionCount: 21
		},
		{
			id: 'STL-20260628-0040',
			utr: null,
			amount: 41200,
			fees: 824,
			netAmount: 40376,
			status: 'in_review',
			settledOn: null,
			transactionCount: 8
		},
		{
			id: 'STL-20260627-0009',
			utr: 'UTR2606270009',
			amount: 176800,
			fees: 3536,
			netAmount: 173264,
			status: 'success',
			settledOn: '2026-06-27',
			transactionCount: 39
		},
		{
			id: 'STL-20260627-0008',
			utr: 'UTR2606270008',
			amount: 58300,
			fees: 1166,
			netAmount: 57134,
			status: 'success',
			settledOn: '2026-06-27',
			transactionCount: 12
		},
		{
			id: 'STL-20260626-0019',
			utr: null,
			amount: 22400,
			fees: 448,
			netAmount: 21952,
			status: 'reject',
			settledOn: null,
			transactionCount: 5
		},
		{
			id: 'STL-20260626-0018',
			utr: 'UTR2606260018',
			amount: 143700,
			fees: 2874,
			netAmount: 140826,
			status: 'success',
			settledOn: '2026-06-26',
			transactionCount: 33
		},
		{
			id: 'STL-20260625-0031',
			utr: null,
			amount: 51900,
			fees: 1038,
			netAmount: 50862,
			status: 'in_review',
			settledOn: null,
			transactionCount: 11
		},
		{
			id: 'STL-20260625-0030',
			utr: 'UTR2606250030',
			amount: 267500,
			fees: 5350,
			netAmount: 262150,
			status: 'success',
			settledOn: '2026-06-25',
			transactionCount: 58
		},
		{
			id: 'STL-20260624-0007',
			utr: 'UTR2606240007',
			amount: 98600,
			fees: 1972,
			netAmount: 96628,
			status: 'success',
			settledOn: '2026-06-24',
			transactionCount: 24
		},
		{
			id: 'STL-20260624-0006',
			utr: null,
			amount: 33800,
			fees: 676,
			netAmount: 33124,
			status: 'reject',
			settledOn: null,
			transactionCount: 7
		},
		{
			id: 'STL-20260623-0015',
			utr: 'UTR2606230015',
			amount: 219300,
			fees: 4386,
			netAmount: 214914,
			status: 'success',
			settledOn: '2026-06-23',
			transactionCount: 47
		},
		{
			id: 'STL-20260622-0003',
			utr: null,
			amount: 27600,
			fees: 552,
			netAmount: 27048,
			status: 'in_review',
			settledOn: null,
			transactionCount: 6
		}
	];

	const currency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	});
	const dateFormatter = new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	function formatDate(value: string | null) {
		return value ? dateFormatter.format(new Date(value)) : null;
	}

	// Status → chip variant/label, used by the statusCell snippet below.
	const statusChipVariant = {
		success: 'success',
		reject: 'destructive',
		in_review: 'warning'
	} as const;
	const statusChipLabel = {
		success: 'Success',
		reject: 'Reject',
		in_review: 'In Review'
	} as const;

	// ── Stat cards — config-driven, derived from the settlement list ───────────
	const latestSettledDate = $derived(
		settlements.reduce<string | null>(
			(latest, s) => (s.settledOn && (!latest || s.settledOn > latest) ? s.settledOn : latest),
			null
		)
	);
	const yesterdayRows = $derived(settlements.filter((s) => s.settledOn === latestSettledDate));
	const successRows = $derived(settlements.filter((s) => s.status === 'success'));
	const inReviewRows = $derived(settlements.filter((s) => s.status === 'in_review'));
	const rejectRows = $derived(settlements.filter((s) => s.status === 'reject'));

	const sum = (rows: Settlement[], key: 'amount' | 'netAmount') =>
		rows.reduce((total, s) => total + s[key], 0);

	type StatCardConfig = {
		label: string;
		value: string;
		badgeText: string;
		badgeVariant: StatCardTone;
		subText: string;
	};

	const statCards = $derived<StatCardConfig[]>([
		{
			label: "Yesterday's Settlement",
			value: currency.format(sum(yesterdayRows, 'netAmount')),
			badgeText: 'T+1',
			badgeVariant: 'success',
			subText: `${yesterdayRows.length} txns · Gross ${currency.format(sum(yesterdayRows, 'amount'))}`
		},
		{
			label: 'Total Settled (All Time)',
			value: currency.format(sum(successRows, 'netAmount')),
			badgeText: 'PAID',
			badgeVariant: 'brand',
			subText: `${successRows.length} settlements`
		},
		{
			label: 'Awaiting Release',
			value: currency.format(sum(inReviewRows, 'netAmount')),
			badgeText: 'IN REVIEW',
			badgeVariant: 'warning',
			subText: `${inReviewRows.length} in review`
		},
		{
			label: 'Needs Attention',
			value: currency.format(sum(rejectRows, 'netAmount')),
			badgeText: 'REJECT',
			badgeVariant: 'danger',
			subText: `${rejectRows.length} rejected`
		}
	]);

	// ── Status filter — staged locally, committed to the URL on Apply ──────────
	const statusOptions = [
		{ value: 'success', label: 'Success' },
		{ value: 'reject', label: 'Reject' }
	];

	// ── Table data + pagination — URL-driven, same convention as demo/users ───
	// (Real API: `total` becomes `data.data.total` and slicing moves server-side.)
	const pagination = createUrlPagination({ defaultLimit: 8, total: () => filteredData.length });

	const filteredData = $derived(
		pagination.statuses.length === 0
			? settlements
			: settlements.filter((s) => pagination.statuses.includes(s.status))
	);

	const pageRows = $derived(
		filteredData.slice(pagination.skip, pagination.skip + pagination.limit)
	);

	// Local multi-select staging — resyncs from URL on back/forward navigation.
	let pendingStatuses = $derived(pagination.statuses);

	$effect(() => {
		pendingStatuses = pagination.statuses;
	});

	// Clearing all selections should drop the committed filter immediately.
	$effect(() => {
		if (pendingStatuses.length === 0 && pagination.statuses.length > 0) {
			pagination.setStatuses([]);
		}
	});

	function applyFilter() {
		pagination.setStatuses(pendingStatuses);
	}

	// Column cells render via snippets declared in the markup below (refCell,
	// amountCell, amountHeader, statusCell) — closures here only run once those
	// snippets have initialized, so referencing them ahead of declaration is safe.
	// Note: FlexRender invokes snippets as `snippet({ ...params, attach })`, so
	// `params` must always be an object — a bare string/primitive would get
	// spread into character-indexed keys instead of passed through.
	const columns: ColumnDef<Settlement>[] = [
		{ accessorKey: 'id', header: 'Settlement ID' },
		{
			accessorKey: 'utr',
			header: 'UTR / Ref',
			cell: (info) => renderSnippet(refCell, { value: info.getValue<string | null>() })
		},
		{
			accessorKey: 'amount',
			header: () => renderSnippet(amountHeader, { label: 'Amount' }),
			cell: (info) => renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
		},
		{
			accessorKey: 'fees',
			header: () => renderSnippet(amountHeader, { label: 'Fees & Tax' }),
			cell: (info) => renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
		},
		{
			accessorKey: 'netAmount',
			header: () => renderSnippet(amountHeader, { label: 'Net Amount' }),
			cell: (info) => renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
		},

		{
			accessorKey: 'settledOn',
			header: 'Settled On',
			cell: (info) => renderSnippet(refCell, { value: formatDate(info.getValue<string | null>()) })
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => renderSnippet(statusCell, { status: info.getValue<SettlementStatus>() })
		}
	];
</script>

<!-- Cell/header snippets for the data-table columns above -->
{#snippet refCell({ value }: { value: string | null })}
	{#if value}
		<span>{value}</span>
	{:else}
		<span class="text-muted-foreground/60">—</span>
	{/if}
{/snippet}

{#snippet amountCell({ value }: { value: string })}
	<div class="block w-full text-right font-mono tabular-nums">{value}</div>
{/snippet}

{#snippet amountHeader({ label }: { label: string })}
	<span class="ml-auto">{label}</span>
{/snippet}

{#snippet statusCell({ status }: { status: SettlementStatus })}
	<Chip variant={statusChipVariant[status]}>{statusChipLabel[status]}</Chip>
{/snippet}

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<!-- Header -->
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Settlements</h1>
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each statCards as card (card.label)}
			<StatCard
				label={card.label}
				value={card.value}
				badgeText={card.badgeText}
				badgeVariant={card.badgeVariant}
				subText={card.subText}
			/>
		{/each}
	</div>

	<!-- Filter bar -->
	<div class="flex flex-wrap items-end gap-3">
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-medium text-muted-foreground">Status Filter</span>
			<div class="flex items-center gap-2">
				<MultiSelect
					bind:value={pendingStatuses}
					options={statusOptions}
					placeholder="All statuses"
					class="w-56"
				/>
				{#if pagination.statuses.length > 0}
					<Chip variant="secondary">{pagination.statuses.length} active</Chip>
				{/if}
			</div>
		</div>

		<Button size="sm" onclick={applyFilter}>Apply</Button>
	</div>

	<!-- Table -->
	<div class="rounded-lg border border-border bg-card shadow-2xl">
		<Table
			data={pageRows}
			{columns}
			pageNumber={pagination.currentPage}
			setPageNumber={pagination.setPage}
			totalPages={pagination.pageCount}
			variant="borderless"
		/>
	</div>
</div>
