<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Undo } from '$lib/assets/icons';
	import {
		DetailPageLayout,
		DetailSummaryCard,
		Details,
		PaymentRefundsTable,
		PaymentStatusBadge,
		Timeline,
		type DetailSection
	} from '$lib/components/transactions/collections';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const payment = $derived(data.payment);

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

	const totalFees = $derived(
		payment
			? parseAmount(payment.processingFee) +
					parseAmount(payment.gatewayFee) +
					parseAmount(payment.gatewayGst) +
					parseAmount(payment.partnerFee) +
					parseAmount(payment.partnerGst)
			: 0
	);

	const totalRefunded = $derived(
		data.refunds
			.filter((refund) => refund.refundStatus === 'completed')
			.reduce((total, refund) => total + parseAmount(refund.refundAmount), 0)
	);

	const detailSections = $derived<DetailSection[]>(
		payment
			? [
					{
						title: 'Details',
						rows: [
							{ label: 'Payment ID', value: payment.txnId, copyable: true, mono: true },
							{
								label: 'Order ID',
								value: payment.orderId,
								copyable: payment.orderId !== '—',
								mono: true,
								link:
									payment.orderId !== '—'
										? {
												path: '/merchant/transactions/collections/orders/[orderId]',
												params: { orderId: payment.orderId }
											}
										: undefined
							},
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
										},
										...(totalRefunded > 0
											? [
													{
														label: 'Completed refunds',
														value: `−${formatAmount(totalRefunded)}`,
														variant: 'negative' as const
													}
												]
											: [])
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
	<DetailPageLayout onBack={() => goto(resolve('/merchant/transactions/collections/payments'))}>
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
			<Details sections={detailSections} flat />
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
			<p class="mb-3 text-xs text-muted-foreground">
				Refund history is connected. Issuing refunds requires the refund creation API.
			</p>
			<Button class="w-full" disabled>
				<Undo class="size-4" />
				Issue refund
			</Button>
		{/snippet}
	</DetailPageLayout>
{/if}
