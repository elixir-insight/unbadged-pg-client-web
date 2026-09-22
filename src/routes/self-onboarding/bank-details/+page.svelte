<script lang="ts">
	import { createBankAccount, updateBankAccount } from '$lib/api/onboarding';
	import { Button, Dropdown } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { FieldGrid, FieldRow, InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep, routeSaveError } from '$lib/components/self-onboarding/navigation';
	import {
		bankDetailsAreComplete,
		isValidAccountNumber,
		isValidIfsc
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { getFieldRemark } from '$lib/utils/remarkRouting';

	const ACCOUNT_TYPE_OPTIONS: DropdownOption[] = [
		{ value: 'SAVINGS', label: 'Savings' },
		{ value: 'CURRENT', label: 'Current' }
	];

	let saving = $state(false);
	let saveError = $state('');

	const bank = $derived(onboarding.formData.bankDetails);
	const canContinue = $derived(bankDetailsAreComplete(onboarding.formData));
	const accountTypeRemark = $derived(
		getFieldRemark(onboarding.verifications, 'bankDetails.accountType')
	);

	function digitsOnly(value: string): string {
		return value.replace(/\D/g, '').slice(0, 18);
	}

	async function continueToDirectors() {
		if (!canContinue || saving) return;
		saving = true;
		saveError = '';
		const details = onboarding.formData.bankDetails;
		try {
			if (details.accountId === undefined) {
				const res = await createBankAccount(details);
				onboarding.updateBankDetails({ accountId: res.data?.[0]?.accountId });
			} else {
				await updateBankAccount(details.accountId, details);
			}
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: 'Could not save your bank details. Please try again.';
			saveError = await routeSaveError(message, 3);
			saving = false;
			return;
		}
		saving = false;
		await advanceFromStep(3);
	}
</script>

<StepShell error={saveError}>
	<FieldGrid>
		<FieldRow
			label="Account holder name"
			required
			remarkKey="bankDetails.accountHolderName"
			error={bank.accountHolderName.trim() ? '' : 'Account holder name is required.'}
			value={bank.accountHolderName}
			oninput={(next) => onboarding.updateBankDetails({ accountHolderName: next })}
		/>
		<FieldRow
			label="IFSC code"
			required
			monospace
			maxlength={11}
			remarkKey="bankDetails.ifscCode"
			hint="11 characters, e.g. HDFC0001234."
			error={isValidIfsc(bank.ifscCode) ? '' : 'Enter a valid 11-character IFSC.'}
			value={bank.ifscCode}
			normalize={(next) =>
				next
					.replace(/[^a-zA-Z0-9]/g, '')
					.toUpperCase()
					.slice(0, 11)}
			oninput={(next) => onboarding.updateBankDetails({ ifscCode: next })}
		/>
		<FieldRow
			label="Bank name"
			required
			remarkKey="bankDetails.bankName"
			error={bank.bankName.trim() ? '' : 'Bank name is required.'}
			value={bank.bankName}
			oninput={(next) => onboarding.updateBankDetails({ bankName: next })}
		/>
		<FieldRow
			label="Branch name"
			required
			remarkKey="bankDetails.branchName"
			error={bank.branchName.trim() ? '' : 'Branch name is required.'}
			value={bank.branchName}
			oninput={(next) => onboarding.updateBankDetails({ branchName: next })}
		/>
		<FieldRow
			label="Account number"
			required
			monospace
			secret
			inputmode="numeric"
			autocomplete="off"
			remarkKey="bankDetails.accountNumber"
			error={isValidAccountNumber(bank.accountNumber) ? '' : 'Enter a 9–18 digit account number.'}
			value={bank.accountNumber}
			normalize={digitsOnly}
			oninput={(next) => onboarding.updateBankDetails({ accountNumber: next })}
		/>
		<FieldRow
			label="Confirm account number"
			required
			monospace
			secret
			blockPaste
			inputmode="numeric"
			autocomplete="off"
			error={bank.accountNumber === bank.confirmAccountNumber
				? ''
				: 'Account numbers do not match.'}
			value={bank.confirmAccountNumber}
			normalize={digitsOnly}
			oninput={(next) => onboarding.updateBankDetails({ confirmAccountNumber: next })}
		/>
		<InlineRemark remark={accountTypeRemark} fieldKey="bankDetails.accountType">
			<div class="block min-w-0 space-y-1.5">
				<span class="text-sm font-medium text-foreground">
					Account type <span class="text-destructive">*</span>
				</span>
				<Dropdown
					name="accountType"
					class="w-full"
					ariaLabel="Account type"
					value={bank.accountType}
					options={ACCOUNT_TYPE_OPTIONS}
					placeholder="Select account type"
					onValueChange={(value) => onboarding.updateBankDetails({ accountType: value })}
				/>
			</div>
		</InlineRemark>
	</FieldGrid>

	{#snippet footer()}
		<Button disabled={!canContinue || saving} onclick={continueToDirectors}>
			{saving ? 'Saving…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
