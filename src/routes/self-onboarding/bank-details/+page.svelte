<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/reusable';
	import { BankCard, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep, routeSaveError } from '$lib/components/self-onboarding/navigation';
	import {
		bankAccountsAreComplete,
		bankAccountsAreFilled
	} from '$lib/components/self-onboarding/validation';
	import { Plus } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { getFieldRemark } from '$lib/utils/remarkRouting';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let saving = $state(false);
	let saveError = $state('');
	let attempted = $state(false);

	/** Gates the Continue button — every required field has a value, format not checked yet. */
	const filled = $derived(bankAccountsAreFilled(onboarding.formData));
	const canContinue = $derived(bankAccountsAreComplete(onboarding.formData));
	const accountTypeRemark = $derived(
		getFieldRemark(onboarding.verifications, 'bankDetails.accountType')
	);

	// Reconciles with accounts saved outside this browser session — see
	// hydrateBankAccounts (only fills in when nothing has been entered locally yet).
	$effect(() => {
		onboarding.hydrateBankAccounts(data.bankAccounts);
	});

	function readAccountIds(resultData: unknown): (number | undefined)[] | undefined {
		const ids =
			resultData && typeof resultData === 'object' && 'accountIds' in resultData
				? resultData.accountIds
				: undefined;
		return Array.isArray(ids) ? (ids as (number | undefined)[]) : undefined;
	}

	function actionErrorMessage(data: unknown): string {
		if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
			return data.error;
		}
		return 'Could not save your bank details. Please try again.';
	}

	const onSaveEnhance: SubmitFunction = ({ cancel }) => {
		attempted = true;
		if (!canContinue || saving) {
			cancel();
			return;
		}
		saving = true;
		saveError = '';
		return async ({ result }) => {
			saving = false;
			if (result.type === 'success') {
				const accountIds = readAccountIds(result.data);
				if (accountIds) onboarding.setBankAccountIds(accountIds);
				toast.success('Bank details saved.');
				await advanceFromStep(3);
				return;
			}
			// A partial-save failure still carries whichever accountIds *did* save (see
			// +page.server.ts) — record them now so a retry can't re-create those as duplicates.
			if (result.type === 'failure') {
				const accountIds = readAccountIds(result.data);
				if (accountIds) onboarding.setBankAccountIds(accountIds);
			}
			const message =
				result.type === 'failure'
					? actionErrorMessage(result.data)
					: 'Could not save your bank details. Please try again.';
			toast.error(message);
			saveError = await routeSaveError(message, 3);
		};
	};
</script>

<form id="bank-details-form" method="POST" use:enhance={onSaveEnhance}>
	<input type="hidden" name="payload" value={JSON.stringify(onboarding.formData.bankAccounts)} />
</form>

<StepShell error={saveError}>
	<div class="flex flex-col gap-4">
		{#each onboarding.formData.bankAccounts as bank, index (index)}
			<BankCard
				{bank}
				{index}
				showErrors={attempted}
				removable={onboarding.formData.bankAccounts.length > 1}
				{accountTypeRemark}
				onupdate={(i, patch) => onboarding.updateBankAccount(i, patch)}
				onremove={(i) => onboarding.removeBankAccount(i)}
			/>
		{/each}

		<div>
			<Button variant="outline" size="sm" onclick={() => onboarding.addBankAccount()}>
				<Plus class="size-4" />
				Add bank account
			</Button>
		</div>
	</div>

	{#snippet footer()}
		<Button type="submit" form="bank-details-form" disabled={!filled || saving}>
			{saving ? 'Saving…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
