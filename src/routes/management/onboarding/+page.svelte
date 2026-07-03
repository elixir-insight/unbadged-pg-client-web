<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Building2, X } from '$lib/assets/icons';
	import type { FilterCard } from '$lib/components/reusable';
	import {
		Button,
		Chip,
		Dropdown,
		FilterCards,
		Search,
		Table,
		createUrlPagination
	} from '$lib/components/reusable';
	import { type BadgeVariant } from '$lib/components/ui/badge';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { onboardingOrganizations, type OrganizationData } from '$lib/data/mockData';
	import { debounce } from '$lib/utils/debounce';
	import {
		formatStatusLabel,
		enumToDropdownOptions,
		BUSINESS_TYPES
	} from '$lib/utils/status_rename';
	import type { ColumnDef } from '@tanstack/table-core';
	import { createRawSnippet } from 'svelte';

	const statusVariantMap: Record<string, BadgeVariant> = {
		PENDING: 'warning',
		IN_PROGRESS: 'alert'
	};

	const businessTypeOptions = enumToDropdownOptions(BUSINESS_TYPES);

	const columns: ColumnDef<OrganizationData>[] = [
		{
			accessorKey: 'legalCompanyName',
			header: 'Organization'
		},
		{
			accessorKey: 'businessType',
			header: 'Business Type',
			cell: ({ row }) => formatStatusLabel(row.original.businessType)
		},
		{
			accessorKey: 'profileType',
			header: 'Profile Type',
			cell: ({ row }) => formatStatusLabel(row.original.profileType)
		},
		{
			accessorKey: 'createdAt',
			header: 'Created At'
		},
		{
			accessorKey: 'profileStatus',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.profileStatus;
				const variant = statusVariantMap[status] ?? 'secondary';
				const children = createRawSnippet(() => ({ render: () => formatStatusLabel(status) }));
				return renderComponent(Chip, { variant, children });
			}
		}
	];

	const allOnboarding = $derived(
		onboardingOrganizations.filter((o) => ['PENDING', 'IN_PROGRESS'].includes(o.profileStatus))
	);

	const pagination = createUrlPagination({ defaultLimit: 5, total: () => filtered.length });

	const searchInput = $derived(pagination.search);
	const businessTypeDropdown = $state('');
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	function handleSearchInput(value: string) {
		debouncedSearch(value);
	}

	const filtered = $derived(
		allOnboarding
			.filter((o) => !pagination.status || o.profileStatus === pagination.status)
			.filter((o) => !pagination.type || o.businessType === pagination.type)
			.filter((o) => o.legalCompanyName.toLowerCase().includes(pagination.search.toLowerCase()))
	);

	const pagedData = $derived(filtered.slice(pagination.skip, pagination.skip + pagination.limit));

	const pendingCount = $derived(allOnboarding.filter((o) => o.profileStatus === 'PENDING').length);
	const inProgressCount = $derived(
		allOnboarding.filter((o) => o.profileStatus === 'IN_PROGRESS').length
	);

	const STATUS_ENUMS = ['PENDING', 'IN_PROGRESS'] as const;

	const selectedFilter = $derived(pagination.status ? formatStatusLabel(pagination.status) : 'All');

	const filterCards: FilterCard[] = $derived([
		{ label: 'All', count: allOnboarding.length },
		{ label: formatStatusLabel('PENDING'), count: pendingCount },
		{ label: formatStatusLabel('IN_PROGRESS'), count: inProgressCount }
	]);

	function onFilterSelect(label: string) {
		const enumVal = STATUS_ENUMS.find((s) => formatStatusLabel(s) === label) ?? '';
		pagination.setStatus(label === 'All' ? '' : enumVal);
	}

	const activeFilters = $derived([
		...(pagination.status
			? [{ key: 'status', label: `Status: ${formatStatusLabel(pagination.status)}` }]
			: []),
		...(pagination.type
			? [
					{
						key: 'type',
						label: `Type: ${businessTypeOptions.find((o) => o.value === pagination.type)?.label ?? formatStatusLabel(pagination.type)}`
					}
				]
			: []),
		...(pagination.search ? [{ key: 'search', label: `Search: "${pagination.search}"` }] : [])
	]);

	const hasActiveFilters = $derived(activeFilters.length > 0);

	function removeFilter(key: string) {
		if (key === 'status') pagination.setStatus('');
		else if (key === 'type') pagination.setType('');
		else if (key === 'search') pagination.setSearch('');
	}

	function clearFilters() {
		pagination.clearAllFilters();
	}

	function openOrg(org: OrganizationData) {
		goto(resolve('/management/onboarding/[orgId]', { orgId: String(org.orgId) }));
	}
</script>

<div class="space-y-5">
	<div class="section-appear grid gap-4 sm:grid-cols-3 sm:items-stretch">
		<FilterCards
			cards={filterCards}
			selected={selectedFilter}
			onselect={onFilterSelect}
			class="sm:col-span-3 sm:grid-cols-3"
		/>
	</div>

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
			value={businessTypeDropdown}
			onValueChange={(v) => pagination.setType(v)}
			options={businessTypeOptions}
			class="w-full sm:w-44"
		/>
	</div>

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

	<div
		class="surface-card section-appear border rounded-lg shadow-sm pb-4"
		style="animation-delay: 80ms"
	>
		<div class="flex gap-2 justify-between items-center p-4">
			<p class="text-xs text-gray-500">{pagination.showingText}</p>
			<Button
				class="flex gap-2"
				onclick={() => goto(resolve('/management/onboarding/create-organization'))}
			>
				<Building2 /> Create Organization
			</Button>
		</div>
		<Table
			data={pagedData}
			{columns}
			variant="default"
			pageNumber={pagination.currentPage}
			totalPages={pagination.pageCount}
			setPageNumber={pagination.setPage}
			onRowClick={openOrg}
		/>
	</div>
</div>
