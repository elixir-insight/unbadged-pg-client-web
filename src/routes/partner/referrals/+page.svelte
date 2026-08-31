<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { navigating, page as pageState } from '$app/state';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import {
		Chip,
		Button,
		Dropdown,
		FilterCards,
		SearchField,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { ReferralMerchant, ReferralStatus } from './types';
	import {
		formatReferralBusinessType,
		REFERRAL_BUSINESS_TYPES
	} from '$lib/partner/referrals/business-types';
	import { debounce } from '$lib/utils/debounce.js';
	import { Download, RefreshCw, X } from '$lib/assets/icons';

	let { data } = $props();

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

	function formatDate(value: string) {
		return dateFormatter.format(new Date(value));
	}

	const statusChipVariant = {
		active: 'success',
		pending: 'warning',
		inactive: 'secondary',
		rejected: 'destructive'
	} as const;

	const statusChipLabel = {
		active: 'Active',
		pending: 'Pending',
		inactive: 'Inactive',
		rejected: 'Rejected'
	} as const;

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'rejected', label: 'Rejected' }
	];

	const businessTypeOptions = REFERRAL_BUSINESS_TYPES.map((option) => ({
		value: option.value,
		label: option.label
	}));

	const searchFields = [
		{ value: 'name', label: 'Merchant Name', placeholder: 'e.g. BlueCart Retail…' }
	];

	const filterLabelToStatus: Record<string, string> = {
		All: '',
		Active: 'active',
		Pending: 'pending',
		Inactive: 'inactive',
		Rejected: 'rejected'
	};

	const statusToFilterLabel: Record<string, string> = {
		'': 'All',
		active: 'Active',
		pending: 'Pending',
		inactive: 'Inactive',
		rejected: 'Rejected'
	};

	const referralsError = $derived(data.referralsError);
	const useClientPagination = $derived(data.clientSideSearch);

	const pagination = createUrlPagination({
		defaultLimit: 8,
		total: () => (data.clientSideSearch ? data.referrals.merchants.length : data.pagination.total)
	});

	const searchField = $derived(
		pageState.url.searchParams.get('searchField') === 'email' ? 'email' : 'name'
	);

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === pageState.url.pathname
	);

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	const searchInput = $derived(pagination.search);

	function handleSearch(_field: string, value: string) {
		debouncedSearch(value);
	}

	function handleFilterSelect(label: string) {
		pagination.setStatus(filterLabelToStatus[label] ?? '');
	}

	function onStatusDropdownChange(value: string) {
		pagination.setStatus(value);
	}

	function onBusinessTypeChange(value: string) {
		pagination.setType(value);
	}

	function removeFilter(key: 'status' | 'search' | 'businessType') {
		if (key === 'status') {
			pagination.setStatus('');
		} else if (key === 'businessType') {
			pagination.setType('');
		} else if (key === 'search') {
			pagination.setSearch('');
		}
	}

	function clearFilters() {
		pagination.clearAllFilters();
	}

	const pageRows = $derived.by(() => {
		if (useClientPagination) {
			return data.referrals.merchants.slice(pagination.skip, pagination.skip + pagination.limit);
		}
		return data.referrals.merchants;
	});

	const filterCards = $derived.by(() => {
		const counts = data.referrals.statusCounts;
		return [
			{ label: 'All', count: counts.all },
			{ label: 'Active', count: counts.active },
			{ label: 'Pending', count: counts.pending },
			{ label: 'Inactive', count: counts.inactive },
			{ label: 'Rejected', count: counts.rejected }
		];
	});

	const activeFilters = $derived.by(() => {
		const filters: {
			key: 'status' | 'search' | 'businessType';
			label: string;
			value: string;
		}[] = [];
		if (pagination.status) {
			const opt = statusOptions.find((o) => o.value === pagination.status);
			filters.push({ key: 'status', label: 'Status', value: opt?.label ?? pagination.status });
		}

		if (pagination.type) {
			filters.push({
				key: 'businessType',
				label: 'Business Type',
				value: formatReferralBusinessType(pagination.type)
			});
		}

		if (pagination.search) {
			const opt = searchFields.find((f) => f.value === searchField);
			filters.push({ key: 'search', label: opt?.label ?? 'Search', value: pagination.search });
		}

		return filters;
	});

	const hasActiveFilters = $derived(activeFilters.length > 0);

	const columns: ColumnDef<ReferralMerchant>[] = [
		{
			accessorKey: 'name',
			header: 'Merchant',
			cell: (info) => renderSnippet(merchantCell, info.row.original)
		},
		{ accessorKey: 'merchantId', header: 'Merchant ID' },
		{ accessorKey: 'email', header: 'Email' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => renderSnippet(statusCell, { status: info.getValue<ReferralStatus>() })
		},
		{
			accessorKey: 'referredOn',
			header: 'Referred On',
			cell: (info) => formatDate(info.getValue<string>())
		},
		{
			accessorKey: 'volume',
			header: () => renderSnippet(amountHeader, { label: 'Volume' }),
			meta: { align: 'right' },
			cell: (info) => renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
		},
		{
			accessorKey: 'commissionEarned',
			header: () => renderSnippet(amountHeader, { label: 'Commission' }),
			meta: { align: 'right' },
			cell: (info) => renderSnippet(amountCell, { value: currency.format(info.getValue<number>()) })
		}
	];
