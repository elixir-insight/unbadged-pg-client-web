<script lang="ts">
	import type { Beneficiary, TransferMethod } from '../types';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';

	let {
		method,
		beneficiary = $bindable<Beneficiary>({
			name: '',
			accountNumber: '',
			confirmAccountNumber: '',
			ifsc: '',
			bankName: '',
			upiId: ''
		}),
		remarks = $bindable('')
	}: {
		method: TransferMethod | null;
		beneficiary: Beneficiary;
		remarks?: string;
	} = $props();

	const isUpi = $derived(method?.id === 'UPI');

	const accountMismatch = $derived(
		!isUpi &&
			beneficiary.confirmAccountNumber.trim().length > 0 &&
			beneficiary.accountNumber !== beneficiary.confirmAccountNumber
	);
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
	<div class="space-y-2">
		<Label for="beneficiary-name">Beneficiary name</Label>
		<Input id="beneficiary-name" bind:value={beneficiary.name} placeholder="Full legal name" />
	</div>

	{#if isUpi}
		<div class="space-y-2">
			<Label for="beneficiary-upi">UPI ID / VPA</Label>
			<Input id="beneficiary-upi" bind:value={beneficiary.upiId} placeholder="name@upi" />
		</div>
	{:else}
		<div class="space-y-2">
			<Label for="beneficiary-account">Account number</Label>
			<Input
				id="beneficiary-account"
				bind:value={beneficiary.accountNumber}
				placeholder="Enter account number"
				inputmode="numeric"
				autocomplete="off"
			/>
		</div>

		<div class="space-y-2">
			<Label for="beneficiary-account-confirm">Re-enter account number</Label>
			<Input
				id="beneficiary-account-confirm"
				bind:value={beneficiary.confirmAccountNumber}
				placeholder="Re-enter account number"
				inputmode="numeric"
				autocomplete="off"
				aria-invalid={accountMismatch}
				class={cn(accountMismatch && 'border-destructive')}
			/>
			{#if accountMismatch}
				<p class="text-xs text-destructive">Account numbers do not match.</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="beneficiary-ifsc">IFSC code</Label>
			<Input id="beneficiary-ifsc" bind:value={beneficiary.ifsc} placeholder="ABCD0123456" />
		</div>

		<div class="space-y-2">
			<Label for="beneficiary-bank">Bank name</Label>
			<Input id="beneficiary-bank" bind:value={beneficiary.bankName} placeholder="Bank name" />
		</div>
	{/if}

	<div class="space-y-2">
		<Label for="transfer-remarks">Remarks (optional)</Label>
		<Input id="transfer-remarks" bind:value={remarks} placeholder="Payment reference or note" />
	</div>
</div>
