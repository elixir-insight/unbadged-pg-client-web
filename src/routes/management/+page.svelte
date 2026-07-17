<script lang="ts">
	import {
		CollectionsTab,
		DisbursementsTab,
		OverviewTab
	} from '$lib/components/management/dashboard';
	import * as Tabs from '$lib/components/ui/tabs';

	const userName = 'Linda';

	let activeTab = $state<'overview' | 'collections' | 'disbursements'>('overview');
</script>

<div class="flex h-full min-h-0 flex-col">
	<Tabs.Root bind:value={activeTab} class="flex h-full min-h-0 flex-col">
		<!-- Sticky header: greeting, subtitle, tabs -->

		<div class="flex shrink-0 flex-col gap-3">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="min-w-0">
					<h1 class="text-lg font-bold whitespace-nowrap text-foreground">
						Good Morning, {userName} 👋
					</h1>
					<p class="mt-0.5 text-sm text-muted-foreground">
						Here's what's happening with your business today.
					</p>
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
		<div class="min-h-0 flex-1 overflow-y-auto -mx-3 px-3 pt-1 pb-3">
			<Tabs.Content value="overview" class="h-full min-h-0">
				<OverviewTab />
			</Tabs.Content>

			<Tabs.Content value="collections" class="h-full min-h-0">
				<CollectionsTab />
			</Tabs.Content>

			<Tabs.Content value="disbursements" class="h-full min-h-0">
				<DisbursementsTab />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>
