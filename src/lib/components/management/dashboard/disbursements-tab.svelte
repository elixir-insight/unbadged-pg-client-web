<script lang="ts">
	import { AlertTriangle, ArrowUpFromLine, CheckCircle2, RotateCcw } from '$lib/assets/icons';
	import MetricTile, { type MetricTileData } from './metric-tile.svelte';

	const kpis: MetricTileData[] = [
		{
			label: 'Total value disbursed',
			value: '₹3,89,00,000',
			subtitle: 'Last 7 days',
			trend: '4.1%',
			trendDirection: 'up',
			icon: ArrowUpFromLine
		},
		{
			label: 'Reversals',
			value: '₹6,20,000',
			subtitle: '94 reversal requests',
			trend: '0.9%',
			trendDirection: 'down',
			icon: RotateCcw
		},
		{
			label: 'Payouts completed',
			value: '₹3,71,00,000',
			subtitle: '842 batches',
			trend: '3.8%',
			trendDirection: 'up',
			icon: CheckCircle2
		},
		{
			label: 'Payout failure',
			value: '1.08% rate',
			subtitle: '41 failed payouts',
			trend: '0.11%',
			trendDirection: 'down',
			icon: AlertTriangle
		}
	];
</script>

<div class="flex min-h-0 flex-col gap-3">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
		{#each kpis as kpi (kpi.label)}
			<MetricTile {...kpi} variant="glass" />
		{/each}
	</div>
</div>
