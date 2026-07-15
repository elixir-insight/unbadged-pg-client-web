<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { Button, Drawer } from '$lib/components/reusable';
	import FeeBreakdown from '$lib/components/settlements/fee-breakdown.svelte';
	import OrderCell from '$lib/components/settlements/order-cell.svelte';
	import OrderFeeTrigger from '$lib/components/settlements/order-fee-trigger.svelte';
	import NegativeAmount from '$lib/components/settlements/negative-amount.svelte';
	import DepositStatusPanel from './deposit-status-panel.svelte';
	import StatusBadge from '../status-badge.svelte';
	import type { PageData } from './$types';
	import type { SettlementOrder } from '$lib/types/settlement';
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
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	let panelOpen = $state(false);

	// ── Fee breakdown — opened from the chevron in a side drawer rather than an
	// inline expand row, so the orders table can use the shared paginated Table.
	let feeDrawerOpen = $state(false);
	let selectedOrder = $state<SettlementOrder | null>(null);

	function openFeeBreakdown(orderId: string) {
		selectedOrder = settlement.orders.find((o) => o.id === orderId) ?? null;
		feeDrawerOpen = true;
	}

	interface OrderDisplayRow extends Record<string, unknown> {
		_id: string;
		_description: string;
		_adjustedReason?: string;
		amount: string;
		fee: string;
		netAmount: string;
	}

	const orderRows = $derived<OrderDisplayRow[]>(
		settlement.orders.map((o) => ({
			_id: o.id,
			_description: o.description,
			_adjustedReason: o.adjusted?.reason,
			amount: currency.format(o.amount),
			fee: `−${currency.format(o.fee)}`,
			netAmount: currency.format(o.netAmount)
		}))
	);

	const orderColumns: ColumnDef<OrderDisplayRow>[] = [
		{
			accessorKey: '_id',
			header: 'Order',
			cell: (info) =>
				renderComponent(OrderCell, {
					id: info.row.original._id,
					description: info.row.original._description,
					adjustedReason: info.row.original._adjustedReason
				})
		},
		{ accessorKey: 'amount', header: 'Amount' },
		{
			accessorKey: 'fee',
			header: 'Fee',
			cell: (info) => renderComponent(NegativeAmount, { value: info.getValue<string>() })
		},
		{ accessorKey: 'netAmount', header: 'Net Amount' },
		{
			id: 'expand',
			header: '',
			cell: (info) =>
				renderComponent(OrderFeeTrigger, {
					orderId: info.row.original._id,
					onOpen: () => openFeeBreakdown(info.row.original._id)
				})
		}
	];

	let ordersPage = $state(1);
	const ordersPageSize = 5;
	const ordersTotalPages = $derived(
		Math.max(1, Math.ceil(settlement.orders.length / ordersPageSize))
	);
	const pagedOrderRows = $derived(
		orderRows.slice((ordersPage - 1) * ordersPageSize, ordersPage * ordersPageSize)
	);

	const showingText = $derived.by(() => {
		const total = settlement.orders.length;
		if (total === 0) return 'No orders';
		const start = (ordersPage - 1) * ordersPageSize + 1;
		const end = Math.min(ordersPage * ordersPageSize, total);
		return `Showing ${start}–${end} of ${total} orders`;
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
						Gross settlement amount ({settlement.orders.length} order{settlement.orders.length === 1
							? ''
							: 's'})
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
		<!-- <div class="flex items-center justify-between gap-2 p-4">
			<h2 class="text-sm font-semibold text-foreground">Orders in this settlement</h2>
			<span class="text-sm font-medium text-foreground">
				Subtotal (net): {currency.format(orderSubtotalNet)}
			</span>
		</div> -->
		<div class="flex items-center justify-between gap-2 p-4">
			<span class="text-sm text-muted-foreground">{showingText}</span>
			<div class="flex items-center gap-2">
				<Button variant="outline">
					<RefreshCw />
				</Button>
			</div>
		</div>

		<Table
			data={pagedOrderRows}
			columns={orderColumns}
			pageNumber={ordersPage}
			totalPages={ordersTotalPages}
			setPageNumber={(p) => (ordersPage = p)}
			variant="borderless"
		/>

		<!-- {#if settlement.reconciliationGap}
			<p class="border-t border-border p-4 text-xs text-muted-foreground">
				{settlement.reconciliationGap.note}
			</p>
		{/if} -->
	</div>
</div>

<DepositStatusPanel bind:open={panelOpen} {settlement} {currency} {dateTimeFormatter} />

<Drawer
	bind:open={feeDrawerOpen}
	direction="right"
	title="Fee breakdown"
	description={selectedOrder?.id}
>
	{#if selectedOrder}
		<FeeBreakdown breakdown={selectedOrder.feeBreakdown} {currency} />
	{/if}
</Drawer>
