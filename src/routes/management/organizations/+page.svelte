<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURL } from 'svelte/reactivity';
	import {
		Chip,
		Search,
		Dropdown,
		Button,
		Table,
		Drawer,
		FilterCards,
		createUrlPagination
	} from '$lib/components/reusable';
	import type { FilterCard } from '$lib/components/reusable';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { createRawSnippet } from 'svelte';
	import { type BadgeVariant } from '$lib/components/ui/badge';
	import {
		AlertCircle,
		Eye,
		Building2,
		Layers,
		User,
		Calendar,
		BadgeCheck,
		ArrowRight,
		Pencil,
		X
	} from '$lib/assets/icons';
	import { organizations, type Organization, type OrganizationStatus } from '$lib/data/mockData';
	import type { ColumnDef } from '@tanstack/table-core';
	import { debounce } from '$lib/utils/debounce';
	const statusVariantMap: Record<OrganizationStatus, BadgeVariant> = {
		IN_PROGRESS: 'alert',
		APPROVED: 'success',
		ACTIVE: 'success',
		ON_HOLD: 'secondary',
		REJECTED: 'destructive'
	};

	const STATUS_ENUMS: OrganizationStatus[] = [
		'IN_PROGRESS',
		'APPROVED',
		'ACTIVE',
		'ON_HOLD',
		'REJECTED'
	];

	const ACRONYMS = new Set(['LLP']);

	function formatLabel(value: string): string {
		return value
			.split('_')
			.map((word) =>
				ACRONYMS.has(word) ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(' ');
	}

	function getParam(name: string): string {
		return page.url.searchParams.get(name) ?? '';
	}

	function setUrlState(updates: Record<string, string | null>, replaceState = true) {
		const url = new SvelteURL(page.url.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (!value) url.searchParams.delete(key);
			else url.searchParams.set(key, value);
		}

		const href =
			`${page.url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''}` as `${typeof page.url.pathname}${string}`;

		goto(resolve(href as '/'), {
			replaceState,
			noScroll: true,
			keepFocus: true
		});
	}

	let selectedOrg = $state<Organization | null>(null);
	let drawerOpen = $state(false);

	const businessTypeOptions = [
		{ value: 'PARTNERSHIP', label: 'Partnership' },
		{ value: 'PRIVATE_LIMITED', label: 'Private Limited' },
		{ value: 'LLP', label: 'LLP' },
		{ value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' }
	];

	const categoryOptions = [
		{ value: 'MERCHANT', label: 'Merchant' },
		{ value: 'PARTNER', label: 'Partner' }
	];

	const columns: ColumnDef<Organization>[] = [
		{
			accessorKey: 'name',
			header: 'Organization'
		},
		{
			accessorKey: 'businessType',
			header: 'Business Type',
			cell: ({ row }) => formatLabel(row.original.businessType as string)
		},
		{
			accessorKey: 'category',
			header: 'Category',
			cell: ({ row }) => formatLabel(row.original.category as string)
		},
		{
			accessorKey: 'createdAt',
			header: 'Created At'
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.status as OrganizationStatus;
				const variant = statusVariantMap[status] ?? 'secondary';
				const children = createRawSnippet(() => ({ render: () => formatLabel(status) }));
				return renderComponent(Chip, { variant, children });
			}
		}
	];

	const categoryFilter = $derived(getParam('category'));
	const allOrganizations = organizations;

	const pagination = createUrlPagination({ defaultLimit: 5, total: () => filtered.length });
	const searchInput = $derived(pagination.search);
	const businessTypeDropdown = $derived(pagination.type);
	const categoryDropdown = $derived(categoryFilter);
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	function handleSearchInput(value: string) {
		debouncedSearch(value);
	}

	function setCategory(value: string) {
		setUrlState({ category: value || null, skip: null }, true);
	}

	const filtered = $derived(
		allOrganizations
			.filter((organization) => !pagination.status || organization.status === pagination.status)
			.filter((organization) => !pagination.type || organization.businessType === pagination.type)
			.filter((organization) => !categoryFilter || organization.category === categoryFilter)
			.filter((organization) =>
				organization.name.toLowerCase().includes(pagination.search.toLowerCase())
			)
	);

	const pagedData = $derived(filtered.slice(pagination.skip, pagination.skip + pagination.limit));

	const inProgressCount = $derived(
		allOrganizations.filter((organization) => organization.status === 'IN_PROGRESS').length
	);
	const approvedCount = $derived(
		allOrganizations.filter((organization) => organization.status === 'APPROVED').length
	);
	const activeCount = $derived(
		allOrganizations.filter((organization) => organization.status === 'ACTIVE').length
	);
	const onHoldCount = $derived(
		allOrganizations.filter((organization) => organization.status === 'ON_HOLD').length
	);
	const rejectedCount = $derived(
		allOrganizations.filter((organization) => organization.status === 'REJECTED').length
	);

	const selectedFilter = $derived(pagination.status ? formatLabel(pagination.status) : 'All');

	const filterCards: FilterCard[] = $derived([
		{ label: 'All', count: allOrganizations.length },
		{ label: formatLabel('IN_PROGRESS'), count: inProgressCount },
		{ label: formatLabel('APPROVED'), count: approvedCount },
		{ label: formatLabel('ACTIVE'), count: activeCount },
		{ label: formatLabel('ON_HOLD'), count: onHoldCount },
		{ label: formatLabel('REJECTED'), count: rejectedCount }
	]);

	function onFilterSelect(label: string) {
		const enumValue = STATUS_ENUMS.find((status) => formatLabel(status) === label) ?? '';
		pagination.setStatus(label === 'All' ? '' : enumValue);
	}

	const activeFilters = $derived([
		...(pagination.status
			? [{ key: 'status', label: `Status: ${formatLabel(pagination.status)}` }]
			: []),
		...(pagination.type
			? [
					{
						key: 'type',
						label: `Type: ${businessTypeOptions.find((option) => option.value === pagination.type)?.label ?? pagination.type}`
					}
				]
			: []),
		...(categoryFilter
			? [
					{
						key: 'category',
						label: `Category: ${categoryOptions.find((option) => option.value === categoryFilter)?.label ?? categoryFilter}`
					}
				]
			: []),
		...(pagination.search ? [{ key: 'search', label: `Search: "${pagination.search}"` }] : [])
	]);

	const hasActiveFilters = $derived(activeFilters.length > 0);

	function removeFilter(key: string) {
		if (key === 'status') pagination.setStatus('');
		else if (key === 'type') pagination.setType('');
		else if (key === 'category') setCategory('');
		else if (key === 'search') pagination.setSearch('');
	}

	function clearFilters() {
		setUrlState({ search: null, status: null, type: null, category: null, skip: null }, true);
	}

	function openOrgDrawer(org: Organization) {
		selectedOrg = org;
		drawerOpen = true;
	}
</script>

<div class="space-y-5">
	<div class="section-appear grid gap-4 sm:grid-cols-4 sm:items-stretch">
		<FilterCards
			cards={filterCards}
			selected={selectedFilter}
			onselect={onFilterSelect}
			class="sm:col-span-4 sm:grid-cols-4"
		/>
	</div>

	<div
		class="section-appear flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
		style="animation-delay: 40ms"
	>
		<div class="w-full sm:max-w-sm sm:flex-1">
			<Search
				value={searchInput}
				oninput={(event) => handleSearchInput((event.currentTarget as HTMLInputElement).value)}
				placeholder="Search organizations"
			/>
		</div>
		<Dropdown
			value={businessTypeDropdown}
			onValueChange={(value) => pagination.setType(value)}
			options={businessTypeOptions}
			class="w-full sm:w-44"
		/>
		<Dropdown
			value={categoryDropdown}
			onValueChange={(value) => setCategory(value)}
			options={categoryOptions}
			class="w-full sm:w-40"
			placeholder="Category"
		/>
	</div>

	{#if hasActiveFilters}
		<div class="section-appear flex flex-wrap items-center gap-2" style="animation-delay: 50ms">
			{#each activeFilters as filter (filter.key)}
				<Chip variant="outline" class="h-auto gap-1.5 rounded-full px-3 py-1 text-xs">
					<span class="text-muted-foreground">{filter.label}</span>
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
				class="text-xs font-medium text-primary hover:underline focus-visible:outline-none"
			>
				Clear all filters
			</button>
		</div>
	{/if}

	<div
		class="surface-card section-appear rounded-lg border pb-4 shadow-sm"
		style="animation-delay: 80ms"
	>
		<div class="flex items-center justify-between gap-2 p-4">
			<p class="text-xs text-muted-foreground">{pagination.showingText}</p>
			<Button
				class="flex gap-2"
				onclick={() => goto(resolve('/management/organizations/create-organization'))}
			>
				<Building2 />
				Create Organization
			</Button>
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

<Drawer
	bind:open={drawerOpen}
	title={selectedOrg?.name ?? ''}
	description={selectedOrg?.id ?? ''}
	direction="right"
>
	{#snippet footer()}
		{#if selectedOrg}
			<div class="flex gap-2">
				{#if selectedOrg.status === 'IN_PROGRESS'}
					<Button
						href={`/management/organizations/${selectedOrg.id}`}
						class="gradient-primary flex-1 gap-1.5 text-primary-foreground hover:opacity-90"
					>
						<ArrowRight class="size-3.5" />
						Continue Editing
					</Button>
					<Button
						href={`/management/organizations/${selectedOrg.id}/preview`}
						variant="outline"
						class="flex-1 gap-1.5"
					>
						<Eye class="size-3.5" />
						Preview
					</Button>
				{:else if selectedOrg.status === 'ACTIVE'}
					<Button
						href={`/management/organizations/${selectedOrg.id}/manage`}
						class="flex-1 gap-1.5"
					>
						<Pencil class="size-3.5" />
						Manage
					</Button>
					<Button
						href={`/management/organizations/${selectedOrg.id}`}
						variant="outline"
						class="flex-1 gap-1.5"
					>
						<Eye class="size-3.5" />
						View Details
					</Button>
				{:else}
					<Button
						href={`/management/organizations/${selectedOrg.id}`}
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
			<div class="space-y-3">
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<Building2 class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
						<p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
						<p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							KYB Status
						</p>
						<p class="text-sm font-medium">{selectedOrg.kybStatus}</p>
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<User class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							Assigned Admin
						</p>
						<p class="text-sm font-medium">{selectedOrg.assignedAdmin}</p>
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<Calendar class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
