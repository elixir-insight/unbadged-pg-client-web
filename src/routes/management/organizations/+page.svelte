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
		Calendar,
		BadgeCheck,
		ArrowRight,
		MailIcon,
		PhoneIcon,
		Hash,
		X
	} from '$lib/assets/icons';
	import type { OrganizationStatus } from '$lib/data/mockData';
	import type { OrganizationTableRow } from '$lib/organization/table';
	import type { ColumnDef } from '@tanstack/table-core';
	import { debounce } from '$lib/utils/debounce';
	import { formatDate } from '$lib/utils/format-time';
	import { userPermissions } from '$lib/stores/rbac';

	let { data } = $props();

	const statusVariantMap: Record<OrganizationStatus, BadgeVariant> = {
		IN_PROGRESS: 'alert',
		APPROVED: 'success',
		ACTIVE: 'info',
		ON_HOLD: 'secondary',
		FROZEN: 'secondary',
		REJECTED: 'destructive'
	};

	const STATUS_ENUMS: OrganizationStatus[] = [
		'IN_PROGRESS',
		'APPROVED',
		'ACTIVE',
		'ON_HOLD',
		'FROZEN',
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

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
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

	let selectedOrg = $state<OrganizationTableRow | null>(null);
	let drawerOpen = $state(false);
	let organizationProfile = $state<{ email: string; phone: string } | null>(null);
	let virtualAccounts = $state<{ vanNumber: string; pipelineRole: string; status: string }[]>([]);
	let profileLoading = $state(false);
	let vansLoading = $state(false);
	let profileRequestId = 0;
	let vansRequestId = 0;

	const categoryOptions = [
		{ value: 'MERCHANT', label: 'Merchant' },
		{ value: 'PARTNER', label: 'Partner' },
		{ value: 'PLATFORM', label: 'Platform' }
	];

	const columns: ColumnDef<OrganizationTableRow>[] = [
		{
			accessorKey: 'name',
			header: 'Organization'
		},
		{
			accessorKey: 'businessType',
			header: 'Business Type',
			cell: ({ row }) => formatLabel(row.original.businessType)
		},
		{
			accessorKey: 'category',
			header: 'Category',
			cell: ({ row }) => formatLabel(row.original.category)
		},
		{
			accessorKey: 'createdAt',
			header: 'Created At',
			cell: ({ row }) => formatDate(row.original.createdAt)
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.status;
				const variant = statusVariantMap[status] ?? 'secondary';
				const children = createRawSnippet(() => ({ render: () => formatLabel(status) }));
				return renderComponent(Chip, { variant, children });
			}
		}
	];

	const categoryFilter = $derived(getParam('category'));
	const organizations = $derived(data.organizations);
	const statusCounts = $derived(data.statusCounts);
	const tableError = $derived(data.tableError);

	const pagination = createUrlPagination({
		defaultLimit: 8,
		total: () => data.pagination.total
	});
	const searchInput = $derived(pagination.search);
	const categoryDropdown = $derived(categoryFilter);
	const debouncedSearch = debounce((value: string) => pagination.setSearch(value), 300);

	function handleSearchInput(value: string) {
		debouncedSearch(value);
	}

	function setCategory(value: string) {
		setUrlState({ category: value || null, skip: null }, true);
	}

	const selectedFilter = $derived(pagination.status ? formatLabel(pagination.status) : 'All');

	const filterCards: FilterCard[] = $derived([
		{ label: 'All', count: statusCounts.all },
		{ label: formatLabel('IN_PROGRESS'), count: statusCounts.IN_PROGRESS },
		{ label: formatLabel('APPROVED'), count: statusCounts.APPROVED },
		{ label: formatLabel('ACTIVE'), count: statusCounts.ACTIVE },
		{ label: formatLabel('ON_HOLD'), count: statusCounts.ON_HOLD },
		{ label: formatLabel('FROZEN'), count: statusCounts.FROZEN },
		{ label: formatLabel('REJECTED'), count: statusCounts.REJECTED }
	]);

	function onFilterSelect(label: string) {
		const enumValue = STATUS_ENUMS.find((status) => formatLabel(status) === label) ?? '';
		pagination.setStatus(label === 'All' ? '' : enumValue);
	}

	const activeFilters = $derived([
		...(pagination.status
			? [{ key: 'status', label: `Status: ${formatLabel(pagination.status)}` }]
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
		else if (key === 'category') setCategory('');
		else if (key === 'search') pagination.setSearch('');
	}

	function clearFilters() {
		setUrlState({ search: null, status: null, category: null, skip: null }, true);
	}

	async function loadOrganizationProfile(orgId: string) {
		const requestId = ++profileRequestId;
		profileLoading = true;
		organizationProfile = null;

		try {
			const response = await fetch(
				resolve('/api/management/onboard/organization/[orgId]/profile', { orgId })
			);
			const body: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				const message =
					isRecord(body) && typeof body.message === 'string'
						? body.message
						: 'Failed to load organization profile';
				throw new Error(message);
			}

			if (requestId === profileRequestId) {
				const profile = isRecord(body) && isRecord(body.profile) ? body.profile : null;
				organizationProfile = {
					email: profile && typeof profile.email === 'string' ? profile.email : '',
					phone: profile && typeof profile.phone === 'string' ? profile.phone : ''
				};
			}
		} catch {
			// Contact fields fall back to "—" when profile fetch fails.
			if (requestId === profileRequestId) {
				organizationProfile = null;
			}
		} finally {
			if (requestId === profileRequestId) {
				profileLoading = false;
			}
		}
	}

	async function loadOrganizationVirtualAccounts(orgId: string) {
		const requestId = ++vansRequestId;
		vansLoading = true;
		virtualAccounts = [];

		try {
			const response = await fetch(
				resolve('/api/management/organizations/[orgId]/virtual-accounts', { orgId })
			);
			const body: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				return;
			}

			if (requestId === vansRequestId && isRecord(body) && Array.isArray(body.virtualAccounts)) {
				virtualAccounts = body.virtualAccounts.flatMap((entry) => {
					if (!isRecord(entry) || typeof entry.vanNumber !== 'string') return [];
					return [
						{
							vanNumber: entry.vanNumber,
							pipelineRole: typeof entry.pipelineRole === 'string' ? entry.pipelineRole : '—',
							status: typeof entry.status === 'string' ? entry.status : '—'
						}
					];
				});
			}
		} catch {
			if (requestId === vansRequestId) {
				virtualAccounts = [];
			}
		} finally {
			if (requestId === vansRequestId) {
				vansLoading = false;
			}
		}
	}

	function openOrgDrawer(org: OrganizationTableRow) {
		selectedOrg = org;
		drawerOpen = true;
		void loadOrganizationProfile(org.id);
		void loadOrganizationVirtualAccounts(org.id);
	}
