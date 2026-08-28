<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';
	import { CardData } from '$lib/components/reusable';
	import {
		DashboardRangeControl,
		PaymentMixCard,
		type DashboardRange
	} from '$lib/components/merchant-dashboard';
	import { CommissionTrendCard } from '$lib/components/partner-dashboard';

	let { data } = $props();

	const range = $derived((data.range ?? '7d') as Exclude<DashboardRange, 'custom'>);
	const granularity = $derived(data.granularity ?? 'daily');

	const rangeDescription = $derived(
		range === 'today' ? 'Today' : range === '7d' ? 'Last 7 days' : 'Last 30 days'
	);

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === page.url.pathname
	);

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
		if (isLoading) return;
		updateSearchParams({ range: selectedRange });
	}

	function changeGranularity(selectedGranularity: 'daily' | 'weekly') {
		if (isLoading) return;
		updateSearchParams({ granularity: selectedGranularity });
	}
</script>

<div class="flex flex-col lg:min-h-0 lg:flex-1">
	<div class="min-h-0 flex-1 overflow-y-auto pr-1">
		<div class="space-y-4 p-4 pb-1 sm:p-6 lg:p-4">
			<DashboardRangeControl {range} onRangeChange={changeRange} />

			{#if data.kpisError}
				<p class="text-sm text-destructive" role="alert">{data.kpisError}</p>
			{/if}

			<section
				aria-label="Commission summary"
				class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
			>
				{#each data.kpis as kpi (kpi.label)}
					<CardData
						label={kpi.label}
						value={kpi.value || '—'}
						subText={kpi.subText ?? rangeDescription}
						trend={kpi.trend}
						trendLabel={kpi.trendLabel}
						loading={isLoading}
					/>
				{:else}
					{#each [0, 1, 2, 3] as skeletonIndex (skeletonIndex)}
						<CardData label="—" value="—" loading={isLoading} />
					{/each}
				{/each}
			</section>

			<section aria-label="Commission analytics" class="grid grid-cols-12 gap-4">
				<CommissionTrendCard
					data={data.commissionTrend}
					{granularity}
					error={data.commissionTrendError}
					onGranularityChange={changeGranularity}
					class="col-span-12 min-h-80 lg:col-span-8"
				/>
				<PaymentMixCard
					data={data.commissionChart}
					error={data.commissionChartError}
					title="Commission mix"
					description="Share of earned commission"
					emptyMessage="No commission breakdown available."
					class="col-span-12 min-h-80 lg:col-span-4"
				/>
			</section>
		</div>
	</div>
</div>
