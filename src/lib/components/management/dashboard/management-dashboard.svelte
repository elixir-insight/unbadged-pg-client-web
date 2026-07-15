<script lang="ts">
	import { Download, Landmark, RefreshCw, UserPlus } from '$lib/assets/icons';
	import ActionCenterCard from './action-center-card.svelte';
	import type { QuickAction } from './quick-actions.svelte';
	import PipelineStatusCard, {
		type OnboardingStage,
		type OrgProfileStatusItem
	} from './pipeline-status-card.svelte';
	import CollectionsTab from './collections-tab.svelte';
	import DisbursementsTab from './disbursements-tab.svelte';
	import * as Tabs from '$lib/components/ui/tabs';

	let {
		userName = 'Linda'
	}: {
		userName?: string;
	} = $props();

	let activeTab = $state<'overview' | 'collections' | 'disbursements'>('overview');

	const quickActions: QuickAction[] = [
		{
			id: 'new-org',
			label: 'New organization',
			description: 'Start onboarding a merchant',
			icon: UserPlus,
			href: '/management/onboarding/create-organization'
		},
		{
			id: 'settlements',
			label: 'View settlements',
			description: "Check today's payout schedule",
			icon: Landmark,
			href: '/management/settlements'
		},
		{
			id: 'export',
			label: 'Export report',
			description: 'Download MTD performance summary',
			icon: Download,
			href: '/management/reports'
		}
	];

	const onboardingStages: OnboardingStage[] = [
		{ stage: 'In review', count: 210, color: 'var(--chart-1)' },
		{ stage: 'Remarked', count: 340, color: 'var(--chart-2)' },
		{ stage: 'In progress', count: 380, color: 'var(--chart-3)' },
		{ stage: 'Approved', count: 235, color: 'var(--chart-4)' }
	];
	const totalInPipeline = onboardingStages.reduce((sum, stage) => sum + stage.count, 0);

	const orgProfileStatus: OrgProfileStatusItem[] = [
		{ status: 'Active', count: 66, percentage: 66, color: 'var(--chart-1)' },
		{ status: 'On hold', count: 24, percentage: 24, color: 'var(--chart-2)' },
		{ status: 'Inactive', count: 10, percentage: 10, color: 'var(--chart-4)' }
	];
</script>

<div class="flex h-full min-h-0 flex-col">
	<Tabs.Root bind:value={activeTab} class="flex h-full min-h-0 flex-col">
		<!-- Sticky header: greeting, subtitle, tabs -->
		<div class="flex shrink-0 flex-col gap-4 pb-4">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-[clamp(1.125rem,3vw,1.25rem)] font-bold text-foreground">
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
			<Tabs.Content value="overview" class="flex min-h-0 flex-col gap-6">
				<div class="grid min-h-0 grid-cols-1 gap-6 md:grid-cols-2 xl:max-h-[min(48vh,720px)]">
					<PipelineStatusCard
						{onboardingStages}
						{totalInPipeline}
						{orgProfileStatus}
						class="min-h-80 md:min-h-0"
					/>
					<ActionCenterCard {quickActions} class="min-h-70 md:min-h-0" />
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
