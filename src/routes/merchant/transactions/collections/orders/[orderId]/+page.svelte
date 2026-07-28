<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Chip } from '$lib/components/ui/badge';
	import {
		DetailPageLayout,
		DetailSummaryCard,
		Details,
		OrderStatusBadge,
		RelatedPaymentsTable,
		Timeline,
		type DetailSection
	} from '$lib/components/transactions/collections';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const order = $derived(data.order);

	const detailSections = $derived<DetailSection[]>(
		order
			? [
					{
						title: 'Details',
						rows: [
							{ label: 'Order ID', value: order.orderId, copyable: true, mono: true },
							{
								label: 'Client order ID',
								value: order.clientOrderId,
								copyable: order.clientOrderId !== '—',
								mono: true
							},
							{ label: 'Customer', value: order.customerName, bold: true },
							{ label: 'Email', value: order.customerEmail, mono: true },
							{ label: 'Phone', value: order.customerPhoneNumber, mono: true },
							{ label: 'Expires', value: order.expiresAt },
							{ label: 'Description', value: order.description },
							{ label: 'Status note', value: order.statusDescription },
							...(order.paymentLink
								? [{ label: 'Payment link', value: order.paymentLink, copyable: true, mono: true }]
								: [])
						]
					}
				]
			: []
	);
</script>

{#if !order}
	<div class="flex flex-col gap-4">
		<div
			class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-16 text-center shadow-sm"
		>
			<p class="text-sm font-medium text-foreground">Order not found</p>
			<p class="text-xs text-muted-foreground">
				{data.orderError ?? `No record found for ID: ${data.orderId}`}
			</p>
		</div>
	</div>
{:else}
	<DetailPageLayout onBack={() => goto(resolve('/merchant/transactions/collections/orders'))}>
		{#snippet summary()}
			<DetailSummaryCard
				amount={order.orderAmount}
				createdAt={order.createdAt}
				subtitle={order.customerName !== '—' ? order.customerName : undefined}
			>
				{#snippet statusBadge()}
					<OrderStatusBadge status={order.orderStatus} />
					{#if data.payments.length > 0}
						<Chip variant="outline" class="h-auto rounded-full px-2 py-0.5 text-xs">
							{data.payments.length} attempt{data.payments.length === 1 ? '' : 's'}
						</Chip>
					{/if}
				{/snippet}
			</DetailSummaryCard>
		{/snippet}

		{#snippet details()}
			<Details sections={detailSections} flat />
			<div class="mt-5 border-t border-border pt-5">
				<p class="mb-3 text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
					Related payments
				</p>
				{#if data.paymentsError}
					<p class="text-sm text-destructive">{data.paymentsError}</p>
				{:else}
					<RelatedPaymentsTable
						payments={data.payments}
						paymentDetailPath="/merchant/transactions/collections/payments/[txnId]"
					/>
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
	</DetailPageLayout>
{/if}
