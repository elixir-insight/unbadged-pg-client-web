<script lang="ts">
	import { resolve } from '$app/paths';
	import { InsightsMerchantList } from '$lib/components/transaction-insights';

	let { data } = $props();
</script>

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<InsightsMerchantList
		merchants={data.merchants}
		detailPath={(merchantId) =>
			resolve('/merchant/transaction-insights/[merchantId]', { merchantId })}
	/>
</div>
