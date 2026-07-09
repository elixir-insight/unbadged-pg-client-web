<script module lang="ts">
	export interface TransactionVolumePoint {
		day: string;
		payin: number;
		payout: number;
	}
</script>

<script lang="ts">
	import { AreaChart } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { cn } from '$lib/utils';

	interface Props {
		data: TransactionVolumePoint[];
		title?: string;
		subtitle?: string;
		class?: string;
	}

	let {
		data,
		title = 'Transaction volume · Last 7 days',
		subtitle = 'Consolidated PayIn and Payout',
		class: className
	}: Props = $props();

	const chartConfig = {
		payin: { label: 'PayIn', color: '#3b82f6' },
		payout: { label: 'Payout', color: '#16a34a' }
	} satisfies Chart.ChartConfig;

	function formatLakhs(value: number) {
		return `${Math.round(value / 100000)}L`;
	}
</script>

<div class={cn('rounded-lg border border-border bg-background p-4 shadow-xs', className)}>
	<p class="text-sm font-semibold">{title}</p>
	<p class="text-xs text-muted-foreground">{subtitle}</p>

	<Chart.Container config={chartConfig} class="mt-4 aspect-auto h-64 w-full">
		<AreaChart
			{data}
			x="day"
			seriesLayout="overlap"
			legend
			series={[
				{ key: 'payin', label: chartConfig.payin.label, color: chartConfig.payin.color },
				{ key: 'payout', label: chartConfig.payout.label, color: chartConfig.payout.color }
			]}
			props={{
				area: { curve: 'natural', 'fill-opacity': 0.15, line: { class: 'stroke-2' } },
				yAxis: { format: formatLakhs },
				xAxis: { format: (d: string) => d }
			}}
		>
			{#snippet tooltip()}
				<Chart.Tooltip />
			{/snippet}
		</AreaChart>
	</Chart.Container>
</div>
