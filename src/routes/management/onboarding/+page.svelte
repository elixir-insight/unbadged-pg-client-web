<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		AlertCircle,
		ArrowRight,
		BadgeCheck,
		Building2,
		Calendar,
		Eye,
		Layers,
		X
	} from '$lib/assets/icons';
	import type { FilterCard } from '$lib/components/reusable';
	import {
		Button,
		Chip,
		Drawer,
		Dropdown,
		FilterCards,
		Search,
		Table,
		createUrlPagination
	} from '$lib/components/reusable';
	import { type BadgeVariant } from '$lib/components/ui/badge';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { organizations, type Organization } from '$lib/data/mockData';
	import { debounce } from '$lib/utils/debounce';
	import { formatStatusLabel } from '$lib/utils/status_rename';
	import type { ColumnDef } from '@tanstack/table-core';
	import { createRawSnippet } from 'svelte';

	const statusVariantMap: Record<string, BadgeVariant> = {
		PENDING: 'warning',
		IN_REVIEW: 'info',
		IN_PROGRESS: 'alert'
	};

	let selectedOrg = $state<Organization | null>(null);
	let drawerOpen = $state(false);

	const businessTypeOptions = [
		{ value: 'PARTNERSHIP', label: 'Partnership' },
		{ value: 'PRIVATE_LIMITED', label: 'Private Limited' },
		{ value: 'LLP', label: 'LLP' },
		{ value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' }
	];

	const columns: ColumnDef<Organization>[] = [
		{
			accessorKey: 'name',
			header: 'Organization'
		},
		{
			accessorKey: 'businessType',
			header: 'Business Type',
			cell: ({ row }) => formatStatusLabel(row.original.businessType as string)
		},
		{
			accessorKey: 'category',
			header: 'Category',
			cell: ({ row }) => formatStatusLabel(row.original.category as string)
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
				const children = createRawSnippet(() => ({ render: () => formatStatusLabel(status) }));
				return renderComponent(Chip, { variant, children });
			}
		}
	];

	const allOnboarding = $derived(
		organizations.filter((o) => ['PENDING', 'IN_REVIEW', 'IN_PROGRESS'].includes(o.status))
	);

	// All filter + pagination state lives in the URL.
	const pagination = createUrlPagination({ defaultLimit: 5, total: () => filtered.length });

	// Derived from URL — back/forward navigation automatically restores these values.
	const searchInput = $derived(pagination.search);
	// const typeInput = $derived(pagination.type);
	const businessTypeDropdown = $state('');
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	function handleSearchInput(value: string) {
		debouncedSearch(value);
	}

	const filtered = $derived(
		allOnboarding
			.filter((o) => !pagination.status || o.status === pagination.status)
			.filter((o) => !pagination.type || o.businessType === pagination.type)
			.filter((o) => o.name.toLowerCase().includes(pagination.search.toLowerCase()))
	);

	const pagedData = $derived(filtered.slice(pagination.skip, pagination.skip + pagination.limit));

	const pendingCount = $derived(allOnboarding.filter((o) => o.status === 'PENDING').length);
	const inReviewCount = $derived(allOnboarding.filter((o) => o.status === 'IN_REVIEW').length);
	const inProgressCount = $derived(allOnboarding.filter((o) => o.status === 'IN_PROGRESS').length);

	const STATUS_ENUMS = ['PENDING', 'IN_REVIEW', 'IN_PROGRESS'] as const;

	const selectedFilter = $derived(pagination.status ? formatStatusLabel(pagination.status) : 'All');

	const filterCards: FilterCard[] = $derived([
		{ label: 'All', count: allOnboarding.length },
		{ label: formatStatusLabel('PENDING'), count: pendingCount },
		{ label: formatStatusLabel('IN_REVIEW'), count: inReviewCount },
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
						label: `Type: ${businessTypeOptions.find((o) => o.value === pagination.type)?.label ?? pagination.type}`
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

	function openOrgDrawer(org: Organization) {
		selectedOrg = org;
		drawerOpen = true;
	}
</script>

<div class="space-y-5">
	<!-- ── Filter cards + Add Organization ────────────────────────────────── -->
	<div class="section-appear grid gap-4 sm:grid-cols-4 sm:items-stretch">
		<FilterCards
			cards={filterCards}
			selected={selectedFilter}
			onselect={onFilterSelect}
			class="sm:col-span-4 sm:grid-cols-4"
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
			value={businessTypeDropdown}
			onValueChange={(v) => pagination.setType(v)}
			options={businessTypeOptions}
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
			<Button
				class="flex gap-2"
				onclick={() => goto(resolve('/management/onboarding/create-organization'))}
				><Building2 /> Create Organization</Button
			>
		</div>
		<Table
			data={pagedData}
			{columns}
			variant="default"
			pageNumber={pagination.currentPage}
			totalPages={pagination.pageCount}
			setPageNumber={pagination.setPage}
			onRowClick={openOrgDrawer}
		/>
	</div>
</div>

<!-- ── Org detail drawer ───────────────────────────────────────────────── -->
<Drawer
	bind:open={drawerOpen}
	title={selectedOrg?.name ?? ''}
	description={selectedOrg?.id ?? ''}
	direction="right"
>
	{#snippet footer()}
		{#if selectedOrg}
			<div class="flex gap-2">
				{#if selectedOrg.status === 'PENDING' || selectedOrg.status === 'IN_PROGRESS'}
					<Button
						href={resolve('/management/onboarding/[orgId]', { orgId: selectedOrg.id })}
						class="gradient-primary flex-1 gap-1.5 text-primary-foreground hover:opacity-90"
					>
						<ArrowRight class="size-3.5" />
						Continue Editing
					</Button>
				{:else if selectedOrg.status === 'IN_REVIEW'}
					<Button
						href={resolve('/management/onboarding/[orgId]', { orgId: selectedOrg.id })}
						variant="outline"
						class="flex-1 gap-1.5"
					>
						<ArrowRight class="size-3.5" />
						Continue Editing
					</Button>
					<Button
						href={resolve('/management/onboarding/[orgId]/review', { orgId: selectedOrg.id })}
						class="gradient-primary flex-1 gap-1.5 text-primary-foreground hover:opacity-90"
					>
						<Eye class="size-3.5" />
						Review
					</Button>
				{:else}
					<Button
						href={resolve('/management/onboarding/[orgId]', { orgId: selectedOrg.id })}
						variant="outline"
						class="flex-1 gap-1.5"
					>
						<Eye class="size-3.5" />
						View Details
					</Button>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#if selectedOrg}
		<div class="space-y-5">
			<Chip variant={statusVariantMap[selectedOrg.status]}
				>{formatStatusLabel(selectedOrg.status)}</Chip
			>

			<div class="space-y-3">
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<Building2 class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							Business Type
						</p>
						<p class="text-sm font-medium">{selectedOrg.businessType}</p>
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<Layers class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							Category
						</p>
						<p class="text-sm font-medium">{selectedOrg.category}</p>
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<BadgeCheck class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							KYB Status
						</p>
						<p class="text-sm font-medium">{selectedOrg.kybStatus}</p>
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<Calendar class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							Created At
						</p>
						<p class="text-sm font-medium">{selectedOrg.createdAt}</p>
					</div>
				</div>
			</div>

			{#if selectedOrg.resubmitted}
				<div
					class="flex items-center gap-2 rounded-xl border border-amber-200/30 bg-amber-50/40 px-4 py-3 text-amber-700 dark:border-amber-800/30 dark:bg-amber-950/30 dark:text-amber-400"
				>
					<AlertCircle class="size-4 shrink-0" />
					<p class="text-sm font-medium">Resubmitted for review</p>
				</div>
			{/if}
		</div>
	{/if}
</Drawer>
