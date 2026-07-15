<script lang="ts">
	import { cn } from '$lib/utils';

	// Shared by the settlement-details expandable order row and the payment-
	// detail screen — payment-level fees don't carry a rate, so it's optional.
	interface FeeBreakdownLike {
		rate?: number;
		processingFee: number;
		gst: number;
		totalFee: number;
	}

	let {
		breakdown,
		currency,
		class: className
	}: {
		breakdown: FeeBreakdownLike;
		currency: Intl.NumberFormat;
		class?: string;
	} = $props();

	const rows = $derived(
		[
			breakdown.rate !== undefined
				? { label: 'Processing rate', value: `${breakdown.rate}%` }
				: null,
			{ label: 'Processing fee', value: currency.format(breakdown.processingFee) },
			{ label: 'GST', value: currency.format(breakdown.gst) },
			{ label: 'Total fee', value: currency.format(breakdown.totalFee), bold: true }
		].filter((r) => r !== null)
	);
</script>

<div class={cn('grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4', className)}>
	{#each rows as row (row.label)}
		<div class="flex flex-col gap-0.5">
			<span class="text-xs text-muted-foreground">{row.label}</span>
			<span
				class={cn(
					'font-mono text-sm',
					row.bold ? 'font-semibold text-foreground' : 'text-foreground'
				)}
			>
				{row.value}
			</span>
		</div>
	{/each}
</div>
