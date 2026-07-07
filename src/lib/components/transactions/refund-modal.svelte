<script lang="ts">
	import { Modal, Button, Input } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import { Undo, AlertCircle } from '$lib/assets/icons';
	import type { PayinTransaction } from '$lib/data/payin-transactions-mock';

	interface Props {
		open?: boolean;
		transaction: PayinTransaction | null;
		onConfirm: (amount: number, remarks: string) => void;
	}

	let { open = $bindable(false), transaction, onConfirm }: Props = $props();

	type RefundKind = 'Full' | 'Partial';
	let refundType = $state<RefundKind>('Full');
	let partialAmount = $state('');
	let remarks = $state('');
	const maxRemarks = 200;

	const fmt = (n: number) =>
		'₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	$effect(() => {
		if (open) {
			refundType = 'Full';
			partialAmount = '';
			remarks = '';
		}
	});

	const maxRefundable = $derived(transaction?.amount ?? 0);
	const partialAmountNum = $derived(Number(partialAmount));
	const partialAmountInvalid = $derived(
		refundType === 'Partial' &&
			partialAmount !== '' &&
			(isNaN(partialAmountNum) || partialAmountNum <= 0 || partialAmountNum > maxRefundable)
	);
	const amountValid = $derived(
		refundType === 'Full' ||
			(partialAmount !== '' &&
				!isNaN(partialAmountNum) &&
				partialAmountNum > 0 &&
				partialAmountNum <= maxRefundable)
	);

	function handleConfirm() {
		if (!transaction || !amountValid) return;
		const amount = refundType === 'Full' ? maxRefundable : partialAmountNum;
		onConfirm(amount, remarks);
	}
</script>

<Modal
	bind:open
	title="Issue Refund"
	description={transaction ? `Process a refund for ${transaction.payerName}` : undefined}
>
	{#if transaction}
		<div class="flex flex-col gap-5">
			<div class="rounded-xl border border-border/50 bg-muted/20 p-4">
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="text-xs text-muted-foreground">Transaction Amount</p>
						<p class="mt-0.5 text-xl font-bold tracking-tight text-foreground">
							{fmt(transaction.amount)}
						</p>
					</div>
					<div class="text-right">
						<p class="text-xs text-muted-foreground">Payee</p>
						<p class="mt-0.5 text-sm font-medium text-foreground">{transaction.payerName}</p>
					</div>
				</div>
				<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span>UTR: <span class="font-mono">{transaction.utr ?? 'NIL'}</span></span>
					<span>CRN: <span class="font-mono">{transaction.crn}</span></span>
				</div>
			</div>

			<div class="space-y-2">
				<p class="text-sm font-medium text-foreground">Refund Type</p>
				<div class="grid grid-cols-2 gap-3">
					{#each ['Full', 'Partial'] as t (t)}
						<label
							class={cn(
								'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-all',
								refundType === t
									? 'border-primary bg-primary/5'
									: 'border-border/60 hover:border-border'
							)}
						>
							<div class="flex items-center justify-between">
								<span class="font-semibold text-foreground">{t} Refund</span>
								<div
									class={cn(
										'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
										refundType === t ? 'border-primary' : 'border-border'
									)}
								>
									{#if refundType === t}
										<div class="size-2 rounded-full bg-primary"></div>
									{/if}
								</div>
							</div>
							<span class="text-xs text-muted-foreground">
								{t === 'Full' ? fmt(transaction.amount) : 'Enter amount'}
							</span>
							<input
								type="radio"
								name="refundType"
								value={t}
								bind:group={refundType}
								class="sr-only"
							/>
						</label>
					{/each}
				</div>

				{#if refundType === 'Partial'}
					<div class="flex flex-col gap-1.5 pt-1">
						<div class="relative">
							<span
								class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
							>
								₹
							</span>
							<Input
								type="number"
								min="0.01"
								max={maxRefundable}
								bind:value={partialAmount}
								placeholder="0.00"
								class={cn(
									'pl-7',
									partialAmountInvalid && 'border-destructive focus-visible:ring-destructive/20'
								)}
							/>
						</div>
						{#if partialAmountInvalid}
							<p class="flex items-center gap-1 text-xs text-destructive">
								<AlertCircle class="size-3" /> Enter an amount between ₹0.01 and {fmt(
									maxRefundable
								)}
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="refund-remarks" class="text-sm font-medium text-foreground">
					Remarks <span class="font-normal text-muted-foreground">(optional)</span>
				</label>
				<textarea
					id="refund-remarks"
					bind:value={remarks}
					maxlength={maxRemarks}
					rows={4}
					placeholder="Reason for refund…"
					class="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				></textarea>
				<p class="text-right text-xs text-muted-foreground/60">
					{maxRemarks - remarks.length} characters remaining
				</p>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" class="w-full sm:w-auto" onclick={() => (open = false)}>
				Cancel
			</Button>
			<Button onclick={handleConfirm} disabled={!amountValid} class="w-full sm:w-auto">
				<Undo class="size-4" />
				Refund
			</Button>
		</div>
	{/snippet}
</Modal>
