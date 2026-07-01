<script lang="ts">
	import type { SettlementStatus } from '$lib/data/partnerSettlementsDummyData';
	import { STATUS_CONFIG } from '$lib/data/partnerSettlementsDummyData';
	import { cn } from '$lib/utils';

	let { status }: { status: SettlementStatus } = $props();

	const config = $derived(STATUS_CONFIG[status]);
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
		config.badgeClass
	)}
>
	{config.label}
</span>