</script>

<div class="space-y-5">
	{#if tableError}
		<div
			class="section-appear flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			<AlertCircle class="size-4 shrink-0" />
			<p>{tableError}</p>
		</div>
	{/if}

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
			{#if userPermissions.can('ORGANIZATION', 'write')}
				<Button
					class="flex gap-2"
					onclick={() => goto(resolve('/management/organizations/create-organization'))}
				>
					<Building2 />
					Create Organization
				</Button>
			{/if}
		</div>
		<Table
			data={organizations}
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
					{#if userPermissions.can('ORGANIZATION', 'write')}
						<Button
							href={`${resolve('/management/organizations/[orgId]', { orgId: selectedOrg.id })}?category=${selectedOrg.category}`}
							class="gradient-primary flex-1 gap-1.5 text-primary-foreground hover:opacity-90"
						>
							<ArrowRight class="size-3.5" />
							Continue Editing
						</Button>
					{/if}
					<Button
						href={`${resolve(`/management/organizations/${selectedOrg.id}/preview`)}?category=${selectedOrg.category}`}
						variant="outline"
						class="flex-1 gap-1.5"
					>
						<Eye class="size-3.5" />
						Preview
					</Button>
				{:else if selectedOrg.status === 'APPROVED' || selectedOrg.status === 'ACTIVE' || selectedOrg.status === 'FROZEN'}
					<Button
						href={`${resolve(`/management/organizations/${selectedOrg.id}/preview`)}?category=${selectedOrg.category}`}
						class="gradient-primary flex-1 gap-1.5 text-primary-foreground hover:opacity-90"
					>
						<Eye class="size-3.5" />
						Profile overview
					</Button>
				{:else}
					<Button
						href={`${resolve('/management/organizations/[orgId]', { orgId: selectedOrg.id })}?category=${selectedOrg.category}`}
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
					<MailIcon class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							Email Address
						</p>
						{#if profileLoading}
							<p class="text-sm text-muted-foreground">Loading...</p>
						{:else if organizationProfile?.email}
							<a
								href="mailto:{organizationProfile.email}"
								class="block truncate text-sm font-medium hover:underline"
							>
								{organizationProfile.email}
							</a>
						{:else}
							<p class="text-sm font-medium">—</p>
						{/if}
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<PhoneIcon class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							Phone Number
						</p>
						{#if profileLoading}
							<p class="text-sm text-muted-foreground">Loading...</p>
						{:else if organizationProfile?.phone}
							<a
								href="tel:{organizationProfile.phone}"
								class="block truncate text-sm font-medium hover:underline"
							>
								{organizationProfile.phone}
							</a>
						{:else}
							<p class="text-sm font-medium">—</p>
						{/if}
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<Hash class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							VAN Number
						</p>
						{#if vansLoading}
							<p class="text-sm text-muted-foreground">Loading...</p>
						{:else if virtualAccounts.length > 0}
							<ul class="space-y-1">
								{#each virtualAccounts as van (van.vanNumber)}
									<li class="truncate font-mono text-sm font-medium">{van.vanNumber}</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm font-medium">—</p>
						{/if}
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<Building2 class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							Business Type
						</p>
						<p class="text-sm font-medium">{formatLabel(selectedOrg.businessType)}</p>
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
						<p class="text-sm font-medium">{formatLabel(selectedOrg.category)}</p>
					</div>
				</div>
				<div
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-muted/30 px-4 py-3"
				>
					<BadgeCheck class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							Profile Status
						</p>
						<p class="text-sm font-medium">{formatLabel(selectedOrg.status)}</p>
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
						<p class="text-sm font-medium">{formatDate(selectedOrg.createdAt)}</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</Drawer>
