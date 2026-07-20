<script lang="ts">
	import { Modal, Button, Input } from '$lib/components/reusable';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		refundableAmount: string;
		customerName: string;
		onconfirm?: (amount: string, remarks: string) => void | Promise<void>;
	}

	let { open = $bindable(false), refundableAmount, customerName, onconfirm }: Props = $props();

	function parseAmount(s: string): number {
		return parseFloat(s.replace(/[₹,]/g, '')) || 0;
	}

	const maxRefundable = $derived(parseAmount(refundableAmount));

	let amount = $state('');
	let remarks = $state('');
	let isSubmitting = $state(false);

	let amountError = $state('');
	let remarksError = $state('');

	$effect(() => {
		if (open) {
			amount = refundableAmount.replace(/[₹,]/g, '');
			remarks = '';
			amountError = '';
			remarksError = '';
			isSubmitting = false;
		}
	});

	function validateAmount(val: string): string {
		const n = parseFloat(val);
		if (!val || isNaN(n)) return 'Enter a valid amount';
		if (n <= 0) return 'Amount must be greater than ₹0';
		if (n > maxRefundable) return `Cannot exceed refundable amount of ₹${maxRefundable.toFixed(2)}`;
		return '';
	}

	function validateRemarks(val: string): string {
		if (!val.trim()) return 'Remarks are required';
		if (val.trim().length < 5) return 'Remarks must be at least 5 characters';
		return '';
	}

	async function handleSubmit() {
		amountError = validateAmount(amount);
		remarksError = validateRemarks(remarks);
		if (amountError || remarksError) return;

		isSubmitting = true;
		await onconfirm?.(amount, remarks);
		isSubmitting = false;
		open = false;
	}

	const amountNum = $derived(parseFloat(amount) || 0);
	const isPartial = $derived(amountNum > 0 && amountNum < maxRefundable);
	const refundLabel = $derived(isPartial ? 'Partial refund' : 'Full refund');
</script>

<Modal bind:open title="Initiate Refund" description="Refund to {customerName}">
	<div class="flex flex-col gap-5">
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<label for="refund-amount" class="text-sm font-medium text-foreground">
					Refund amount
				</label>
				{#if amountNum > 0}
					<span
						class={cn(
							'rounded-full px-2 py-0.5 text-xs font-medium',
							isPartial
								? 'bg-warning/15 text-warning-foreground'
								: 'bg-success/15 text-success-foreground'
						)}
					>
						{refundLabel}
					</span>
				{/if}
			</div>
			<div class="relative">
				<span
					class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
				>
					₹
				</span>
				<Input
					id="refund-amount"
					type="number"
					min="0.01"
					step="0.01"
					max={maxRefundable}
					bind:value={amount}
					oninput={() => (amountError = '')}
					class={cn('pl-7', amountError && 'border-destructive focus-visible:ring-destructive/20')}
					placeholder="0.00"
				/>
			</div>
			{#if amountError}
				<p class="text-xs text-destructive">{amountError}</p>
			{/if}
			<button
				type="button"
				class="self-start text-xs text-primary hover:underline"
				onclick={() => {
					amount = maxRefundable.toFixed(2);
					amountError = '';
				}}
			>
				Use max ({refundableAmount})
			</button>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="refund-remarks" class="text-sm font-medium text-foreground">
				Remarks <span class="text-destructive">*</span>
			</label>
			<textarea
				id="refund-remarks"
				bind:value={remarks}
				oninput={() => (remarksError = '')}
				rows={3}
				placeholder="Reason for refund (e.g. customer request, duplicate payment…)"
				class={cn(
					'w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
					remarksError && 'border-destructive focus-visible:ring-destructive/20'
				)}></textarea>
			{#if remarksError}
				<p class="text-xs text-destructive">{remarksError}</p>
			{/if}
		</div>
	</div>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" class="w-full sm:w-auto" onclick={() => (open = false)}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={isSubmitting} class="w-full sm:w-auto">
				{#if isSubmitting}
					<span
						class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></span>
					Processing…
				{:else}
					Confirm refund
				{/if}
			</Button>
		</div>
	{/snippet}
</Modal>
