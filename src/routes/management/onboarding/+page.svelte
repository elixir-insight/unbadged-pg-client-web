<script lang="ts">
	import { Search, Dropdown, Button, Table, Chip, Drawer } from '$lib/components/reusable';
	import { renderComponent } from '$lib/components/ui/data-table';
	import {
		Plus,
		AlertCircle,
		Eye,
		Building2,
		Layers,
		User,
		Calendar,
		BadgeCheck,
		ArrowRight,
		ClipboardListIcon
	} from '$lib/assets/icons';
	import { organizations, type Organization } from '$lib/data/mockData';
	import type { ColumnDef } from '@tanstack/table-core';
	// import OrgCell from './org-cell.svelte';
	// import { breadcrumb } from '$lib/stores/breadcrumb.svelte';

	// $effect(() => {
	// 	breadcrumb.set([{ label: 'Onboarding', href: '/management/onboarding' }]);
	// 	return () => breadcrumb.clear();
	// });

	const PAGE_SIZE = 10;

	let q = $state('');
	let status = $state('all');
	let type = $state('all');
	let pageNumber = $state(1);

	let selectedOrg = $state<Organization | null>(null);
	let drawerOpen = $state(false);

	const statusOptions = [
		{ value: 'all', label: 'All statuses' },
		{ value: 'Pending', label: 'Pending' },
		{ value: 'In Review', label: 'In Review' },
		{ value: 'In Progress', label: 'In Progress' }
	];

	const typeOptions = [
		{ value: 'all', label: 'All categories' },
		{ value: 'Merchant', label: 'Merchant' },
		{ value: 'Partner', label: 'Partner' },
		{ value: 'Reseller', label: 'Reseller' }
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
			cell: ({ row }) =>
				renderComponent(Chip, {
					status: row.original.status as string,
					label: row.original.status as string
				})
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
			.filter((o) => type === 'all' || o.category === type)
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

	// const pendingCount = $derived(allOnboarding.filter((o) => o.status === 'Pending').length);
	// const inReviewCount = $derived(allOnboarding.filter((o) => o.status === 'In Review').length);
	// const inProgressCount = $derived(allOnboarding.filter((o) => o.status === 'In Progress').length);

	// let surepassEnabled = $state(true);

	function openOrgDrawer(org: Organization) {
		selectedOrg = org;
		drawerOpen = true;
	}
</script>

<div class="space-y-5">
	<!-- ── Page header ─────────────────────────────────────────────────────── -->
	<div class="section-appear">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<!-- <div>
				<div class="flex items-center gap-2.5">
					<div
						class="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<ClipboardCheck class="size-4" />
					</div>
					<h1 class="text-2xl font-bold tracking-tight">Onboarding</h1>
				</div>
				<p class="mt-1.5 text-sm text-muted-foreground">
					Manage organizations going through KYB and review.
				</p>
			</div> -->
			<Button
				href="/management/create-org"
				class="btn-shimmer gradient-primary shrink-0 text-primary-foreground shadow-sm hover:opacity-90"
			>
				<Plus class="size-4" /> Add Organization
			</Button>
		</div>
	</div>

	<!-- ── Pipeline stats ──────────────────────────────────────────────────── -->
	<!-- <div class="section-appear grid grid-cols-1 gap-4 sm:grid-cols-3" style="animation-delay: 40ms">
		<StatCard
			icon={AlertCircle}
			label="Pending"
			value={pendingCount}
			subtitle="Awaiting review"
			tint="warning"
		/>
		<StatCard
			icon={Eye}
			label="In Review"
			value={inReviewCount}
			subtitle="Under assessment"
			tint="info"
		/>
		<StatCard
			icon={Loader2}
			label="In Progress"
			value={inProgressCount}
			subtitle="KYB in progress"
			tint="primary"
		/>
	</div> -->

	<!-- ── Table card ──────────────────────────────────────────────────────── -->
	<div class="surface-card section-appear" style="animation-delay: 80ms">
		<!-- Filters -->
		<div class="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="w-full lg:max-w-md lg:flex-1">
				<Search bind:value={q} placeholder="Search organizations…" variant="borderless" />
			</div>
			<div class="flex flex-col gap-2 sm:flex-row">
				<Dropdown bind:value={status} options={statusOptions} class="w-full sm:w-40" />
				<Dropdown bind:value={type} options={typeOptions} class="w-full sm:w-44" />
			</div>
		</div>

		<!-- Table -->
		<div class="border-t pb-4">
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
</div>

<!-- ── Org detail drawer ───────────────────────────────────────────────── -->
<Drawer bind:open={drawerOpen} title={selectedOrg?.name ?? ''} description={selectedOrg?.id ?? ''}>
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
