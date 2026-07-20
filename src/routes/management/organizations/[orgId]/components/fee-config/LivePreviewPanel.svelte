<script lang="ts">
	import { Input } from '$lib/components/reusable';
	import { calculateFeePreview, formatCurrency, formatLivePreviewPath } from '$lib/fee-config';
	import type {
		FeePreviewBreakdown,
		FeeSlabRow,
		PaymentPathSelection
	} from '$lib/fee-config/types';

	let {
		selection,
		testGrossAmount = $bindable('50000'),
		chargesSlabs,
		commissionSlabs,
		partnerSlabs
	}: {
		selection: PaymentPathSelection;
		testGrossAmount?: string;
		chargesSlabs: FeeSlabRow[];
		commissionSlabs: FeeSlabRow[];
		partnerSlabs: FeeSlabRow[];
	} = $props();

	const grossAmount = $derived(Number(testGrossAmount) || 0);

	const preview = $derived.by((): FeePreviewBreakdown => {
		return calculateFeePreview(grossAmount, chargesSlabs, commissionSlabs, partnerSlabs);
	});

	const pathBreadcrumb = $derived(formatLivePreviewPath(selection));
</script>

<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
	<div class="border-b border-border px-5 py-4">
		<h2 class="text-sm font-semibold text-card-foreground">Live preview</h2>
		<p class="mt-1 text-xs text-muted-foreground">
			Updates as fields change — base rates only, no GST.
		</p>
	</div>

	<div class="space-y-5 p-5">
		<p class="font-mono text-sm text-primary tabular-nums">{pathBreadcrumb}</p>

		<label class="block space-y-2">
			<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Test gross amount (₹)
			</span>
			<Input
				inputmode="decimal"
				bind:value={testGrossAmount}
				class="font-mono text-lg tabular-nums"
				aria-label="Test gross amount"
			/>
		</label>

		<ul class="space-y-3 text-sm">
			<li class="flex items-start justify-between gap-3">
				<div>
					<p class="text-foreground">Gross amount</p>
				</div>
				<p class="font-mono text-foreground tabular-nums">{formatCurrency(preview.grossAmount)}</p>
			</li>
			<li class="flex items-start justify-between gap-3">
				<div>
					<p class="text-foreground">Gateway fee (charges)</p>
					{#if preview.gatewayFee}
						<p class="text-xs text-muted-foreground">{preview.gatewayFee.rateLabel}</p>
					{/if}
				</div>
				<p class="font-mono text-destructive tabular-nums">
					{preview.gatewayFee ? `−${formatCurrency(preview.gatewayFee.amount)}` : '—'}
				</p>
			</li>
			<li class="flex items-start justify-between gap-3">
				<div>
					<p class="text-foreground">Pipeline fee (commission)</p>
					{#if preview.commissionFee}
						<p class="text-xs text-muted-foreground">{preview.commissionFee.rateLabel}</p>
					{/if}
				</div>
				<p class="font-mono text-destructive tabular-nums">
					{preview.commissionFee ? `−${formatCurrency(preview.commissionFee.amount)}` : '—'}
				</p>
			</li>
			<li class="flex items-start justify-between gap-3">
				<div>
					<p class="text-foreground">Partner fee</p>
					{#if preview.partnerFee}
						<p class="text-xs text-muted-foreground">{preview.partnerFee.rateLabel}</p>
					{/if}
				</div>
				<p class="font-mono text-destructive tabular-nums">
					{preview.partnerFee ? `−${formatCurrency(preview.partnerFee.amount)}` : '—'}
				</p>
			</li>
		</ul>

		<div class="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Net amount</p>
			<p class="mt-1 font-mono text-2xl font-semibold text-primary tabular-nums">
				{formatCurrency(preview.netAmount)}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				{preview.retainedPercent.toFixed(2)}% retained
			</p>
		</div>
	</div>
</section>
