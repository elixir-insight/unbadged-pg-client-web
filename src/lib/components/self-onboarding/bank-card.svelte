<script lang="ts">
	import { Button, Dropdown } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { Trash2 } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import type { BankDetails } from '$lib/types/onboarding';
	import { bankFieldRemark } from '$lib/utils/remarkRouting';
	import FieldGrid from './field-grid.svelte';
	import FieldRow from './field-row.svelte';
	import InlineRemark from './inline-remark.svelte';
	import { isValidAccountNumber, isValidIfsc } from './validation';

	const ACCOUNT_TYPE_OPTIONS: DropdownOption[] = [
		{ value: 'SAVINGS', label: 'Savings' },
		{ value: 'CURRENT', label: 'Current' }
	];

	let {
		bank,
		index,
		showErrors = false,
		removable,
		onupdate,
		onremove
	}: {
		bank: BankDetails;
		index: number;
		showErrors?: boolean;
		/** Hides the remove control — at least one bank account must always remain. */
		removable: boolean;
		onupdate: (index: number, patch: Partial<BankDetails>) => void;
		onremove: (index: number) => void;
	} = $props();

	const remarked = $derived(onboarding.onboardingStatus === 'remarked');
	const holderRemark = $derived(
		bankFieldRemark(onboarding.verifications, bank.accountId, 'accountHolderName')
	);
	const ifscRemark = $derived(
		bankFieldRemark(onboarding.verifications, bank.accountId, 'ifscCode')
	);
	const bankNameRemark = $derived(
		bankFieldRemark(onboarding.verifications, bank.accountId, 'bankName')
	);
	const branchRemark = $derived(
		bankFieldRemark(onboarding.verifications, bank.accountId, 'branchName')
	);
	const accountNumberRemark = $derived(
		bankFieldRemark(onboarding.verifications, bank.accountId, 'accountNumber')
	);
	const accountTypeRemark = $derived(
		bankFieldRemark(onboarding.verifications, bank.accountId, 'accountType')
	);
	const accountTypeLocked = $derived(remarked && !accountTypeRemark);

	function digitsOnly(value: string): string {
		return value.replace(/\D/g, '').slice(0, 18);
	}

	function remarkKeyOr(remark: { key: string } | undefined, fallback: string): string {
		return remark?.key ?? fallback;
	}
</script>

<div class="rounded-xl border border-border p-4">
	<div class="mb-4 flex items-center justify-between gap-3">
		<p class="text-sm font-medium">{bank.bankName || `Bank account ${index + 1}`}</p>
		{#if removable && !remarked}
			<Button
				variant="ghost"
				size="icon-sm"
				class="text-destructive hover:bg-destructive/10 hover:text-destructive"
				aria-label={`Remove bank account ${index + 1}`}
				onclick={() => onremove(index)}
			>
				<Trash2 class="size-4" />
			</Button>
		{/if}
	</div>

	<FieldGrid>
		<FieldRow
			label="Account holder name"
			placeholder="Enter your account holder name"
			required
			remarkKey={remarkKeyOr(holderRemark, 'bankDetails.accountHolderName')}
			error={bank.accountHolderName.trim() ? '' : 'Account holder name is required.'}
			{showErrors}
			value={bank.accountHolderName}
			oninput={(next) => onupdate(index, { accountHolderName: next })}
		/>
		<FieldRow
			label="IFSC code"
			placeholder="Enter your IFSC code"
			required
			monospace
			maxlength={11}
			remarkKey={remarkKeyOr(ifscRemark, 'bankDetails.ifscCode')}
			hint="11 characters, e.g. HDFC0001234."
			error={isValidIfsc(bank.ifscCode) ? '' : 'Enter a valid 11-character IFSC.'}
			{showErrors}
			value={bank.ifscCode}
			normalize={(next) =>
				next
					.replace(/[^a-zA-Z0-9]/g, '')
					.toUpperCase()
					.slice(0, 11)}
			oninput={(next) => onupdate(index, { ifscCode: next })}
		/>
		<FieldRow
			label="Bank name"
			placeholder="Enter your bank name"
			required
			remarkKey={remarkKeyOr(bankNameRemark, 'bankDetails.bankName')}
			error={bank.bankName.trim() ? '' : 'Bank name is required.'}
			{showErrors}
			value={bank.bankName}
			oninput={(next) => onupdate(index, { bankName: next })}
		/>
		<FieldRow
			label="Branch name"
			placeholder="Enter your branch name"
			required
			remarkKey={remarkKeyOr(branchRemark, 'bankDetails.branchName')}
			error={bank.branchName.trim() ? '' : 'Branch name is required.'}
			{showErrors}
			value={bank.branchName}
			oninput={(next) => onupdate(index, { branchName: next })}
		/>
		<FieldRow
			label="Account number"
			placeholder="Enter your account number"
			required
			monospace
			inputmode="numeric"
			autocomplete="off"
			remarkKey={remarkKeyOr(accountNumberRemark, 'bankDetails.accountNumber')}
			error={isValidAccountNumber(bank.accountNumber) ? '' : 'Enter a 9–18 digit account number.'}
			{showErrors}
			value={bank.accountNumber}
			normalize={digitsOnly}
			oninput={(next) => onupdate(index, { accountNumber: next })}
		/>
		<FieldRow
			label="Confirm account number"
			placeholder="Re-enter your account number"
			required
			monospace
			blockPaste
			inputmode="numeric"
			autocomplete="off"
			unlockWith={remarkKeyOr(accountNumberRemark, 'bankDetails.accountNumber')}
			error={bank.accountNumber === bank.confirmAccountNumber
				? ''
				: 'Account numbers do not match.'}
			{showErrors}
			value={bank.confirmAccountNumber}
			normalize={digitsOnly}
			oninput={(next) => onupdate(index, { confirmAccountNumber: next })}
		/>
		<InlineRemark
			remark={accountTypeRemark?.message ?? ''}
			fieldKey={remarkKeyOr(accountTypeRemark, 'bankDetails.accountType')}
		>
			<div class="block min-w-0 space-y-1.5">
				<span class="text-sm font-medium text-foreground">
					Account type <span class="text-destructive">*</span>
				</span>
				<Dropdown
					name="accountType"
					class="w-full"
					ariaLabel="Account type"
					disabled={accountTypeLocked}
					value={bank.accountType}
					options={ACCOUNT_TYPE_OPTIONS}
					placeholder="Select account type"
					onValueChange={(value) => onupdate(index, { accountType: value })}
				/>
			</div>
		</InlineRemark>
	</FieldGrid>
</div>
