<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/reusable';
	import { Clock, TriangleAlert } from '$lib/assets/icons';
	import {
		DetailPageLayout,
		DetailSummaryCard,
		Details,
		PaymentRefundsTable,
		PaymentStatusBadge,
		Timeline,
		type DetailSection
	} from '$lib/components/transactions/collections';
	import {
		getCurrentScope,
		gotoScopedPath,
		scopeQueryString
	} from '$lib/utils/transaction-scope.svelte';
	import { hasDisputeForTransaction } from '$lib/utils/management-disputes';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const scope = $derived(getCurrentScope());
	const scopeQuery = $derived(scopeQueryString(scope));
	const payment = $derived(data.payment);
	let disputeAlreadyRaised = $state(false);

	function parseAmount(value: string): number {
		return Number(value.replace(/[₹,\s]/g, '')) || 0;
	}

	function formatAmount(value: number): string {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 2
		}).format(value);
	}

	function raiseDispute(): void {
		if (!payment || disputeAlreadyRaised) return;

		const params = new URLSearchParams({
			orderId: payment.orderId,
			transactionId: payment.txnId,
			amount: payment.transactionAmount,
			raisedOn: new Date().toISOString()
		});

		goto(resolve(`/management/dispute?${params.toString()}`));
	}

	onMount(() => {
		if (!payment) return;
		disputeAlreadyRaised = hasDisputeForTransaction(payment.txnId);
	});

	const totalFees = $derived(
		payment
			? parseAmount(payment.processingFee) +
					parseAmount(payment.gatewayFee) +
					parseAmount(payment.gatewayGst) +
					parseAmount(payment.partnerFee) +
					parseAmount(payment.partnerGst)
			: 0
	);

	const detailSections = $derived<DetailSection[]>(
		payment
			? [
					{
						title: 'Details',
						rows: [
							{ label: 'Payment ID', value: payment.txnId, copyable: true, mono: true },
							{ label: 'Order ID', value: payment.orderId, copyable: true, mono: true },
							{
								label: 'Client order ID',
								value: payment.clientOrderId,
								copyable: payment.clientOrderId !== '—',
								mono: true
							},
							{
								label: 'Payment method',
								value:
									[payment.paymentMethod, payment.paymentChannel]
										.filter((value) => value !== '—')
										.join(' · ') || '—'
							},
							{ label: 'Payment mode', value: payment.paymentMode },
							{ label: 'Payer VPA', value: payment.payerVpa || '—', mono: true },
							{ label: 'Payee VPA', value: payment.payeeVpa || '—', mono: true },
							{ label: 'Bank pipeline', value: payment.bankPipelineCode, mono: true },
							{ label: 'UTR', value: payment.utr || '—', mono: true, copyable: !!payment.utr },
							{
								label: 'RRN',
								value: payment.bankRrn || '—',
								mono: true,
								copyable: !!payment.bankRrn
							},
							{
								label: 'Settlement ID',
								value: payment.settlementId || '—',
								mono: true,
								copyable: !!payment.settlementId
							},
							{ label: 'Status details', value: payment.statusDescription }
						]
					},
					...(payment.paymentStatus === 'success'
						? [
								{
									title: 'Fees & Settlement',
									rows: [
										{ label: 'Transaction amount', value: payment.transactionAmount },
										{
											label: 'Processing fees',
											value: `−${formatAmount(totalFees)}`,
											variant: 'negative' as const
										},
										{
											label: 'Refundable amount',
											value: payment.refundableAmount,
											variant: 'positive' as const,
											bold: true
										}
									]
								}
							]
						: [])
				]
			: []
	);
</script>

{#if !payment}
	<div class="flex flex-col gap-4">
		<div
			class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-16 text-center shadow-sm"
		>
			<p class="text-sm font-medium text-foreground">Payment not found</p>
			<p class="text-xs text-muted-foreground">
				{data.paymentError ?? `No record found for ID: ${data.payinAttemptId}`}
			</p>
		</div>
	</div>
{:else}
	<DetailPageLayout
		onBack={() => gotoScopedPath('/management/transactions/collections/payments', scope)}
	>
		{#snippet summary()}
			<DetailSummaryCard
				amount={payment.transactionAmount}
				createdAt={payment.createdAt}
				subtitle={payment.clientOrderId !== '—' ? payment.clientOrderId : undefined}
			>
				{#snippet statusBadge()}
					<PaymentStatusBadge status={payment.paymentStatus} />
				{/snippet}
			</DetailSummaryCard>
		{/snippet}

		{#snippet details()}
			<Details sections={detailSections} flat linkQuery={scopeQuery} />
			<div class="mt-5 border-t border-border pt-5">
				<p class="mb-3 text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
					Refund history
				</p>
				{#if data.refundsError}
					<p class="text-sm text-destructive">{data.refundsError}</p>
				{:else}
					<PaymentRefundsTable refunds={data.refunds} />
				{/if}
			</div>
		{/snippet}

		{#snippet timeline()}
			{#if data.timelineError}
				<p class="text-sm text-destructive">{data.timelineError}</p>
			{:else}
				<Timeline entries={data.timeline} />
			{/if}
		{/snippet}

		{#snippet sidebarActions()}
			{#if disputeAlreadyRaised}
				<Button variant="outline" class="w-full" disabled>
					<Clock class="size-4" />
					Dispute in review
				</Button>
			{:else}
				<Button variant="destructive" class="w-full" onclick={raiseDispute}>
					<TriangleAlert class="size-4" />
					Raise a dispute
				</Button>
			{/if}
		{/snippet}
	</DetailPageLayout>
{/if}
