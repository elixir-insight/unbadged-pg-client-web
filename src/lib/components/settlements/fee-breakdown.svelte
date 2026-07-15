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
			{
				label: 'Processing fee',
				value: `−${currency.format(breakdown.processingFee)}`,
				negative: true
			},
			{ label: 'GST', value: `−${currency.format(breakdown.gst)}`, negative: true },
			{
				label: 'Total fee',
				value: `−${currency.format(breakdown.totalFee)}`,
				negative: true,
				bold: true
			}
		].filter((r) => r !== null)
	);
</script>

<div class={cn('flex flex-col gap-2.5 rounded-lg border border-border bg-card p-4', className)}>
	{#each rows as row, i (row.label)}
		{#if row.bold && i > 0}
			<div class="my-1 border-t border-border"></div>
		{/if}
		<div class="flex items-center justify-between gap-4">
			<span
				class={cn('text-sm text-muted-foreground', row.bold && 'font-semibold text-foreground')}
			>
				{row.label}
			</span>
			<span
				class={cn(
					'font-mono',
					row.bold ? 'text-base font-bold' : 'text-sm',
					row.negative ? 'text-destructive' : 'text-foreground'
				)}
			>
				{row.value}
			</span>
		</div>
	{/each}
</div>
