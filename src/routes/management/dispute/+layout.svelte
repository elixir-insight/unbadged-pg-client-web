<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Dropdown } from '$lib/components/reusable';
	import { getCurrentDisputeMerchantId, setDisputeMerchant } from './dispute-scope.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const merchantId = $derived(getCurrentDisputeMerchantId(data.merchantOptions));
	const showMerchantDropdown = $derived(page.route.id === '/management/dispute');
	const listPath = resolve('/management/dispute');
</script>

<div class="flex flex-col gap-4">
	{#if showMerchantDropdown}
		<div
			class="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-end"
		>
			<div class="w-full sm:max-w-xs">
				<p class="mb-1.5 text-xs font-medium text-muted-foreground">Merchant</p>
				<Dropdown
					value={merchantId}
					placeholder="Select merchant"
					disabled={data.merchantOptions.length === 0}
					bordered={true}
					search={true}
					options={data.merchantOptions}
					onValueChange={(value) => setDisputeMerchant(value, listPath)}
				/>
				{#if data.merchantsError}
					<p class="mt-1.5 text-xs text-destructive">Unable to load merchants. Please try again.</p>
				{:else if data.merchantOptions.length === 0}
					<p class="mt-1.5 text-xs text-muted-foreground">No merchants are available.</p>
				{/if}
			</div>
		</div>
	{/if}

	{@render children()}
</div>