</script>

{#snippet merchantCell(merchant: ReferralMerchant)}
	<div class="flex min-w-0 items-center gap-2.5">
		<span
			class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary"
		>
			{merchant.name
				.split(' ')
				.map((word) => word[0])
				.slice(0, 2)
				.join('')
				.toUpperCase()}
		</span>
		<span class="min-w-0 truncate font-medium text-foreground">{merchant.name}</span>
	</div>
{/snippet}

{#snippet amountCell({ value }: { value: string })}
	<span class="block truncate font-mono tabular-nums" title={value}>{value}</span>
{/snippet}

{#snippet amountHeader({ label }: { label: string })}
	<span class="block truncate">{label}</span>
{/snippet}

{#snippet statusCell({ status }: { status: ReferralStatus })}
	<Chip variant={statusChipVariant[status]}>{statusChipLabel[status]}</Chip>
{/snippet}

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Referrals</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Merchants you referred and the commission earned from each.
		</p>
	</div>

	{#if referralsError}
		<div
			class="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
			role="alert"
		>
			<p>{referralsError}</p>
		</div>
	{/if}

	<FilterCards
		cards={filterCards}
		selected={statusToFilterLabel[pagination.status] ?? 'All'}
		loading={isLoading}
		onselect={handleFilterSelect}
		class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
	/>

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-wrap items-center gap-2">
				<div class="w-44">
					<Dropdown
						value={pagination.status || undefined}
						placeholder="Status"
						disabled={false}
						bordered={false}
						search={false}
						options={statusOptions}
						onValueChange={onStatusDropdownChange}
					/>
				</div>
				<div class="w-52">
					<Dropdown
						value={pagination.type || undefined}
						placeholder="Business Type"
						disabled={false}
						bordered={false}
						search={false}
						options={businessTypeOptions}
						onValueChange={onBusinessTypeChange}
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

		{#if hasActiveFilters}
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
					onclick={clearFilters}
					class="text-sm font-medium text-primary hover:underline focus-visible:outline-none"
				>
					Clear All
				</button>
			</div>
		{/if}
	</div>

	<div class="rounded-lg border border-border bg-card shadow-2xl">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{pagination.showingText} referrals</span>
			<div class="flex items-center gap-2">
				<Button variant="outline">
					<RefreshCw />
				</Button>
				<Button variant="outline">
					<Download />
					Export
				</Button>
			</div>
		</div>

		{#if !isLoading && !referralsError && pageRows.length === 0}
			<div class="flex flex-col items-center gap-3 px-6 py-16 text-center">
				<div
					class="flex size-12 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10"
				>
					<svg
						class="size-5 text-muted-foreground/25"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-sm font-medium text-foreground">No referrals found</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{#if hasActiveFilters}
							Try adjusting your search, status, or business type filter.
						{:else}
							Referred merchants will appear here once onboarding begins.
						{/if}
					</p>
				</div>
				{#if hasActiveFilters}
					<Button size="sm" variant="outline" onclick={clearFilters}>Clear All</Button>
				{/if}
			</div>
		{:else}
			<Table
				data={pageRows}
				{columns}
				pageNumber={pagination.currentPage}
				setPageNumber={pagination.setPage}
				totalPages={pagination.pageCount}
				variant="borderless"
				loading={isLoading}
			/>
		{/if}
	</div>
</div>
