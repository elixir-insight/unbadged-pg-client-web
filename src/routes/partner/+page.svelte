<script lang="ts">
	import { navigating, page as pageState } from '$app/state';
	import { AreaChartCard, CardData, DonutChart } from '$lib/components/reusable';

	let { data } = $props();

	const currency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	});

	const formatCurrency = (value: number) => currency.format(value);

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === pageState.url.pathname
	);

	const dashboard = $derived(data.dashboard);
</script>

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Dashboard</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Overview of referrals, commission, and transaction volume across your merchant network.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each dashboard.kpis as kpi (kpi.label)}
			<CardData
				label={kpi.label}
				value={kpi.value || '—'}
				subText={kpi.subText}
				trend={kpi.trend}
				trendLabel={kpi.trendLabel}
				loading={isLoading}
			/>
		{:else}
			{#each [0, 1, 2, 3] as skeletonIndex (skeletonIndex)}
				<CardData label="—" value="—" loading={isLoading} />
			{/each}
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<AreaChartCard
				title={dashboard.commissionTrend.title}
				description={dashboard.commissionTrend.description}
				data={dashboard.commissionTrend.data}
				color={dashboard.commissionTrend.color}
				valueFormatter={formatCurrency}
				emptyMessage={dashboard.commissionTrend.emptyMessage}
				loading={isLoading}
			/>
		</div>

		<DonutChart
			segments={dashboard.volumeByPaymentMethod.segments}
			centerLabel={dashboard.volumeByPaymentMethod.centerLabel}
			centerValue={dashboard.volumeByPaymentMethod.centerValue}
			valueFormatter={formatCurrency}
			emptyMessage={dashboard.volumeByPaymentMethod.emptyMessage}
			loading={isLoading}
		/>
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<AreaChartCard
			title={dashboard.referralVolumeTrend.title}
			description={dashboard.referralVolumeTrend.description}
			data={dashboard.referralVolumeTrend.data}
			color={dashboard.referralVolumeTrend.color}
			valueFormatter={formatCurrency}
			emptyMessage={dashboard.referralVolumeTrend.emptyMessage}
			loading={isLoading}
		/>

		<DonutChart
			segments={dashboard.merchantsByStatus.segments}
			centerLabel={dashboard.merchantsByStatus.centerLabel}
			centerValue={dashboard.merchantsByStatus.centerValue}
			valueFormatter={(value) => String(value)}
			emptyMessage={dashboard.merchantsByStatus.emptyMessage}
			loading={isLoading}
		/>
	</div>
</div>
