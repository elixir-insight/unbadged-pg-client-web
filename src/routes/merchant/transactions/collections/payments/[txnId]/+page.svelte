<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Undo } from '$lib/assets/icons';
	import { getPayinPaymentDetail } from '$lib/data/payin-order-mock';
	import {
		DetailPageLayout,
		DetailSummaryCard,
		Details,
		PaymentRefundsTable,
		PaymentStatusBadge,
		RefundModal,
		Timeline,
		type DetailSection
	} from '$lib/components/transactions/collections';
	import type { PayinPaymentStatus, PayinRefundDetail } from '$lib/types/payin';
	import { toast } from '$lib/components/reusable';

	const txnId = $derived(page.params.txnId ?? '');
	const payment = $derived(getPayinPaymentDetail(txnId));

	let refundModalOpen = $state(false);

	const displayStatus = $derived<PayinPaymentStatus>(
		(payment?.refunds?.length ?? 0) > 0 ? 'refunded' : (payment?.paymentStatus ?? 'pending')
	);

	const createdAt = $derived(
		payment?.paymentTimeline[0]
			? new Date(payment.paymentTimeline[0].timestampMs).toLocaleString('en-IN', {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					hour: 'numeric',
					minute: '2-digit'
				})
			: '—'
	);

	function parseFee(s: string | undefined): number {
		return parseFloat((s ?? '').replace(/[₹,]/g, '')) || 0;
	}

	function neg(s: string): string {
		return `−${s}`;
	}

	function formatMethodChannel(method: string, channel: string): string {
		const mode = channel.split('_').pop() ?? channel;
		return `${method} · ${mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase()}`;
	}

	function formatFee(value: number): string {
		return `₹${value.toFixed(2)}`;
	}

	async function handleRefund(amount: string, remarks: string) {
		await new Promise((r) => setTimeout(r, 1000));
		toast.success(`Refund of ₹${parseFloat(amount).toFixed(2)} initiated successfully`, {
			description: `Remarks: ${remarks}`
		});
	}

	function totalRefunded(refunds: PayinRefundDetail[] | undefined): string {
		if (!refunds?.length) return '₹0.00';
		const total = refunds.reduce(
			(sum, r) => sum + parseFloat(r.refundAmount.replace(/[₹,]/g, '')),
			0
		);
		return `₹${total.toFixed(2)}`;
	}

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
								copyable: true,
								mono: true,
								link: {
									path: '/merchant/transactions/collections/orders/[orderId]',
									params: { orderId: payment.orderId }
								}
							},
							{ label: 'Attempt', value: String(payment.attemptNumber) },
							{ label: 'Customer', value: payment.customerName, bold: true },
							{
								label: 'Payment method',
								value: formatMethodChannel(payment.paymentMethod, payment.paymentChannel)
							},
							{ label: 'Payer VPA', value: payment.payerVpa || '—', mono: true },
							{ label: 'Bank pipeline', value: payment.bankPipelineCode, mono: true },
							{ label: 'UTR', value: payment.utr || '—', mono: true, copyable: !!payment.utr },
							{
								label: 'RRN',
								value: payment.bankRRN || '—',
								mono: true,
								copyable: !!payment.bankRRN
							}
						]
					},
					...(payment.paymentStatus === 'success' && payment.refundableAmount
						? [
								{
									title: 'Fees & Settlement',
									rows: [
										{ label: 'Transaction amount', value: payment.transactionAmount },
										{
											label: 'Processing fee',
											value: neg(
												formatFee(
													parseFee(payment.processingFee) +
														parseFee(payment.gatewayFee) +
														parseFee(payment.gatewayGst) +
														parseFee(payment.partnerFee) +
														parseFee(payment.partnerGst)
												)
											),
											variant: 'negative' as const
										},
										{
											label: 'Net settlement',
											value: payment.refundableAmount,
											variant: 'positive' as const,
											bold: true
										},
										...(payment.refunds?.length
											? [
													{
														label: 'Total refunded',
														value: neg(totalRefunded(payment.refunds)),
														variant: 'negative' as const
													}
												]
											: [])
									]
								}
							]
						: []),
					...(payment.refunds?.length
						? [
								{
									title: 'Refunds',
									rows: payment.refunds.flatMap((refund) => [
										{ label: 'Refund ID', value: refund.refundId, copyable: true, mono: true },
										{ label: 'Amount', value: refund.refundAmount },
										{
											label: 'Type',
											value: refund.refundType.charAt(0).toUpperCase() + refund.refundType.slice(1)
										},
										{
											label: 'Status',
											value:
												refund.refundStatus.charAt(0).toUpperCase() + refund.refundStatus.slice(1)
										},
										{ label: 'Speed', value: refund.refundSpeed },
										{ label: 'Remark', value: refund.remark }
									])
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
			<p class="text-xs text-muted-foreground">No record found for ID: {txnId}</p>
		</div>
	</div>
{:else}
	<DetailPageLayout onBack={() => goto(resolve('/merchant/transactions/collections/payments'))}>
		{#snippet summary()}
			<DetailSummaryCard
				amount={payment.transactionAmount}
				{createdAt}
				subtitle={payment.customerName}
			>
				{#snippet statusBadge()}
					<PaymentStatusBadge status={displayStatus} />
				{/snippet}
			</DetailSummaryCard>
		{/snippet}

		{#snippet details()}
			<Details sections={detailSections} flat />
			{#if payment.refunds?.length}
				<div class="mt-5 border-t border-border pt-5">
					<p class="mb-3 text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
						Refund history
					</p>
					<PaymentRefundsTable refunds={payment.refunds} />
				</div>
			{/if}
		{/snippet}

		{#snippet timeline()}
			<Timeline entries={payment.paymentTimeline} />
		{/snippet}

		{#snippet sidebarActions()}
			<p class="mb-3 text-xs text-muted-foreground">
				Issue a full or partial refund for this captured payment.
			</p>
			<Button
				class="w-full"
				onclick={() => (refundModalOpen = true)}
				disabled={!payment.refundableAmount || payment.paymentStatus !== 'success'}
			>
				<Undo class="size-4" />
				Issue refund
			</Button>
		{/snippet}
	</DetailPageLayout>
{/if}

{#if payment?.refundableAmount}
	<RefundModal
		bind:open={refundModalOpen}
		refundableAmount={payment.refundableAmount}
		customerName={payment.customerName}
		onconfirm={handleRefund}
	/>
{/if}
