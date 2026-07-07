<script lang="ts">
	import { Drawer, Button, Chip, Tabs } from '$lib/components/reusable';
	import type { TabItem } from '$lib/components/reusable';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Undo } from '$lib/assets/icons';
	import type { AuditEvent, PayinTransaction } from '$lib/data/payin-transactions-mock';
	import { isRefundEligible } from '$lib/data/payin-transactions-mock';
	import { statusVariant, statusLabel } from './status';
	import PayinDetailSections, { type DetailSection } from './detail-sections.svelte';
	import PayinAuditTrail from './audit-trail.svelte';

	interface Props {
		open?: boolean;
		transaction: PayinTransaction | null;
		auditEvents: AuditEvent[];
		loading?: boolean;
		notFound?: boolean;
		onRefund: (t: PayinTransaction) => void;
	}

	let {
		open = $bindable(false),
		transaction,
		auditEvents,
		loading = false,
		notFound = false,
		onRefund
	}: Props = $props();

	let activeTab = $state('details');

	const fmt = (n: number) =>
		'₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const eligible = $derived(transaction ? isRefundEligible(transaction) : false);

	const detailSections = $derived<DetailSection[]>(
		transaction
			? [
					{
						title: 'Transaction Information',
						rows: [
							{ label: 'Transaction ID', value: transaction.id, copyable: true, mono: true },
							{
								label: 'Gateway Txn ID',
								value: transaction.gatewayTxnId,
								copyable: true,
								mono: true
							},
							{
								label: 'Client Order ID',
								value: transaction.clientOrderId,
								copyable: true,
								mono: true
							},
							{ label: 'CRN', value: transaction.crn, copyable: true, mono: true },
							{
								label: 'UTR',
								value: transaction.utr ?? 'NIL',
								copyable: !!transaction.utr,
								mono: true
							}
						]
					},
					{
						title: 'Payment Information',
						rows: [
							{ label: 'Payer Name', value: transaction.payerName, bold: true },
							{ label: 'Amount', value: fmt(transaction.amount), bold: true },
							{ label: 'Transaction Type', value: transaction.transactionType },
							{ label: 'Transaction Date', value: transaction.transactionDate },
							{ label: 'Status', value: statusLabel(transaction.status) }
						]
					},
					{
						title: 'Fees & Taxes',
						rows: [
							{
								label: 'Processing Fee',
								value: fmt(transaction.fees.processingFee),
								variant: 'negative'
							},
							{
								label: 'Gateway Fee',
								value: fmt(transaction.fees.gatewayFee),
								variant: 'negative'
							},
							{ label: 'GST', value: fmt(transaction.fees.gst), variant: 'negative' }
						]
					},
					...(transaction.refund.status !== 'none'
						? [
								{
									title: 'Refund Information',
									rows: [
										{ label: 'Refund Status', value: transaction.refund.status },
										{ label: 'Refund Amount', value: fmt(transaction.refund.amount) },
										{ label: 'Refund Date', value: transaction.refund.date ?? '—' }
									]
								}
							]
						: []),
					...(transaction.dispute.status !== 'none'
						? [
								{
									title: 'Dispute Information',
									rows: [
										{ label: 'Dispute Status', value: transaction.dispute.status },
										{ label: 'Reason', value: transaction.dispute.reason ?? '—' },
										{ label: 'Raised Date', value: transaction.dispute.raisedDate ?? '—' },
										{ label: 'Resolved Date', value: transaction.dispute.resolvedDate ?? '—' }
									]
								}
							]
						: []),
					...(transaction.chargeback.status !== 'none'
						? [
								{
									title: 'Chargeback Information',
									rows: [
										{ label: 'Chargeback Status', value: transaction.chargeback.status },
										{ label: 'Reason', value: transaction.chargeback.reason ?? '—' },
										{ label: 'Raised Date', value: transaction.chargeback.raisedDate ?? '—' },
										{ label: 'Resolved Date', value: transaction.chargeback.resolvedDate ?? '—' }
									]
								}
							]
						: [])
				]
			: []
	);
</script>

{#snippet detailsContent()}
	{#if loading}
		<div class="flex flex-col gap-3 py-2">
			{#each Array.from({ length: 4 }, (_, i) => i) as i (i)}
				<Skeleton class="h-16 w-full rounded-lg" />
			{/each}
		</div>
	{:else}
		<PayinDetailSections sections={detailSections} />
	{/if}
{/snippet}

{#snippet auditContent()}
	{#if loading}
		<div class="flex flex-col gap-3 py-2">
			{#each Array.from({ length: 3 }, (_, i) => i) as i (i)}
				<Skeleton class="h-14 w-full rounded-lg" />
			{/each}
		</div>
	{:else}
		<PayinAuditTrail events={auditEvents} />
	{/if}
{/snippet}

<Drawer bind:open direction="right" title="Transaction Details">
	{#if notFound}
		<div
			class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-card py-16 text-center"
		>
			<p class="text-sm font-medium text-foreground">Transaction not found</p>
			<p class="text-xs text-muted-foreground">
				This transaction does not exist or is not owned by the selected merchant.
			</p>
		</div>
	{:else}
		<div
			class="mb-4 flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-card p-4"
		>
			<div class="min-w-0">
				{#if loading}
					<Skeleton class="mb-2 h-6 w-32" />
					<Skeleton class="h-4 w-24" />
				{:else if transaction}
					<p class="truncate text-2xl font-bold tracking-tight text-foreground">
						{fmt(transaction.amount)}
					</p>
					<p class="mt-1 truncate text-sm text-muted-foreground">{transaction.payerName}</p>
				{/if}
			</div>
			{#if transaction && !loading}
				<Chip variant={statusVariant(transaction.status)} class="shrink-0">
					{statusLabel(transaction.status)}
				</Chip>
			{/if}
		</div>

		<Tabs
			bind:value={activeTab}
			tabs={[
				{ value: 'details', label: 'Details', content: detailsContent },
				{ value: 'audit', label: 'Audit Trail', content: auditContent }
			] as TabItem[]}
		/>
	{/if}

	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			{#if transaction && eligible && !loading}
				<Button onclick={() => onRefund(transaction)}>
					<Undo class="size-4" />
					Initiate Refund
				</Button>
			{/if}
			<Button variant="outline" onclick={() => (open = false)}>Close</Button>
		</div>
	{/snippet}
</Drawer>
