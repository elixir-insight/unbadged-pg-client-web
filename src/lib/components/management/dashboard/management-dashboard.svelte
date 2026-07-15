<script lang="ts">
	import { AlertTriangle, Building2, Clock, RefreshCw, UserPlus } from '$lib/assets/icons';
	import CollectionsTab from './collections-tab.svelte';
	import DisbursementsTab from './disbursements-tab.svelte';
	import MetricTile, { type MetricTileData } from './metric-tile.svelte';
	import StatusDistributionCard, { type StatusDatum } from './status-distribution-card.svelte';
	import TrendAreaCard, { type TrendPoint } from './trend-area-card.svelte';
	import * as Tabs from '$lib/components/ui/tabs';

	let {
		userName = 'Linda'
	}: {
		userName?: string;
	} = $props();

	let activeTab = $state<'overview' | 'collections' | 'disbursements'>('overview');

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
				label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				value: Math.max(0, Math.round(base + growth * i + wave))
			};
		});
	}

	const registrationTrend = generateTrend(18, 0.9, 4);
	const activationTrend = generateTrend(12, 0.7, 3);
</script>

<div class="flex h-full min-h-0 flex-col">
	<Tabs.Root bind:value={activeTab} class="flex h-full min-h-0 flex-col">
		<!-- Sticky header: greeting, subtitle, tabs -->
		<div class="flex shrink-0 flex-col gap-4">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="min-w-0">
					<h1
						class="text-[clamp(1.125rem,3vw,1.25rem)] font-bold whitespace-nowrap text-foreground"
					>
						Good Morning, {userName} 👋
					</h1>
					<p class="mt-0.5 text-sm text-muted-foreground">
						Here's what's happening with your business today.
					</p>
				</div>
				<div class="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
					<RefreshCw class="size-3.5" aria-hidden="true" />
					Updated just now
				</div>
			</div>

			<Tabs.List variant="line" class="shrink-0">
				<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
				<Tabs.Trigger value="collections">Collections</Tabs.Trigger>
				<Tabs.Trigger value="disbursements">Disbursements</Tabs.Trigger>
			</Tabs.List>
		</div>

		<!-- Scrollable content -->
		<!-- px/-mx cancel out (preserves alignment with the header above) while still giving card
		     box-shadows room to render before overflow-y-auto's clip edge cuts them off -->
		<div class="min-h-0 flex-1 overflow-y-auto -mx-3 px-3 pt-2 pb-4">
			<Tabs.Content value="overview" class="flex h-full min-h-0 flex-col gap-3 lg:gap-4">
				<!-- Row 1: KPI cards -->
				<div class="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
					{#each kpis as kpi (kpi.label)}
						<MetricTile {...kpi} variant="stat" />
					{/each}
				</div>

				<!-- Row 2: Organization status distribution -->
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:flex-1 xl:min-h-0 lg:gap-4">
					<StatusDistributionCard
						title="Organization Status — Pre Approval"
						data={preApprovalStatus}
						totalLabel="Pre-Approval"
						showAmount={false}
						class="min-h-72 xl:min-h-0"
					/>
					<StatusDistributionCard
						title="Organization Status — Post Approval"
						data={postApprovalStatus}
						// totalLabel="Post-Approval"
						showAmount={false}
						chartType="radial"
						class="min-h-72 xl:min-h-0"
					/>
				</div>

				<!-- Row 3: Trend analytics -->
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:flex-1 xl:min-h-0 lg:gap-4">
					<TrendAreaCard
						title="Organization Registration Trend"
						description="Last 30 days"
						data={registrationTrend}
						valueLabel="Registrations"
						color="var(--chart-1)"
						class="min-h-64 xl:min-h-0"
					/>
					<TrendAreaCard
						title="Organization Activation Trend"
						description="Last 30 days"
						data={activationTrend}
						valueLabel="Activations"
						color="var(--chart-3)"
						class="min-h-64 xl:min-h-0"
					/>
				</div>
			</Tabs.Content>

			<Tabs.Content value="collections">
				<CollectionsTab />
			</Tabs.Content>

			<Tabs.Content value="disbursements">
				<DisbursementsTab />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>
