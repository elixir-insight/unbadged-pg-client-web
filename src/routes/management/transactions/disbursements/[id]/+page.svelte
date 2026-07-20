<script lang="ts">
	import { page } from '$app/state';
	import { Chip } from '$lib/components/ui/badge';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowUpFromLine, RefreshCw } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { getPayoutDetail } from '$lib/data/payout-detail-mock';
	import { getCurrentScope } from '$lib/utils/transaction-scope.svelte';
	import {
		DisbursementDetails,
		DisbursementTimeline,
		type DetailSection
	} from '$lib/components/transactions/disbursements';
	import RetryModal from './retry-modal.svelte';
	import { toast } from '$lib/components/reusable';

	const clientOrderId = $derived(page.params.id ?? '');
	const scope = $derived(getCurrentScope());
	const transaction = $derived(getPayoutDetail(clientOrderId, scope));

	let activeTab = $state<'updates' | 'details'>('updates');

	const statusBadgeVariant = $derived<BadgeVariant>(
		transaction?.transactionStatus === 'success'
			? 'success'
			: transaction?.transactionStatus === 'failed'
				? 'error'
				: 'warning'
	);

	const statusLabel = $derived(
		transaction?.transactionStatus === 'success'
			? 'Success'
			: transaction?.transactionStatus === 'failed'
				? 'Failed'
				: 'Pending'
	);

	function parseFee(s: string): number {
		return parseFloat(s.replace(/[₹,]/g, '')) || 0;
	}

	function neg(s: string): string {
		return `−${s}`;
	}

	function formatFee(value: number): string {
		return `₹${value.toFixed(2)}`;
	}

	let retryModalOpen = $state(false);

	async function handleRetry(remarks: string) {
		await new Promise((r) => setTimeout(r, 1000));
		toast.success('Payout retry initiated successfully', {
			description: `Remarks: ${remarks}`
		});
	}

	const detailSections = $derived<DetailSection[]>(
		transaction
			? [
					{
						title: 'Order & Beneficiary',
						rows: [
							{
								label: 'Client Order ID',
								value: transaction.clientOrderId,
								copyable: true,
								mono: true
							},
							{ label: 'CRN', value: transaction.crn, copyable: true, mono: true },
							{ label: 'Name', value: transaction.beneficiaryName, bold: true },
							{ label: 'Email', value: transaction.beneficiaryEmail, mono: true },
							{ label: 'Phone', value: transaction.beneficiaryPhoneNumber, mono: true }
						]
					},
					{
						title: 'Payout & Bank',
						rows: [
							{ label: 'Transaction type', value: transaction.transactionType },
							{
								label: 'UTR',
								value: transaction.utr || '—',
								mono: true,
								copyable: !!transaction.utr
							},
							{ label: 'Bank', value: transaction.bankName },
							{ label: 'Account number', value: transaction.accountNumber, mono: true },
							{ label: 'IFSC', value: transaction.ifsc, mono: true },
							{ label: 'Bank pipeline', value: transaction.bankPipelineCode, mono: true }
						]
					},
					{
						title: 'Fees & Debit',
						rows: [
							{ label: 'Transaction amount', value: transaction.transactionAmount },
							{
								label: 'Processing fee',
								value: neg(
									formatFee(
										parseFee(transaction.processingFee) +
											parseFee(transaction.gatewayFee) +
											parseFee(transaction.gatewayGst)
									)
								),
								variant: 'negative'
							},
							{
								label: 'Net debited',
								value: transaction.netDebited,
								variant: 'positive',
								bold: true
							}
						]
					}
				]
			: []
	);
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between gap-3">
		<h1 class="text-lg font-semibold text-foreground">Transaction Details</h1>
		<Button
			onclick={() => (retryModalOpen = true)}
			disabled={transaction?.transactionStatus !== 'failed'}
		>
			<RefreshCw class="size-4" />
			Retry payout
		</Button>
	</div>

	{#if !transaction}
		<div
			class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-16 text-center shadow-sm"
		>
			<p class="text-sm font-medium text-foreground">Transaction not found</p>
			<p class="text-xs text-muted-foreground">No record found for ID: {clientOrderId}</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
			<div
				class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-5"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground sm:size-11"
					>
						<ArrowUpFromLine class="size-5" />
					</div>
					<div>
						<p class="text-base font-semibold text-foreground">{transaction.beneficiaryName}</p>
						<p class="text-sm text-muted-foreground">Sent</p>
					</div>
				</div>
				<div class="sm:text-right">
					<p class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						{transaction.transactionAmount}
					</p>
					<Chip variant={statusBadgeVariant}>
						{statusLabel}
					</Chip>
				</div>
			</div>

			<div class="border-t border-border"></div>

			<div class="flex items-center justify-between gap-2 px-4 sm:px-6">
				<div class="flex">
					<button
						type="button"
						onclick={() => (activeTab = 'updates')}
						class={cn(
							'-mb-px px-1 pb-3 pt-3.5 text-sm font-medium transition-colors',
							activeTab === 'updates'
								? 'border-b-2 border-primary text-primary'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						Updates
					</button>
					<button
						type="button"
						onclick={() => (activeTab = 'details')}
						class={cn(
							'-mb-px ml-4 px-1 pb-3 pt-3.5 text-sm font-medium transition-colors',
							activeTab === 'details'
								? 'border-b-2 border-primary text-primary'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						Details
					</button>
				</div>
			</div>

			<div class="border-t border-border"></div>

			<div class="px-4 py-5 sm:px-6">
				{#if activeTab === 'updates'}
					<DisbursementTimeline entries={transaction.transactionTimeline} />
				{:else}
					<DisbursementDetails sections={detailSections} />
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if transaction}
	<RetryModal
		bind:open={retryModalOpen}
		beneficiaryName={transaction.beneficiaryName}
		onconfirm={handleRetry}
	/>
{/if}
