<script lang="ts">
	import { resolve } from '$app/paths';
	import { navigating, page as pageState } from '$app/state';
	import Breadcrumb from '$lib/components/reusable/breadcrumb/breadcrumb.svelte';
	import { CardData } from '$lib/components/reusable';
	import { calculateSettlementStatus, formatInr } from './shared';
	import PartnerSettlementStatusBadge from './partner-settlement-status-badge.svelte';
	import PartnerSettlementEntriesTable from './partner-settlement-entries-table.svelte';

	let { data } = $props();

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === pageState.url.pathname
	);

	const entries = $derived(data.entries);

	const merchantStatus = $derived(
		calculateSettlementStatus(data.merchant.commissionEarned, entries)
	);

	const totalSettled = $derived(entries.reduce((sum, entry) => sum + entry.amount, 0));
	const pendingAmount = $derived(Math.max(data.merchant.commissionEarned - totalSettled, 0));

	const breadcrumbItems = $derived([
		{ label: 'Settlements', href: resolve('/partner/settlements') },
		{
			label: data.merchant.name,
			href: resolve('/partner/settlements/[merchantId]', { merchantId: data.merchant.id })
		}
	]);
</script>

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<Breadcrumb items={breadcrumbItems} />

	<header class="space-y-2">
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="text-2xl font-semibold text-foreground">{data.merchant.name}</h1>
			<PartnerSettlementStatusBadge status={merchantStatus} />
		</div>
		<p class="text-sm text-muted-foreground">
			{data.merchant.id} · {data.merchant.city}
		</p>
	</header>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<CardData
			label="Commission Earned"
			value={formatInr(data.merchant.commissionEarned)}
			subText="Lifetime referral commission"
			loading={isLoading}
		/>
		<CardData
			label="Total Settled"
			value={formatInr(totalSettled)}
			subText="{entries.length} entries"
			loading={isLoading}
		/>
		<CardData
			label="Pending"
			value={formatInr(pendingAmount)}
			subText="Outstanding settlement balance"
			loading={isLoading}
		/>
		<CardData
			label="Status"
			value={merchantStatus.charAt(0).toUpperCase() + merchantStatus.slice(1)}
			subText="Computed from entries"
			loading={isLoading}
		/>
	</div>

	<div class="rounded-lg border border-border bg-card shadow-2xl">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">
				{entries.length} settlement {entries.length === 1 ? 'entry' : 'entries'}
			</span>
		</div>

		{#if !isLoading && entries.length === 0}
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
					<p class="text-sm font-medium text-foreground">No settlement entries yet</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Settlement entries for this merchant will appear here.
					</p>
				</div>
			</div>
		{:else}
			<PartnerSettlementEntriesTable {entries} loading={isLoading} />
		{/if}
	</div>
</div>
