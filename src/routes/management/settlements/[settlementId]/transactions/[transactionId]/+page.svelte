<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowLeft } from '$lib/assets/icons';
	import { Button, CopyButton } from '$lib/components/reusable';
	import TransactionTypeBadge from '../../transaction-type-badge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const transaction = $derived(data.transaction);
	const display = $derived(data.displayTransaction);
	const currency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	const dateFormatter = new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
	const settlementDateLabel = $derived.by(() => {
		if (!transaction.settlementDatetime) return '—';
		const settlementDate = new Date(transaction.settlementDatetime);
		return Number.isNaN(settlementDate.getTime())
			? transaction.settlementDatetime
			: dateFormatter.format(settlementDate);
	});

	function text(value: string | null | undefined): string {
		return value?.trim() || '—';
	}

	function percentage(value: string | null | undefined): string {
		const normalized = value?.trim();
		return normalized ? `${normalized}%` : '—';
	}

	function amount(value: string | null | undefined): number {
		const parsed = Number(value?.replace(/,/g, '').trim());
		return Number.isFinite(parsed) ? parsed : 0;
	}

	function backToSettlement() {
		const detailPath = resolve('/management/settlements/[settlementId]', {
			settlementId: data.settlementId
		});
		const query = page.url.searchParams.toString();
		const href = `${detailPath}${query ? `?${query}` : ''}`;
		goto(resolve(href as '/'));
	}
</script>

{#snippet detailRow(label: string, value: string, copy: boolean, highlight: boolean)}
	<div
		class="flex flex-col gap-1 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center"
	>
		<dt class="text-sm text-muted-foreground sm:w-2/5">{label}</dt>
		<dd
			class="flex min-w-0 items-center gap-2 text-sm font-medium sm:ml-auto {highlight
				? 'font-semibold text-primary tabular-nums'
				: 'text-foreground'}"
		>
			<span class="break-all">{value}</span>
			{#if copy && value !== '—'}
				<CopyButton {value} label={`Copy ${label}`} />
			{/if}
		</dd>
	</div>
{/snippet}

<div class="flex flex-col gap-6">
	<Button
		variant="ghost"
		onclick={backToSettlement}
		class="w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
		aria-label="Go back to settlement details"
	>
		<ArrowLeft class="size-4" />
		Go back
	</Button>

	<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
		<div class="flex flex-col gap-3 p-6">
			<p class="text-3xl font-bold tracking-tight text-foreground">
				{currency.format(display.grossAmount)}
			</p>
			<div class="flex flex-wrap items-center gap-2">
				<TransactionTypeBadge type={display.type} />
				<span class="text-sm text-muted-foreground">{text(transaction.description)}</span>
			</div>
			<p class="text-sm text-muted-foreground">Created on: {settlementDateLabel}</p>
		</div>

		<div class="border-t border-border px-6 py-2">
			<h2 class="pt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				Transaction details
			</h2>
			<dl>
				{@render detailRow('Transaction ID', display.transactionId, true, false)}
				{@render detailRow('Settlement ID', text(transaction.settlementId), true, false)}
				{@render detailRow('Order ID', display.orderId, true, false)}
				{@render detailRow('Organization ID', text(transaction.orgId), true, false)}
				{@render detailRow('Pipeline', display.paymentMode, false, false)}
				{@render detailRow(
					'Gross transaction amount',
					currency.format(display.grossAmount),
					false,
					true
				)}
				{@render detailRow(
					'TDR amount',
					currency.format(amount(transaction.tdrAmount)),
					false,
					true
				)}
				{@render detailRow(
					'Tax on TDR',
					currency.format(amount(transaction.taxOnTdrAmount)),
					false,
					true
				)}
				{@render detailRow(
					'TDR fixed fee',
					currency.format(amount(transaction.tdrFixedFee)),
					false,
					true
				)}
				{@render detailRow('TDR percentage', percentage(transaction.tdrPercent), false, false)}
				{@render detailRow(
					'TDR paid by merchant',
					percentage(transaction.tdrPaidByMerchantPercent),
					false,
					false
				)}
				{@render detailRow(
					'Net settlement amount',
					currency.format(display.netAmount),
					false,
					true
				)}
			</dl>
		</div>
	</section>
</div>
