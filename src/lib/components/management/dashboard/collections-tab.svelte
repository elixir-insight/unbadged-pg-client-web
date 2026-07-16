<script lang="ts">
	import { AlertTriangle, Download, Landmark, RotateCcw, Table2, Wallet } from '$lib/assets/icons';
	import MetricTile, { type MetricTileData } from './metric-tile.svelte';
	import VolumeTrendCard, { type VolumePoint } from './volume-trend-card.svelte';
	import StatusDistributionCard, { type StatusDatum } from './status-distribution-card.svelte';
	import BankPipelineTable, { type BankPipelineRow } from './bank-pipeline-table.svelte';
	import QuickActions, { type QuickAction } from './quick-actions.svelte';
	import * as Card from '$lib/components/ui/card';

	const kpis: MetricTileData[] = [
		{
			label: 'Total Collection Value',
			value: '₹ 4,82,30,120',
			subtitle: 'vs last 7 days',
			trend: '12.6%',
			trendDirection: 'up',
			icon: Wallet,
			tone: 'violet',
			info: 'Total value of all successful collections in the selected period.'
		},
		{
			label: 'Refunds',
			value: '₹ 12,45,870',
			subtitle: 'vs last 7 days',
			trend: '8.4%',
			trendDirection: 'down',
			icon: RotateCcw,
			tone: 'amber',
			info: 'Total amount refunded to customers in the selected period.'
		},
		{
			label: 'Settlements',
			value: '₹ 3,95,20,450',
			subtitle: 'vs last 7 days',
			trend: '10.3%',
			trendDirection: 'up',
			icon: Landmark,
			tone: 'emerald',
			info: 'Total amount settled to your bank accounts.'
		},
		{
			label: 'Chargeback',
			value: '₹ 3,12,450',
			subtitle: '',
			highlight: '0.65% Rate',
			icon: AlertTriangle,
			tone: 'rose',
			info: 'Chargeback amount and rate for the selected period.'
		}
	];

	let period = $state('daily');
	const periodOptions = [
		{ value: 'daily', label: 'Daily' },
		{ value: 'weekly', label: 'Weekly' }
	];

	const volumeTrend: VolumePoint[] = [
		{ label: 'Jul 08', value: 4200000 },
		{ label: 'Jul 09', value: 3800000 },
		{ label: 'Jul 10', value: 6200000 },
		{ label: 'Jul 11', value: 6800000 },
		{ label: 'Jul 12', value: 8200000 },
		{ label: 'Jul 13', value: 7200000 },
		{ label: 'Jul 14', value: 7800000 }
	];

	const statusDistribution: StatusDatum[] = [
		{ label: 'Successful', amount: 34876210, percentage: 72.4, color: 'var(--chart-1)' },
		{ label: 'Pending', amount: 7512430, percentage: 15.6, color: 'var(--chart-2)' },
		{ label: 'Failed', amount: 4192800, percentage: 8.7, color: 'var(--chart-3)' },
		{ label: 'Refunded', amount: 1648680, percentage: 3.3, color: 'var(--chart-4)' }
	];

	const bankPipeline: BankPipelineRow[] = [
		{
			pipelineId: 'HDFC Bank',
			processedVolume: 18200000,
			successRate: 98.4,
			cbRatioActual: 0.28,
			cbRatioThreshold: 1.0,
			avgTat: 98.4,
			turnaround: '2.1 hrs',
			status: 'healthy'
		},
		{
			pipelineId: 'ICICI Bank',
			processedVolume: 15600000,
			successRate: 97.1,
			cbRatioActual: 0.35,
			cbRatioThreshold: 1.0,
			avgTat: 97.1,
			turnaround: '2.6 hrs',
			status: 'healthy'
		},
		{
			pipelineId: 'Axis Bank',
			processedVolume: 9800000,
			successRate: 94.8,
			cbRatioActual: 0.72,
			cbRatioThreshold: 1.0,
			avgTat: 91.2,
			turnaround: '3.4 hrs',
			status: 'delayed'
		},
		{
			pipelineId: 'Kotak Mahindra',
			processedVolume: 7200000,
			successRate: 96.5,
			cbRatioActual: 0.41,
			cbRatioThreshold: 1.0,
			avgTat: 95.8,
			turnaround: '2.9 hrs',
			status: 'healthy'
		},
		{
			pipelineId: 'State Bank of India',
			processedVolume: 11400000,
			successRate: 92.3,
			cbRatioActual: 0.95,
			cbRatioThreshold: 1.0,
			avgTat: 84.6,
			turnaround: '4.8 hrs',
			status: 'degraded'
		},
		{
			pipelineId: 'Yes Bank',
			processedVolume: 3100000,
			successRate: 95.7,
			cbRatioActual: 0.51,
			cbRatioThreshold: 1.0,
			avgTat: 94.3,
			turnaround: '3.1 hrs',
			status: 'healthy'
		}
	];

	const quickLinks: QuickAction[] = [
		{
			id: 'transactions',
			label: 'Transactions',
			description: 'Browse every collection transaction and filter by bank or status',
			icon: Table2,
			href: '/management/transactions',
			tone: 'violet'
		},
		{
			id: 'download-report',
			label: 'Download report',
			description: 'Export the collections summary for this period',
			icon: Download,
			href: '/management/reports',
			tone: 'amber'
		},
		{
			id: 'settlements',
			label: 'Settlements',
			description: 'Track settlement batches and reconcile against bank payouts',
			icon: Landmark,
			href: '/management/settlements',
			tone: 'emerald'
		}
	];

	function formatFullINR(amount: number): string {
		return `₹ ${amount.toLocaleString('en-IN')}`;
	}

	function formatVolume(amount: number): string {
		if (amount >= 10_000_000) return `${(amount / 10_000_000).toFixed(2)}Cr`;
		if (amount >= 100_000) return `${(amount / 100_000).toFixed(0)}L`;
		return amount.toLocaleString('en-IN');
	}
