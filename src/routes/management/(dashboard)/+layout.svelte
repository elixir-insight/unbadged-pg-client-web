<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Tabs from '$lib/components/ui/tabs';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const userName = $derived(merchantSession.session?.merchantName ?? 'User');

	const tabPaths = {
		overview: resolve('/management'),
		collections: resolve('/management/collections'),
		disbursements: resolve('/management/disbursements')
	} as const;

	type TabValue = keyof typeof tabPaths;

	const activeTab = $derived<TabValue>(
		(Object.keys(tabPaths) as TabValue[]).find((tab) => tabPaths[tab] === page.url.pathname) ??
			'overview'
	);

	function handleValueChange(value: string) {
		goto(tabPaths[value as TabValue]);
	}
</script>

<div class="flex h-full min-h-0 flex-col">
	<Tabs.Root
		value={activeTab}
		onValueChange={handleValueChange}
		class="flex h-full min-h-0 flex-col"
	>
		<!-- Sticky header: greeting, subtitle, tabs -->

		<div class="flex shrink-0 flex-col gap-3">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="min-w-0">
					<h1 class="text-lg font-bold whitespace-nowrap text-foreground">
						Welcome, {userName}
					</h1>
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
		<div class="-mx-3 min-h-0 flex-1 overflow-y-auto px-3 pt-1 pb-3">
			<Tabs.Content value={activeTab} class="h-full min-h-0">
				{@render children()}
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>
