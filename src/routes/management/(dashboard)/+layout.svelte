<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Tabs from '$lib/components/ui/tabs';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const tabPaths = {
		overview: resolve('/management'),
		collections: resolve('/management/collections')
		// disbursements: resolve('/management/disbursements')
	} as const;

	type TabValue = keyof typeof tabPaths;

	const activeTab = $derived<TabValue>(
		(Object.keys(tabPaths) as TabValue[]).find((tab) => tabPaths[tab] === page.url.pathname) ??
			'overview'
	);

	function handleValueChange(value: string) {
		goto(tabPaths[value as TabValue]);
	}

	// Temporarily hide Disbursements — bounce direct URL hits back to overview.
	$effect(() => {
		if (page.url.pathname === resolve('/management/disbursements')) {
			goto(resolve('/management'));
		}
	});
</script>

<div class="flex h-full min-h-0 flex-col">
	<Tabs.Root
		value={activeTab}
		onValueChange={handleValueChange}
		class="flex h-full min-h-0 flex-col"
	>
		<!-- Sticky header: tabs -->

		<div class="flex shrink-0 flex-col gap-3">
			<Tabs.List variant="line" class="shrink-0">
				<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
				{#if merchantSession.hasPayinAccess()}
					<Tabs.Trigger value="collections">Collections</Tabs.Trigger>
				{/if}
				<!-- {#if merchantSession.hasPayoutAccess()}
					<Tabs.Trigger value="disbursements">Disbursements</Tabs.Trigger>
				{/if} -->
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
