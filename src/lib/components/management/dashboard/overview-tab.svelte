<script lang="ts">
	import { AlertTriangle, Building2, Clock, UserPlus } from '$lib/assets/icons';
	import MetricTile, { type MetricTileData } from './metric-tile.svelte';
	import StatusDistributionCard, { type StatusDatum } from './status-distribution-card.svelte';
	import TrendAreaCard, { type TrendPoint } from './trend-area-card.svelte';
	import { formatChartDate } from '$lib/utils/format-time';

	const kpis: MetricTileData[] = [
		{
			label: 'Total Organizations',
			value: '1,930',
			subtitle: 'vs last month',
			trend: '+12.4%',
			trendDirection: 'up',
			icon: Building2,
			tone: 'violet'
		},
		{
			label: 'Pending Review',
			value: '210',
			subtitle: 'awaiting compliance check',
			trend: '-4.1%',
			trendDirection: 'down',
			icon: Clock,
			tone: 'amber'
		},
		{
			label: 'Action Required',
			value: '340',
			subtitle: 'flagged for follow-up',
			trend: '+6.2%',
			trendDirection: 'up',
			icon: AlertTriangle,
			tone: 'rose'
		},
		{
			label: 'New This Month',
			value: '128',
			subtitle: 'newly onboarded orgs',
			trend: '+18.6%',
			trendDirection: 'up',
			icon: UserPlus,
			tone: 'emerald'
		}
	];

	const preApprovalStatus: StatusDatum[] = [
		{ label: 'In progress', amount: 380, percentage: 41, color: 'var(--chart-3)' },
		{ label: 'In review', amount: 210, percentage: 23, color: 'var(--chart-1)' },
		{ label: 'Remarked', amount: 340, percentage: 37, color: 'var(--chart-2)' }
	];

	const postApprovalStatus: StatusDatum[] = [
		{ label: 'Approved', amount: 235, percentage: 24, color: 'var(--chart-1)' },
		{ label: 'Active', amount: 640, percentage: 64, color: 'var(--chart-2)' },
		{ label: 'On hold', amount: 90, percentage: 9, color: 'var(--chart-3)' },
		{ label: 'Frozen', amount: 35, percentage: 4, color: 'var(--chart-4)' }
	];

	/** Deterministic 30-day trend: gentle upward drift plus two overlaid sine waves for a natural, non-linear curve. */
	function generateTrend(base: number, growth: number, amplitude: number): TrendPoint[] {
		const dayMs = 24 * 60 * 60 * 1000;
		const todayMs = Date.now();
		return Array.from({ length: 30 }, (_, i) => {
			const date = new Date(todayMs - (29 - i) * dayMs);
			const wave = Math.sin(i / 3.5) * amplitude + Math.sin(i / 7) * (amplitude / 2);
			return {
				label: formatChartDate(date),
				value: Math.max(0, Math.round(base + growth * i + wave))
			};
		});
	}

	const registrationTrend = generateTrend(18, 0.9, 4);
	const activationTrend = generateTrend(12, 0.7, 3);
</script>

<div class="flex h-full min-h-0 flex-col gap-4">
	<!-- Row 1: KPI cards.  -->
	<div class="grid shrink-0 grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
		{#each kpis as kpi (kpi.label)}
			<MetricTile {...kpi} variant="stat" />
		{/each}
	</div>

	<!-- Row 2: Organization status distribution -->

	<div class="grid min-h-72 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
		<StatusDistributionCard
			title="Organization Status — Pre Approval"
			data={preApprovalStatus}
			totalLabel="Pre-Approval"
			showAmount={false}
			class="min-h-80 sm:min-h-0"
		/>
		<StatusDistributionCard
			title="Organization Status — Post Approval"
			data={postApprovalStatus}
			showAmount={false}
			chartType="radial"
			class="min-h-80 sm:min-h-0"
		/>
	</div>

	<!-- Row 3: Trend analytics -->
	<div class="grid min-h-64 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
		<TrendAreaCard
			title="Organization Registration Trend"
			description="Last 30 days"
			data={registrationTrend}
			valueLabel="Registrations"
			color="var(--chart-1)"
			class="min-h-64 sm:min-h-0"
		/>
		<TrendAreaCard
			title="Organization Activation Trend"
			description="Last 30 days"
			data={activationTrend}
			valueLabel="Activations"
			color="var(--chart-3)"
			filled={false}
			class="min-h-64 sm:min-h-0"
		/>
	</div>
</div>
