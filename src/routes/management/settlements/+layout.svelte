<script lang="ts">
	import { resolve } from '$app/paths';
	import { Dropdown } from '$lib/components/reusable';
	import {
		getCurrentSettlementMerchantId,
		getSettlementMerchantOptions,
		setSettlementMerchant
	} from './settlement-scope.svelte';

	let { children } = $props();

	const merchantId = $derived(getCurrentSettlementMerchantId());
	const merchantOptions = getSettlementMerchantOptions();
	const listPath = resolve('/management/settlements');
</script>

<div class="flex flex-col gap-4">
	<div
		class="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-end"
	>
		<div class="w-full sm:max-w-xs">
			<p class="mb-1.5 text-xs font-medium text-muted-foreground">Merchant</p>
			<Dropdown
				value={merchantId}
				placeholder="Select merchant"
				disabled={false}
				bordered={true}
				search={true}
				options={merchantOptions}
				onValueChange={(value) => setSettlementMerchant(value, listPath)}
			/>
		</div>
	</div>

	{@render children()}
</div>
