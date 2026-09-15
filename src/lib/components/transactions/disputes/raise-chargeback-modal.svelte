<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Input, Modal, Textarea, toast } from '$lib/components/reusable';

	interface Props {
		open?: boolean;
		orgId: string;
		disputeId: string;
		bankReference?: string;
		currency?: string;
		principalAmount?: string;
	}

	let {
		open = $bindable(false),
		orgId,
		disputeId,
		bankReference = '',
		currency = 'INR',
		principalAmount = ''
	}: Props = $props();

	let additionalFees = $state('');
	let bankReferenceValue = $state('');
	let chargebackAmount = $state('');
	let currencyValue = $state('INR');
	let notes = $state('');
	let principalAmountValue = $state('');
	let fieldErrors = $state<Record<string, string>>({});
	let submitError = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (!open) return;

		additionalFees = '';
		bankReferenceValue = bankReference.trim();
		chargebackAmount = '';
		currencyValue = currency.trim() || 'INR';
		notes = '';
		principalAmountValue = principalAmount.trim();
		fieldErrors = {};
		submitError = '';
		isSubmitting = false;
	});

	function closeModal(): void {
		open = false;
	}

	function validate(): boolean {
		const errors: Record<string, string> = {};

		if (!bankReferenceValue.trim()) {
			errors.bankReference = 'Bank reference is required';
		}
		if (!chargebackAmount.trim()) {
			errors.chargebackAmount = 'Chargeback amount is required';
		}
		if (!currencyValue.trim()) {
			errors.currency = 'Currency is required';
		}
		if (!principalAmountValue.trim()) {
			errors.principalAmount = 'Principal amount is required';
		}

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(): Promise<void> {
		submitError = '';
		if (!validate()) return;

		if (!orgId.trim() || !disputeId.trim()) {
			submitError = 'Dispute details are required to raise a chargeback';
			return;
		}

		isSubmitting = true;
		try {
			const payload = {
				additionalFees: additionalFees.trim() || '0',
				bankReference: bankReferenceValue.trim(),
				chargebackAmount: chargebackAmount.trim(),
				currency: currencyValue.trim(),
				notes: notes.trim(),
				principalAmount: principalAmountValue.trim()
			};

			const response = await fetch(
				resolve('/api/management/organizations/[orgId]/disputes/[disputeId]/chargebacks', {
					orgId,
					disputeId
				}),
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);

			const body: { message?: string } = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(body.message ?? 'Could not raise chargeback');
			}

			toast.success(body.message ?? 'Chargeback recorded successfully.');
			closeModal();
			await invalidate('management-disputes:detail');
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Could not raise chargeback';
			toast.error('Could not raise chargeback', { description: submitError });
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal
	bind:open
	title="Raise a chargeback"
	description="Record chargeback amounts and bank reference for this dispute."
	class="sm:max-w-lg"
>
	<div class="flex flex-col gap-5">
		<div class="grid gap-5 sm:grid-cols-2">
			<div class="flex flex-col gap-2">
				<label for="chargeback-principal-amount" class="text-sm font-medium text-foreground">
					Principal amount <span class="text-destructive">*</span>
				</label>
				<Input
					id="chargeback-principal-amount"
					bind:value={principalAmountValue}
					inputmode="decimal"
					placeholder="Enter principal amount"
					aria-invalid={Boolean(fieldErrors.principalAmount)}
				/>
				{#if fieldErrors.principalAmount}
					<p class="text-xs text-destructive">{fieldErrors.principalAmount}</p>
				{/if}
			</div>

			<div class="flex flex-col gap-2">
				<label for="chargeback-amount" class="text-sm font-medium text-foreground">
					Chargeback amount <span class="text-destructive">*</span>
				</label>
				<Input
					id="chargeback-amount"
					bind:value={chargebackAmount}
					inputmode="decimal"
					placeholder="Enter chargeback amount"
					aria-invalid={Boolean(fieldErrors.chargebackAmount)}
				/>
				{#if fieldErrors.chargebackAmount}
					<p class="text-xs text-destructive">{fieldErrors.chargebackAmount}</p>
				{/if}
			</div>
		</div>

		<div class="grid gap-5 sm:grid-cols-2">
			<div class="flex flex-col gap-2">
				<label for="chargeback-additional-fees" class="text-sm font-medium text-foreground">
					Additional fees
				</label>
				<Input
					id="chargeback-additional-fees"
					bind:value={additionalFees}
					inputmode="decimal"
					placeholder="Enter additional fees"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label for="chargeback-currency" class="text-sm font-medium text-foreground">
					Currency <span class="text-destructive">*</span>
				</label>
				<Input
					id="chargeback-currency"
					bind:value={currencyValue}
					placeholder="INR"
					aria-invalid={Boolean(fieldErrors.currency)}
				/>
				{#if fieldErrors.currency}
					<p class="text-xs text-destructive">{fieldErrors.currency}</p>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<label for="chargeback-bank-reference" class="text-sm font-medium text-foreground">
				Bank reference <span class="text-destructive">*</span>
			</label>
			<Input
				id="chargeback-bank-reference"
				bind:value={bankReferenceValue}
				placeholder="Enter bank reference"
				aria-invalid={Boolean(fieldErrors.bankReference)}
			/>
			{#if fieldErrors.bankReference}
				<p class="text-xs text-destructive">{fieldErrors.bankReference}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-2">
			<label for="chargeback-notes" class="text-sm font-medium text-foreground">Notes</label>
			<Textarea
				id="chargeback-notes"
				bind:value={notes}
				rows={3}
				placeholder="Add notes for this chargeback"
				class="resize-none"
			/>
		</div>

		{#if submitError}
			<p class="text-xs text-destructive">{submitError}</p>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<Button
				variant="outline"
				class="w-full sm:w-auto"
				onclick={closeModal}
				disabled={isSubmitting}
			>
				Cancel
			</Button>
			<Button class="w-full sm:w-auto" onclick={handleSubmit} disabled={isSubmitting}>
				{#if isSubmitting}
					<span
						class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></span>
					Submitting…
				{:else}
					Raise chargeback
				{/if}
			</Button>
		</div>
	{/snippet}
</Modal>