</script>

<div class="flex h-full min-h-0 flex-col gap-3">
	<!-- Row 1: KPI cards -->
	<div class="grid shrink-0 grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
		{#each kpis as kpi (kpi.label)}
			<MetricTile {...kpi} variant="stat" />
		{/each}
	</div>

	<!-- Row 2: Volume trend + quick access -->
	<div class="grid min-h-72 flex-1 grid-cols-1 gap-3 lg:grid-cols-[65fr_35fr]">
		<VolumeTrendCard
			title="Volume Trend"
			description="Daily collection volume"
			data={volumeTrend}
			valueLabel="Collection Volume"
			formatValue={formatVolume}
			color="var(--chart-1)"
			bind:period
			{periodOptions}
			class="min-h-72 lg:min-h-0"
		/>
		<Card.Root
			size="sm"
			class="flex h-full min-h-0 flex-col data-[size=sm]:gap-3 data-[size=sm]:py-3"
		>
			<Card.Header>
				<Card.Title class="text-sm font-semibold">Quick Access</Card.Title>
			</Card.Header>
			<Card.Content class="min-h-0 flex-1">
				<QuickActions actions={quickLinks} layout="list" />
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Row 3: Bank pipeline + status distribution -->
	<div class="grid min-h-64 flex-1 grid-cols-1 gap-3 lg:grid-cols-[65fr_35fr]">
		<BankPipelineTable
			title="Bank pipeline breakdown"
			rows={bankPipeline}
			formatValue={(amount) => `₹${amount.toLocaleString('en-IN')}`}
			class="min-h-64 lg:min-h-0"
		/>
		<StatusDistributionCard
			title="Status Distribution"
			data={statusDistribution}
			formatValue={formatFullINR}
			showAmount={false}
			class="min-h-80 lg:min-h-0"
		/>
	</div>
</div>
