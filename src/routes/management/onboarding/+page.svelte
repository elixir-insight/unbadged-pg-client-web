<script lang="ts">
	import {
		Chip,
		Search,
		Dropdown,
		Button,
		Table,
		Drawer,
		FilterCards
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
		ClipboardListIcon,
		X
	} from '$lib/assets/icons';
	import { organizations, type Organization } from '$lib/data/mockData';
	import type { ColumnDef } from '@tanstack/table-core';
	import { resolve } from '$app/paths';

	const statusVariantMap: Record<string, BadgeVariant> = {
		Pending: 'warning',
		'In Review': 'info',
		'In Progress': 'alert'
	};

	const PAGE_SIZE = 5;

	let q = $state('');
	let status = $state('all');
	let type = $state('');
	let pageNumber = $state(1);

	let selectedOrg = $state<Organization | null>(null);
	let drawerOpen = $state(false);

	const businessTypeOptions = [
		{ value: 'Partnership', label: 'Partnership' },
		{ value: 'Private Limited', label: 'Private Limited' },
		{ value: 'LLP', label: 'LLP' },
		{ value: 'Sole Proprietorship', label: 'Sole Proprietorship' }
	];

	const columns: ColumnDef<Organization>[] = [
		{
			accessorKey: 'name',
			header: 'Organization'
			// cell: ({ row }) => renderComponent(OrgCell, { org: row.original })
		},
		{
			accessorKey: 'businessType',
			header: 'Business Type'
		},
		{
			accessorKey: 'category',
			header: 'Category'
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.original.status as string;
				const variant = statusVariantMap[status] ?? 'secondary';
				const children = createRawSnippet(() => ({ render: () => status }));
				return renderComponent(Chip, { variant, children });
			}
		},
		{
			accessorKey: 'assignedAdmin',
			header: 'Assigned Admin'
		},
		{
			accessorKey: 'createdAt',
			header: 'Created At'
		}
	];

	const allOnboarding = $derived(
		organizations.filter((o) => ['Pending', 'In Review', 'In Progress'].includes(o.status))
	);

	const filtered = $derived(
		allOnboarding
			.filter((o) => status === 'all' || o.status === status)
			.filter((o) => type === '' || o.businessType === type)
			.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))
	);

	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));

	$effect(() => {
		void q;
		void status;
		void type;
		pageNumber = 1;
	});

	const pagedData = $derived(filtered.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE));

	const showingText = $derived(
		filtered.length === 0
			? 'No results'
			: `Showing ${(pageNumber - 1) * PAGE_SIZE + 1}–${Math.min(pageNumber * PAGE_SIZE, filtered.length)} of ${filtered.length}`
	);

	const pendingCount = $derived(allOnboarding.filter((o) => o.status === 'Pending').length);
	const inReviewCount = $derived(allOnboarding.filter((o) => o.status === 'In Review').length);
	const inProgressCount = $derived(allOnboarding.filter((o) => o.status === 'In Progress').length);

	let selectedFilter = $state('All');

	const filterCards: FilterCard[] = $derived([
		{ label: 'All', count: allOnboarding.length },
		{ label: 'Pending', count: pendingCount },
		{ label: 'In Review', count: inReviewCount },
		{ label: 'In Progress', count: inProgressCount }
	]);

	function onFilterSelect(label: string) {
		status = label === 'All' ? 'all' : label;
	}

	function clearFilters() {
		type = '';
		q = '';
		selectedFilter = 'All';
		status = 'all';
	}

	const activeFilters = $derived([
		...(status !== 'all' ? [{ key: 'status', label: `Status: ${status}` }] : []),
		...(type !== ''
			? [
					{
						key: 'type',
						label: `Type: ${businessTypeOptions.find((o) => o.value === type)?.label ?? type}`
					}
				]
			: []),
		...(q ? [{ key: 'search', label: `Search: "${q}"` }] : [])
	]);

	const hasActiveFilters = $derived(activeFilters.length > 0);

	function removeFilter(key: string) {
		if (key === 'status') {
			status = 'all';
			selectedFilter = 'All';
		} else if (key === 'type') {
			type = '';
		} else if (key === 'search') {
			q = '';
		}
	}

	function openOrgDrawer(org: Organization) {
		selectedOrg = org;
		drawerOpen = true;
	}
</script>

<div class="space-y-5">
	<!-- ── Filter cards + Add Organization ────────────────────────────────── -->
	<div class="section-appear grid gap-4 sm:grid-cols-5 sm:items-stretch">
		<FilterCards
			cards={filterCards}
			bind:selected={selectedFilter}
			onselect={onFilterSelect}
			class="sm:col-span-4 sm:grid-cols-4"
		/>
		<a
			href={resolve('/management/create-org')}
			class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4 shadow-xs transition-all duration-150 hover:border-primary/60 hover:bg-primary/10 hover:shadow-[0_0_16px_hsl(var(--primary)/0.15)]"
		>
			<Building2 class="size-5 text-primary" />
			<h4 class="text-sm font-medium text-primary">Add Organization</h4>
		</a>
	</div>

	<!-- ── Search + filters (outside card) ───────────────────────────────── -->
	<div
		class="section-appear flex flex-col gap-3 sm:flex-row sm:items-center"
		style="animation-delay: 40ms"
	>
		<div class="w-full sm:max-w-sm sm:flex-1">
			<Search bind:value={q} placeholder="Search organizations…" />
		</div>
		<Dropdown bind:value={type} options={businessTypeOptions} class="w-full sm:w-44" />
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
		class="surface-card section-appear rounded-lg border shadow-sm px-2 pb-4"
		style="animation-delay: 80ms"
	>
		<Table
			data={pagedData}
			{columns}
			{showingText}
			variant="default"
			{pageNumber}
			setPageNumber={(e) => (pageNumber = e)}
			{totalPages}
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
				{#if selectedOrg.status === 'Pending'}
					<Button
						// href={resolve('/management/onboarding/[orgId]', { orgId: selectedOrg.id })}
						class="gradient-primary flex-1 gap-1.5 text-primary-foreground hover:opacity-90"
					>
						<ArrowRight class="size-3.5" />
						Continue Editing
					</Button>
				{:else if selectedOrg.status === 'In Review'}
					<Button
						// href={resolve('/management/onboarding/[orgId]', { orgId: selectedOrg.id })}
						variant="outline"
						class="flex-1 gap-1.5"
					>
						<ArrowRight class="size-3.5" />
						Continue Editing
					</Button>
					<Button
						// href={resolve('/management/onboarding/[orgId]/review', { orgId: selectedOrg.id })}
						class="gradient-primary flex-1 gap-1.5 text-primary-foreground hover:opacity-90"
					>
						<Eye class="size-3.5" />
						In Review
					</Button>
				{:else}
					<Button
						// href={resolve('/management/onboarding/[orgId]', { orgId: selectedOrg.id })}
						variant="outline"
						class="flex-1 gap-1.5"
					>
						<Eye class="size-3.5" />
						View Details
					</Button>
					<Button
						// href={resolve('/management/onboarding/[orgId]/review', { orgId: selectedOrg.id })}
						class="gradient-primary flex-1 gap-1.5 text-primary-foreground hover:opacity-90"
					>
						<ClipboardListIcon class="size-3.5" />
						Start Review
						<ArrowRight class="size-3.5" />
					</Button>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#if selectedOrg}
		<div class="space-y-5">
			<!-- <Chip status={selectedOrg.status} label={selectedOrg.status} /> -->

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
					<User class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
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
