<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Chip } from '$lib/components/ui/badge';
	import { getPayinOrderDetail, getPaymentsByOrderId } from '$lib/data/payin-order-mock';
	import { buildOrderTimeline } from '$lib/utils/payin-timeline';
	import Timeline from '../../timeline.svelte';
	import Details, { type DetailSection } from '../../details.svelte';
	import OrderStatusBadge from '../../order-status-badge.svelte';
	import RelatedPaymentsTable from '../../related-payments-table.svelte';
	import DetailPageLayout from '../../detail-page-layout.svelte';
	import DetailSummaryCard from '../../detail-summary-card.svelte';

	const orderId = $derived(page.params.orderId ?? '');
	const order = $derived(getPayinOrderDetail(orderId));
	const payments = $derived(getPaymentsByOrderId(orderId));
	const timelineEntries = $derived(order ? buildOrderTimeline(order, payments) : []);

	const detailSections = $derived<DetailSection[]>(
		order
			? [
					{
						title: 'Details',
						rows: [
							{ label: 'Order ID', value: order.orderId, copyable: true, mono: true },
							{ label: 'CRN', value: order.crn, copyable: true, mono: true },
							{ label: 'Customer', value: order.customerName, bold: true },
							{ label: 'Email', value: order.customerEmail, mono: true },
							{ label: 'Phone', value: order.customerPhoneNumber, mono: true },
							{ label: 'Expires', value: order.expiresAt },
							{ label: 'Description', value: order.clientDescription },
							{ label: 'Status note', value: order.statusDescription }
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
			<p class="text-xs text-muted-foreground">No record found for ID: {orderId}</p>
		</div>
	</div>
{:else}
	<DetailPageLayout onBack={() => goto(resolve('/merchant/transactions/collections/orders'))}>
		{#snippet summary()}
			<DetailSummaryCard
				amount={order.orderAmount}
				createdAt={order.createdAt}
				subtitle={order.customerName}
			>
				{#snippet statusBadge()}
					<OrderStatusBadge status={order.orderStatus} />
					{#if payments.length > 0}
						<Chip variant="outline" class="h-auto rounded-full px-2 py-0.5 text-xs">
							{payments.length} attempt{payments.length === 1 ? '' : 's'}
						</Chip>
					{/if}
				{/snippet}
			</DetailSummaryCard>
		{/snippet}

		{#snippet details()}
			<Details sections={detailSections} flat />
			{#if payments.length > 0}
				<div class="mt-5 border-t border-border pt-5">
					<p class="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
						Related payments
					</p>
					<RelatedPaymentsTable {payments} />
				</div>
			{/if}
		{/snippet}

		{#snippet timeline()}
			<Timeline entries={timelineEntries} />
		{/snippet}
	</DetailPageLayout>
{/if}
