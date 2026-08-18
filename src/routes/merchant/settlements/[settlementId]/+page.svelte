<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { Button, createUrlPagination, Drawer } from '$lib/components/reusable';
	import FeeBreakdown from '$lib/components/settlements/fee-breakdown.svelte';
	import OrderCell from '$lib/components/settlements/order-cell.svelte';
	import OrderFeeTrigger from '$lib/components/settlements/order-fee-trigger.svelte';
	import NegativeAmount from '$lib/components/settlements/negative-amount.svelte';
	import DepositStatusPanel from './deposit-status-panel.svelte';
	import StatusBadge from '../status-badge.svelte';
	import { PaymentStatusBadge } from '$lib/components/transactions/collections';
	import type { PageData } from './$types';
	import type { SettlementOrderRow } from '$lib/server/domains/settlement/mappers/from-api/orders';
	import type { PayinPaymentStatus } from '$lib/types/payin';
	import Table from '$lib/components/reusable/data-table/data-table.svelte';
	import { RefreshCw } from '$lib/assets/icons';

	let { data }: { data: PageData } = $props();
	const settlement = $derived(data.settlement);

	const currency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 2
	});
	const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	let panelOpen = $state(false);
	let refreshing = $state(false);

	const pagination = createUrlPagination({
		defaultLimit: 10,
		total: () => data.ordersPagination.total
	});

	let feeDrawerOpen = $state(false);
	let selectedOrder = $state<SettlementOrderRow | null>(null);

	function openFeeBreakdown(txnId: string) {
		selectedOrder = data.orders.find((order) => order.txnId === txnId) ?? null;
		feeDrawerOpen = true;
	}

	function goToPayment(row: SettlementOrderRow) {
		goto(resolve('/merchant/transactions/collections/payments/[txnId]', { txnId: row.txnId }));
	}

	async function refreshOrders() {
		refreshing = true;
		try {
			await invalidate('settlement-orders:list');
		} finally {
			refreshing = false;
		}
	}

	const orderColumns: ColumnDef<SettlementOrderRow>[] = [
		{
			accessorKey: 'orderId',
			header: 'Order',
			cell: (info) =>
				renderComponent(OrderCell, {
					id: info.row.original.orderId,
					description: info.row.original.description
				})
		},
		{ accessorKey: 'customer', header: 'Customer' },
		{ accessorKey: 'paymentMethod', header: 'Payment Method' },
		{ accessorKey: 'amount', header: 'Amount' },
		{
			accessorKey: 'fee',
			header: 'Fee',
			cell: (info) => renderComponent(NegativeAmount, { value: info.getValue<string>() })
		},
		{ accessorKey: 'netAmount', header: 'Net Amount' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) =>
				renderComponent(PaymentStatusBadge, { status: info.getValue<PayinPaymentStatus>() })
		},
		{
			id: 'expand',
			header: '',
			cell: (info) =>
				renderComponent(OrderFeeTrigger, {
					orderId: info.row.original.txnId,
					onOpen: () => openFeeBreakdown(info.row.original.txnId)
				})
		}
	];

	const transactionCount = $derived(data.ordersPagination.total);

	const showingText = $derived.by(() => {
		if (data.ordersError) return 'Unable to load orders';
		if (transactionCount === 0) return 'No orders';
		return `${pagination.showingText} orders`;
	});
</script>

<div class="flex flex-col gap-6 p-6 sm:p-8 lg:p-4">
	<!-- Amount breakup ledger -->
	<div class="rounded-lg border border-border bg-card p-5 shadow-2xl">
		<div class="mb-4">
			<div class="flex items-center gap-2">
				<h1 class="text-lg font-semibold text-foreground">{settlement.id}</h1>
				<StatusBadge status={settlement.status} />
			</div>
			<p class="mt-1 text-sm text-muted-foreground">
				Settled to {settlement.settledTo.bankName} •••• {settlement.settledTo.accountLast4}
			</p>
		</div>
		<div class="border-t border-border pt-4">
			<h2 class="mb-3 text-sm font-semibold text-foreground">Amount breakup</h2>
			<div class="flex flex-col gap-2.5 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">
						Gross settlement amount ({transactionCount} order{transactionCount === 1 ? '' : 's'})
					</span>
					<span class="font-mono text-foreground">{currency.format(settlement.grossAmount)}</span>
				</div>
				{#if settlement.refundsAndChargebacks > 0}
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Refunds & chargebacks</span>
						<span class="font-mono text-destructive"
							>−{currency.format(settlement.refundsAndChargebacks)}</span
						>
					</div>
				{/if}
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Fees (incl. GST)</span>
					<span class="font-mono text-destructive">−{currency.format(settlement.fees)}</span>
				</div>
				<div class="my-1 border-t border-border"></div>
				<div class="flex items-center justify-between">
					<span class="font-semibold text-foreground">Net settlement amount</span>
					<span class="font-mono text-lg font-bold text-success">
						{currency.format(settlement.netAmount)}
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Orders -->
	<div class="rounded-lg border border-border bg-card shadow-2xl">
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					onclick={refreshOrders}
					disabled={refreshing}
					aria-label="Refresh orders"
				>
					<RefreshCw class={refreshing ? 'animate-spin' : undefined} />
				</Button>
			</div>
		</div>

		{#key `${data.ordersPagination.page}:${data.orders[0]?.txnId ?? 'empty'}:${data.orders.length}`}
			<Table
				data={data.orders}
				columns={orderColumns}
				pageNumber={pagination.currentPage}
				totalPages={pagination.pageCount}
				setPageNumber={pagination.setPage}
				onRowClick={goToPayment}
				getRowAriaLabel={(row) => `View payment ${row.txnId}`}
				variant="borderless"
			/>
		{/key}
	</div>
</div>

<DepositStatusPanel bind:open={panelOpen} {settlement} {currency} {dateTimeFormatter} />

<Drawer
	bind:open={feeDrawerOpen}
	direction="right"
	title="Fee breakdown"
	description={selectedOrder?.orderId}
>
	{#if selectedOrder}
		<FeeBreakdown breakdown={selectedOrder.feeBreakdown} {currency} />
	{/if}
</Drawer>
