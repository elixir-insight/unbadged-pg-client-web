<script lang="ts">
	import {
		Chip,
		Search,
		Dropdown,
		Table,
		FilterCards,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { FilterCard } from '$lib/components/reusable';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { createRawSnippet } from 'svelte';
	import { type BadgeVariant } from '$lib/components/ui/badge';
	import { X } from '$lib/assets/icons';
	import { organizations, type Organization } from '$lib/data/mockData';
	import type { ColumnDef } from '@tanstack/table-core';
	import { debounce } from '$lib/utils/debounce';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const statusVariantMap: Record<string, BadgeVariant> = {
		ACTIVE: 'success',
		APPROVED: 'info',
		ON_HOLD: 'alert',
		FROZEN: 'error'
	};

	const ACRONYMS = new Set(['LLP']);

	function formatLabel(value: string | undefined | null): string {
		if (!value) return '—';
		return value
			.split('_')
			.map((word) =>
				ACRONYMS.has(word) ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(' ');
	}

	const categoryOptions = [
		{ value: 'MERCHANT', label: 'Merchant' },
		{ value: 'PARTNER', label: 'Partner' },
		{ value: 'RESELLER', label: 'Reseller' }
	];

	const columns: ColumnDef<Organization>[] = [
		{
			accessorKey: 'name',
			header: 'Organization'
		},
		{
			accessorKey: 'profileType',
			header: 'Category',
			cell: ({ row }) => formatLabel(row.original.profileType)
		},
		{
			accessorKey: 'businessType',
			header: 'Business Type',
			cell: ({ row }) => formatLabel(row.original.businessType as string)
		},
		{
			accessorKey: 'assignedAdmin',
			header: 'Assigned Admin'
		},
		{
			accessorKey: 'createdAt',
			header: 'Created At'
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.status as string;
				const variant = statusVariantMap[status] ?? 'secondary';
				const children = createRawSnippet(() => ({ render: () => formatLabel(status) }));
				return renderComponent(Chip, { variant, children });
			}
		}
	];

	const STATUS_ENUMS = ['ACTIVE', 'APPROVED', 'ON_HOLD', 'FROZEN'] as const;

	const allOrganizations = $derived(
		organizations.filter((o) => (STATUS_ENUMS as readonly string[]).includes(o.status))
	);

	// All filter + pagination state lives in the URL.
	const pagination = createUrlPagination({ defaultLimit: 10, total: () => filtered.length });

	// Derived from URL — back/forward navigation automatically restores these values.
	const searchInput = $derived(pagination.search);
	const categoryDropdown = $state('');
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	function handleSearchInput(value: string) {
		debouncedSearch(value);
	}

	const filtered = $derived(
		allOrganizations
			.filter((o) => !pagination.status || o.status === pagination.status)
			.filter((o) => !pagination.type || o.profileType === pagination.type)
			.filter((o) => o.name.toLowerCase().includes(pagination.search.toLowerCase()))
	);

	const pagedData = $derived(filtered.slice(pagination.skip, pagination.skip + pagination.limit));

	const activeCount = $derived(allOrganizations.filter((o) => o.status === 'ACTIVE').length);
	const approvedCount = $derived(allOrganizations.filter((o) => o.status === 'APPROVED').length);
	const onHoldCount = $derived(allOrganizations.filter((o) => o.status === 'ON_HOLD').length);
	const frozenCount = $derived(allOrganizations.filter((o) => o.status === 'FROZEN').length);

	const selectedFilter = $derived(pagination.status ? formatLabel(pagination.status) : 'All');

	const filterCards: FilterCard[] = $derived([
		{ label: 'All', count: allOrganizations.length },
		{ label: formatLabel('ACTIVE'), count: activeCount },
		{ label: formatLabel('APPROVED'), count: approvedCount },
		{ label: formatLabel('ON_HOLD'), count: onHoldCount },
		{ label: formatLabel('FROZEN'), count: frozenCount }
	]);

	function onFilterSelect(label: string) {
		const enumVal = STATUS_ENUMS.find((s) => formatLabel(s) === label) ?? '';
		pagination.setStatus(label === 'All' ? '' : enumVal);
	}

	const activeFilters = $derived([
		...(pagination.status
			? [{ key: 'status', label: `Status: ${formatLabel(pagination.status)}` }]
			: []),
		...(pagination.type
			? [
					{
						key: 'category',
						label: `Category: ${categoryOptions.find((o) => o.value === pagination.type)?.label ?? pagination.type}`
					}
				]
			: []),
		...(pagination.search ? [{ key: 'search', label: `Search: "${pagination.search}"` }] : [])
	]);

	const hasActiveFilters = $derived(activeFilters.length > 0);

	function removeFilter(key: string) {
		if (key === 'status') pagination.setStatus('');
		else if (key === 'category') pagination.setType('');
		else if (key === 'search') pagination.setSearch('');
	}

	function clearFilters() {
		pagination.clearAllFilters();
	}

	function navigateToOrg(org: Organization) {
		goto(resolve('/management/organization/[orgId]', { orgId: org.id }));
	}
</script>

<div class="space-y-5">
	<!-- ── Filter cards ────────────────────────────────────────────────────── -->
	<div class="section-appear grid gap-4 sm:grid-cols-4 sm:items-stretch">
		<FilterCards
			cards={filterCards}
			selected={selectedFilter}
			onselect={onFilterSelect}
			class="sm:col-span-4 sm:grid-cols-5"
		/>
	</div>

	<!-- ── Search + filters (outside card) ───────────────────────────────── -->
	<div
		class="section-appear flex flex-col gap-3 sm:flex-row sm:items-center"
		style="animation-delay: 40ms"
	>
		<div class="w-full sm:max-w-sm sm:flex-1">
			<Search
				value={searchInput}
				oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
				placeholder="Search organizations"
			/>
		</div>
		<Dropdown
			value={categoryDropdown}
			onValueChange={(v) => pagination.setType(v)}
			options={categoryOptions}
			placeholder="All categories"
			class="w-full sm:w-44"
		/>
	</div>

	<!-- ── Active filter tags ─────────────────────────────────────────────── -->
	{#if hasActiveFilters}
		<div class="section-appear flex flex-wrap items-center gap-2" style="animation-delay: 50ms">
			{#each activeFilters as filter (filter.key)}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-white/10 dark:text-gray-400"
				>
					{filter.label}
					<button
						type="button"
						onclick={() => removeFilter(filter.key)}
						class="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
						aria-label="Remove {filter.label} filter"
					>
						<X class="size-3" />
					</button>
				</span>
			{/each}
			<button
				type="button"
				onclick={clearFilters}
				class="text-xs text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
			>
				Clear all filters
			</button>
		</div>
	{/if}

	<!-- ── Table card ──────────────────────────────────────────────────────── -->
	<div
		class="surface-card section-appear border rounded-lg shadow-sm pb-4"
		style="animation-delay: 80ms"
	>
		<div class="flex gap-2 justify-between items-center p-4">
			<p class="text-xs text-gray-500">{pagination.showingText}</p>
		</div>
		<Table
			data={pagedData}
			{columns}
			variant="default"
			pageNumber={pagination.currentPage}
			totalPages={pagination.pageCount}
			setPageNumber={pagination.setPage}
			onRowClick={navigateToOrg}
		/>
	</div>
</div>
