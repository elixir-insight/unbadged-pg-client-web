<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import type { DateRange } from 'bits-ui';
	import { getLocalTimeZone } from '@internationalized/date';
	import { onMount } from 'svelte';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Button,
		Chip,
		DateRangePicker,
		Drawer,
		EmptyState,
		FilterCards,
		SearchField,
		Table
	} from '$lib/components/reusable';
	import {
		CreatePaymentLinkModal,
		PaymentLinkDetailsDrawer,
		PaymentLinkStatusBadge,
		PaymentLinkUrlCell
	} from '$lib/components/payment-links';
	import type { PaymentLink, PaymentLinkCounts, PaymentLinkListRow } from '$lib/types/payment-link';
	import {
		filterPaymentLinks,
		formatPaymentLinkAmount,
		formatPaymentLinkDate,
		loadPaymentLinks
	} from '$lib/utils/payment-links-store';
	import { Plus, RefreshCw, X } from '$lib/assets/icons';

	const DAY_MS = 86_400_000;
	const PAGE_SIZE = 10;

	type StatusTab = keyof PaymentLinkCounts;

	const summaryCards: { label: StatusTab; status: StatusTab | null }[] = [
		{ label: 'All', status: null },
		{ label: 'Issued', status: 'Issued' },
		{ label: 'Partially Paid', status: 'Partially Paid' },
		{ label: 'Paid', status: 'Paid' },
		{ label: 'Cancelled', status: 'Cancelled' },
		{ label: 'Expired', status: 'Expired' }
	];

	let links = $state<PaymentLink[]>([]);
	let selectedCard = $state<StatusTab>('All');
	let searchInput = $state('');
	let dateRange = $state<DateRange>({ start: undefined, end: undefined });
	let pageNumber = $state(1);
	let createModalOpen = $state(false);
	let drawerOpen = $state(false);
	let selectedLink = $state<PaymentLink | null>(null);
	let refreshing = $state(false);

	onMount(() => {
		links = loadPaymentLinks();
	});

	function reloadLinks() {
		links = loadPaymentLinks();
	}

	async function refreshList() {
		refreshing = true;
		try {
			reloadLinks();
		} finally {
			refreshing = false;
		}
	}

	function selectCard(label: string) {
		const card = summaryCards.find((item) => item.label === label);
		if (!card) return;
		selectedCard = card.label;
		pageNumber = 1;
	}

	function removeFilter(key: 'date' | 'search') {
		if (key === 'date') dateRange = { start: undefined, end: undefined };
		if (key === 'search') searchInput = '';
		pageNumber = 1;
	}

	function clearAllFilters() {
		dateRange = { start: undefined, end: undefined };
		searchInput = '';
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

	const dateFilteredLinks = $derived(
		dateFilter
			? links.filter((l) => l.createdAtMs >= dateFilter.start && l.createdAtMs <= dateFilter.end)
			: links
	);

	const cardCounts = $derived.by(() => {
		const counts: PaymentLinkCounts = {
			All: dateFilteredLinks.length,
			Issued: 0,
			'Partially Paid': 0,
			Paid: 0,
			Cancelled: 0,
			Expired: 0
		};

		for (const link of dateFilteredLinks) {
			if (link.status === 'issued') counts.Issued += 1;
			if (link.status === 'partially_paid') counts['Partially Paid'] += 1;
			if (link.status === 'paid') counts.Paid += 1;
			if (link.status === 'cancelled') counts.Cancelled += 1;
			if (link.status === 'expired') counts.Expired += 1;
		}

		return counts;
	});

	const filterCards = $derived(
		summaryCards.map((card) => ({ label: card.label, count: cardCounts[card.label] }))
	);

	const filteredLinks = $derived(
		filterPaymentLinks(dateFilteredLinks, {
			statusTab: selectedCard,
			search: searchInput,
			fromDateMs: null,
			toDateMs: null
		})
	);

	const activeFilters = $derived.by(() => {
		const filters: { key: 'date' | 'search'; label: string; value: string }[] = [];

		if (dateRange.start && dateRange.end) {
			const tz = getLocalTimeZone();
			const fmt = (d: Date) =>
				d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
			filters.push({
				key: 'date',
				label: 'Duration',
				value: `${fmt(dateRange.start.toDate(tz))} – ${fmt(dateRange.end.toDate(tz))}`
			});
		}

		if (searchInput.trim()) {
			filters.push({ key: 'search', label: 'Payment Link ID', value: searchInput.trim() });
		}

		return filters;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredLinks.length / PAGE_SIZE)));
	const pagedLinks = $derived(
		filteredLinks.slice(
			(pageNumber - 1) * PAGE_SIZE,
			pageNumber * PAGE_SIZE
		) as PaymentLinkListRow[]
	);

	const showingFrom = $derived(filteredLinks.length === 0 ? 0 : (pageNumber - 1) * PAGE_SIZE + 1);
	const showingTo = $derived(Math.min(pageNumber * PAGE_SIZE, filteredLinks.length));
	const showingText = $derived(
		filteredLinks.length === 0
			? 'No payment links'
			: `Showing ${showingFrom}–${showingTo} of ${filteredLinks.length} payment links`
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

	function openLinkDetails(link: PaymentLinkListRow) {
		selectedLink = link;
		drawerOpen = true;
	}

	function handleLinkCreated(link: PaymentLink) {
		reloadLinks();
		selectedLink = link;
		drawerOpen = true;
	}
</script>

<div class="flex flex-col gap-6">
	<FilterCards
		loading={false}
		skeletonCount={6}
		cards={filterCards}
		bind:selected={selectedCard}
		onselect={selectCard}
		class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
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
						{
							value: 'id',
							label: 'Payment Link ID',
							placeholder: 'e.g. inv_TR8w6NeWPKWZ3B…'
						}
					]}
					field="id"
					value={searchInput}
					onSearch={(_field, value) => {
						searchInput = value;
						pageNumber = 1;
					}}
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

		{#if pagedLinks.length === 0}
			<EmptyState
				title="No payment links match your filters"
				description="Try a different date range or payment link ID, or create a new link."
				actionLabel={activeFilters.length > 0 ? 'Clear filters' : 'Create Payment Link'}
				onaction={() => (activeFilters.length > 0 ? clearAllFilters() : (createModalOpen = true))}
			/>
		{:else}
			<Table
				data={pagedLinks}
				{columns}
				{pageNumber}
				{totalPages}
				setPageNumber={(p) => {
					pageNumber = p;
				}}
				onRowClick={openLinkDetails}
				variant="borderless"
			/>
		{/if}
	</div>
</div>

<CreatePaymentLinkModal bind:open={createModalOpen} onCreated={handleLinkCreated} />

<Drawer bind:open={drawerOpen} title="Payment Link Details" direction="right" class="max-w-md">
	{#if selectedLink}
		<PaymentLinkDetailsDrawer link={selectedLink} />
	{/if}
</Drawer>
