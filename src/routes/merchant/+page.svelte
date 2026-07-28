<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { StatCard, Avatar } from '$lib/components/reusable';
	import {
		CollectionTrendCard,
		ConversionFunnelCard,
		DashboardRangeControl,
		DashboardSettlementsTable,
		DashboardSkeleton,
		DashboardStatCard,
		PaymentMixCard,
		RecentTransactionsTable,
		type DashboardRange
	} from '$lib/components/merchant-dashboard';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const merchantName = $derived(merchantSession.session?.merchantName ?? 'there');

	const balanceTrend = [12, 14, 13, 15, 14, 16, 15, 17, 16, 18.4];

	const range = $derived(data.range as Exclude<DashboardRange, 'custom'>);
	const granularity = $derived(data.granularity);
	const rangeDescription = $derived(
		range === 'today' ? 'Today' : range === '7d' ? 'Last 7 days' : 'Last 30 days'
	);

	const isDashboardLoading = $derived.by(() => {
		if (merchantSession.loading) return true;
		const toPath = navigating?.to?.url.pathname;
		if (!toPath) return false;
		return toPath === resolve('/merchant');
	});

	function updateSearchParams(updates: Record<string, string>) {
		const next = new SvelteURL(page.url);
		for (const [key, value] of Object.entries(updates)) {
			next.searchParams.set(key, value);
		}
		const href =
			`${next.pathname}?${next.searchParams.toString()}` as `${typeof next.pathname}?${string}`;
		goto(resolve(href as '/'), { replaceState: true, noScroll: true, keepFocus: true });
	}

	function changeRange(selectedRange: Exclude<DashboardRange, 'custom'>) {
		if (isDashboardLoading) return;
		updateSearchParams({ range: selectedRange });
	}

	function changeGranularity(selectedGranularity: 'daily' | 'weekly') {
		if (isDashboardLoading) return;
		updateSearchParams({ granularity: selectedGranularity });
	}
</script>

<div class="flex flex-col lg:min-h-0 lg:flex-1">
	{#if merchantSession.loading}
		<div class="min-h-0 flex-1 overflow-y-auto pr-1">
			<div class="space-y-4 pb-1">
				<div class="flex justify-end">
					<div class="h-9 w-40 animate-pulse rounded-md border border-border bg-muted"></div>
				</div>
				<DashboardSkeleton />
			</div>
		</div>
	{:else if merchantSession.hasPayinAccess()}
		<div class="min-h-0 flex-1 overflow-y-auto pr-1">
			<div class="space-y-4 pb-1">
				<DashboardRangeControl {range} onRangeChange={changeRange} />

				{#if isDashboardLoading}
					<DashboardSkeleton />
				{:else}
					{#if data.kpisError}
						<p class="text-sm text-destructive" role="alert">{data.kpisError}</p>
					{/if}

					<section aria-label="Collection summary" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<DashboardStatCard
							label="Total collections"
							value={data.kpis.totalCollections.amount}
							change={data.kpisError ? undefined : data.kpis.totalCollections.changePercent}
							subtext={rangeDescription}
							class="h-full"
						/>
						<DashboardStatCard
							label="Success rate"
							value={data.kpis.successRate}
							subtext="Captured transactions"
							class="h-full"
						/>
						<DashboardStatCard
							label="Avg transaction value"
							value={data.kpis.avgTransactionValue.amount}
							change={data.kpisError ? undefined : data.kpis.avgTransactionValue.changePercent}
							subtext="Across successful payments"
							class="h-full"
						/>
						<DashboardStatCard
							label="Total settled"
							value={data.kpis.totalSettled}
							subtext={rangeDescription}
							tone="success"
							class="h-full"
						/>
					</section>

					<section aria-label="Collection analytics" class="grid grid-cols-12 gap-4">
						<CollectionTrendCard
							data={data.collectionsTrend}
							{granularity}
							error={data.collectionsTrendError}
							onGranularityChange={changeGranularity}
							class="col-span-12 min-h-80 lg:col-span-8"
						/>
						<PaymentMixCard
							data={data.paymentMix}
							error={data.paymentMixError}
							class="col-span-12 min-h-80 lg:col-span-4"
						/>
					</section>

					<section aria-label="Collection operations" class="grid grid-cols-12 items-stretch gap-4">
						<ConversionFunnelCard
							stages={data.conversionFunnel.stages}
							outcomes={data.conversionFunnel.outcomes}
							overallConversionRate={data.conversionFunnelError
								? null
								: data.conversionFunnel.overallConversionRate}
							error={data.conversionFunnelError}
							class="col-span-12 h-full lg:col-span-5"
						/>
						<RecentTransactionsTable
							transactions={data.recentTransactions}
							error={data.recentTransactionsError}
							emptyMessage={data.recentTransactionsEmptyMessage}
							class="col-span-12 h-full lg:col-span-7"
						/>
					</section>

					<DashboardSettlementsTable settlements={data.settlements} error={data.settlementsError} />
				{/if}
			</div>
		</div>
	{:else if merchantSession.hasPayoutAccess()}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Welcome back, {merchantName}</h2>
				<div class="flex items-center gap-2">
					<Avatar name={merchantName} size="sm" />
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<StatCard
					label="Wallet balance"
					value="₹18,42,650"
					badge={{ label: '4.2%', variant: 'success', trend: 'up' }}
					sparkline={balanceTrend}
				/>
				<StatCard
					label="Payout · today"
					value="₹3,18,900"
					badge={{ label: '99.1%', variant: 'success' }}
					subtext="47 transactions · 1 pending"
				/>
				<StatCard
					label="Needs attention"
					value="6"
					unit="refunds"
					badge={{ label: 'Action', variant: 'warning' }}
					subtext="₹42,500 pending payout"
				/>
			</div>
		</div>
	{:else}
		<div class="min-h-0 flex-1 overflow-y-auto pr-1">
			<DashboardSkeleton />
		</div>
	{/if}
</div>
