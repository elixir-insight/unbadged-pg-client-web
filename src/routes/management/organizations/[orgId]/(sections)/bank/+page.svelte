<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Button, Chip, Dropdown, Input, Modal } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { Check, Landmark, Pencil, Plus, Trash2 } from '$lib/assets/icons';
	import type { AccountType, BankAccountStatus, OrganizationBankAccount } from '$lib/data/mockData';
	import { cn } from '$lib/utils';
	import {
		ACCOUNT_STATUS_VALUES,
		ACCOUNT_TYPE_VALUES,
		firstValidationError,
		validateBankAccount
	} from '$lib/validation/organization-bank';
	import {
		cloneOrganization,
		createChipSnippet,
		deriveBankNameFromIfsc,
		getAdjacentFlowSteps,
		flowStepHref,
		maskAccountNumber,
		type FlowStepKey
	} from '../../helpers';

	const NEW_ROW_ID = 'new';

	const accountTypeLabels: Record<AccountType, string> = {
		SAVINGS: 'Savings',
		CURRENT: 'Current',
		NODAL: 'Nodal',
		ESCROW: 'Escrow',
		FOREIGN_CURRENCY: 'Foreign currency'
	};

	const accountStatusLabels: Record<BankAccountStatus, string> = {
		ACTIVE: 'Active',
		ON_HOLD: 'On hold',
		INACTIVE: 'Inactive',
		BLOCKED: 'Blocked',
		CLOSED: 'Closed'
	};

	const bankAccountTypeOptions: DropdownOption[] = ACCOUNT_TYPE_VALUES.map((value) => ({
		value,
		label: accountTypeLabels[value]
	}));

	const bankStatusOptions: DropdownOption[] = ACCOUNT_STATUS_VALUES.map((value) => ({
		value,
		label: accountStatusLabels[value]
	}));

	function emptyBankDraft(): OrganizationBankAccount {
		return {
			id: '',
			accountHolderName: '',
			accountNumber: '',
			ifscCode: '',
			bankName: 'HDFC Bank',
			branch: '',
			accountType: 'CURRENT',
			status: 'ACTIVE'
		};
	}

	let { data } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);
	const bankAccountsLoadError = $derived(data.bankAccountsLoadError);

	let bankAccounts = $state(untrack(() => cloneOrganization(data.bankAccounts)));
	let lastOrgId = $state(untrack(() => organization.id));
	let expandedRowId = $state<string | null>(null);
	let deleteAccountId = $state<string | null>(null);
	let bankDraft = $state<OrganizationBankAccount>(emptyBankDraft());
	let fieldErrors = $state<Record<string, string>>({});
	let saving = $state(false);
	let navigating = $state(false);

	$effect(() => {
		const nextAccounts = data.bankAccounts;
		const currentOrgId = organization.id;

		if (currentOrgId !== lastOrgId) {
			bankAccounts = cloneOrganization(nextAccounts);
			lastOrgId = currentOrgId;
			expandedRowId = null;
			deleteAccountId = null;
			bankDraft = emptyBankDraft();
			fieldErrors = {};
		} else if (expandedRowId === null && !saving) {
			bankAccounts = cloneOrganization(nextAccounts);
		}

		data.organization.bankAccounts = cloneOrganization(nextAccounts);
	});

	const adjacent = $derived(getAdjacentFlowSteps('bank'));
	const accountPendingDelete = $derived(
		bankAccounts.find((account) => account.id === deleteAccountId) ?? null
	);

	function clearFieldError(key: string) {
		if (!fieldErrors[key]) return;
		const next = { ...fieldErrors };
		delete next[key];
		fieldErrors = next;
	}

	function persistBanks() {
		organization.bankAccounts = cloneOrganization(bankAccounts);
	}

	function navigateAfterSave(step: FlowStepKey) {
		persistBanks();
		navigating = true;
		goto(resolve(flowStepHref(orgId, step) as '/'));
	}

	function goNext() {
		if (expandedRowId !== null) {
			toast.error('Finish editing the bank account', {
				description: 'Save or cancel the open bank form before continuing.'
			});
			return;
		}

		if (!bankAccounts.some((account) => account.status === 'ACTIVE')) {
			toast.error('Add an active bank account', {
				description: 'At least one ACTIVE account is required before continuing.'
			});
			return;
		}

		if (adjacent.next) {
			navigateAfterSave(adjacent.next.key);
			return;
		}
		navigateAfterSave('review');
	}

	function prepareBankAdd() {
		fieldErrors = {};
		bankDraft = emptyBankDraft();
		expandedRowId = NEW_ROW_ID;
	}

	function prepareBankEdit(account: OrganizationBankAccount) {
		fieldErrors = {};
		bankDraft = cloneOrganization(account);
		expandedRowId = account.id;
	}

	function cancelBankForm() {
		expandedRowId = null;
		bankDraft = emptyBankDraft();
		fieldErrors = {};
	}

	function createBankEnhance(isCreate: boolean): SubmitFunction {
		return ({ cancel }) => {
			const normalizedIfsc = bankDraft.ifscCode.trim().toUpperCase();
			const bankName = bankDraft.bankName || deriveBankNameFromIfsc(normalizedIfsc);

			fieldErrors = validateBankAccount({
				accountHolderName: bankDraft.accountHolderName,
				accountNumber: bankDraft.accountNumber,
				ifscCode: bankDraft.ifscCode,
				bankName,
				branch: bankDraft.branch,
				accountType: bankDraft.accountType,
				status: bankDraft.status
			});

			const validationError = firstValidationError(fieldErrors);
			if (validationError) {
				toast.error('Please fix the highlighted fields', { description: validationError });
				cancel();
				return;
			}

			if (!isCreate && !bankDraft.id) {
				toast.error('Missing bank account id', {
					description: 'This account cannot be updated because it has no API account id.'
				});
				cancel();
				return;
			}

			saving = true;
			return async ({ result, update }) => {
				saving = false;

				if (result.type === 'failure') {
					const message =
						result.data &&
						typeof result.data === 'object' &&
						'message' in result.data &&
						typeof result.data.message === 'string'
							? result.data.message
							: 'Something went wrong. Please try again.';
					toast.error(isCreate ? 'Failed to add bank account' : 'Failed to update bank account', {
						description: message
					});
					await update({ reset: false });
					return;
				}

				if (result.type === 'success') {
					const message =
						result.data &&
						typeof result.data === 'object' &&
						'message' in result.data &&
						typeof result.data.message === 'string'
							? result.data.message
							: isCreate
								? 'Bank account added successfully'
								: 'Bank account updated successfully';

					if (isCreate) {
						const accountId =
							result.data &&
							typeof result.data === 'object' &&
							'accountId' in result.data &&
							(typeof result.data.accountId === 'string' ||
								typeof result.data.accountId === 'number')
								? String(result.data.accountId)
								: `bank-${Date.now()}`;

						bankAccounts = [
							...bankAccounts,
							{
								...bankDraft,
								id: accountId,
								ifscCode: normalizedIfsc,
								bankName
							}
						];
						toast.success('Bank account added', { description: message });
					} else {
						const normalized = {
							...bankDraft,
							id: bankDraft.id,
							ifscCode: normalizedIfsc,
							bankName
						};
						const existingIndex = bankAccounts.findIndex((account) => account.id === bankDraft.id);
						if (existingIndex >= 0) {
							bankAccounts[existingIndex] = normalized;
							bankAccounts = [...bankAccounts];
						}
						toast.success('Bank account updated', { description: message });
					}

					persistBanks();
					expandedRowId = null;
					bankDraft = emptyBankDraft();
					fieldErrors = {};
					await invalidate('org-bank-accounts');
				}

				await update({ reset: false });
			};
		};
	}

	function deleteSelectedBank() {
		if (!deleteAccountId) return;
		bankAccounts = bankAccounts.filter((account) => account.id !== deleteAccountId);
		persistBanks();
		if (expandedRowId === deleteAccountId) {
			expandedRowId = null;
			bankDraft = emptyBankDraft();
		}
		deleteAccountId = null;
	}
</script>

{#snippet bankForm(title: string, isCreate: boolean)}
	<form
		method="POST"
		action={isCreate ? '?/createAccount' : '?/updateAccount'}
		use:enhance={createBankEnhance(isCreate)}
		class="space-y-4"
	>
		<p class="text-sm font-semibold">{title}</p>
		{#if !isCreate}
			<input type="hidden" name="accountId" value={bankDraft.id} />
		{/if}
		<input
			type="hidden"
			name="bankName"
			value={bankDraft.bankName || deriveBankNameFromIfsc(bankDraft.ifscCode)}
		/>
		<div class="grid gap-4 md:grid-cols-2">
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
					>Account Holder Name</span
				>
				<Input
					name="accountHolderName"
					type="text"
					value={bankDraft.accountHolderName}
					disabled={saving}
					aria-invalid={fieldErrors.accountHolderName ? 'true' : undefined}
					class={cn(
						fieldErrors.accountHolderName && 'border-destructive focus-visible:ring-destructive/30'
					)}
					oninput={(event) => {
						clearFieldError('accountHolderName');
						bankDraft.accountHolderName = (event.currentTarget as HTMLInputElement).value;
					}}
				/>
				{#if fieldErrors.accountHolderName}
					<p class="text-xs text-destructive">{fieldErrors.accountHolderName}</p>
				{/if}
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
					>Account Number</span
				>
				<Input
					name="accountNumber"
					type="text"
					value={bankDraft.accountNumber}
					disabled={saving}
					aria-invalid={fieldErrors.accountNumber ? 'true' : undefined}
					class={cn(
						fieldErrors.accountNumber && 'border-destructive focus-visible:ring-destructive/30'
					)}
					oninput={(event) => {
						clearFieldError('accountNumber');
						bankDraft.accountNumber = (event.currentTarget as HTMLInputElement).value;
					}}
				/>
				{#if fieldErrors.accountNumber}
					<p class="text-xs text-destructive">{fieldErrors.accountNumber}</p>
				{/if}
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
					>IFSC Code</span
				>
				<Input
					name="ifscCode"
					type="text"
					value={bankDraft.ifscCode}
					disabled={saving}
					aria-invalid={fieldErrors.ifscCode ? 'true' : undefined}
					class={cn(fieldErrors.ifscCode && 'border-destructive focus-visible:ring-destructive/30')}
					oninput={(event) => {
						clearFieldError('ifscCode');
						const value = (event.currentTarget as HTMLInputElement).value;
						bankDraft.ifscCode = value;
						bankDraft.bankName = deriveBankNameFromIfsc(value);
					}}
				/>
				{#if fieldErrors.ifscCode}
					<p class="text-xs text-destructive">{fieldErrors.ifscCode}</p>
				{/if}
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Branch</span
				>
				<Input
					name="branch"
					type="text"
					value={bankDraft.branch}
					disabled={saving}
					aria-invalid={fieldErrors.branch ? 'true' : undefined}
					class={cn(fieldErrors.branch && 'border-destructive focus-visible:ring-destructive/30')}
					oninput={(event) => {
						clearFieldError('branch');
						bankDraft.branch = (event.currentTarget as HTMLInputElement).value;
					}}
				/>
				{#if fieldErrors.branch}
					<p class="text-xs text-destructive">{fieldErrors.branch}</p>
				{/if}
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
					>Account type</span
				>
				<Dropdown
					name="accountType"
					class={cn('w-full', fieldErrors.accountType && 'border-destructive')}
					value={bankDraft.accountType}
					options={bankAccountTypeOptions}
					placeholder="Select account type"
					disabled={saving}
					onValueChange={(value) => {
						clearFieldError('accountType');
						bankDraft.accountType = value as AccountType;
					}}
				/>
				{#if fieldErrors.accountType}
					<p class="text-xs text-destructive">{fieldErrors.accountType}</p>
				{/if}
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</span
				>
				<Dropdown
					name="status"
					class={cn('w-full', fieldErrors.status && 'border-destructive')}
					value={bankDraft.status}
					options={bankStatusOptions}
					placeholder="Select status"
					disabled={saving}
					onValueChange={(value) => {
						clearFieldError('status');
						bankDraft.status = value as BankAccountStatus;
					}}
				/>
				{#if fieldErrors.status}
					<p class="text-xs text-destructive">{fieldErrors.status}</p>
				{/if}
			</label>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button type="button" variant="ghost" onclick={cancelBankForm} disabled={saving}
				>Cancel</Button
			>
			<Button type="submit" disabled={saving}>
				<Check class="size-4" />
				{saving ? 'Saving…' : 'Save account'}
			</Button>
		</div>
	</form>
{/snippet}

<div class="space-y-6">
	<div>
		<h2 class="text-base font-semibold">Bank details</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Add at least one active account before approval.
		</p>
		{#if bankAccountsLoadError}
			<p class="mt-2 text-sm text-destructive">
				Could not load bank accounts: {bankAccountsLoadError}
			</p>
		{/if}
	</div>

	{#if bankAccounts.length === 0 && expandedRowId !== NEW_ROW_ID}
		<div class="rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center">
			<Landmark class="mx-auto mb-3 size-8 text-muted-foreground" />
			<p class="text-sm font-medium">No bank accounts yet</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Add a verified current account to proceed with approval.
			</p>
			<Button class="mt-4" onclick={prepareBankAdd}>
				<Plus class="size-4" />
				Add Bank Account
			</Button>
		</div>
	{:else}
		<div class="space-y-3">
			{#if expandedRowId === NEW_ROW_ID}
				<div class="rounded-xl border border-border/60 p-4">
					{@render bankForm('Add bank account', true)}
				</div>
			{/if}

			{#each bankAccounts as account (account.id)}
				<div class="rounded-xl border border-border/60 p-4">
					{#if expandedRowId === account.id}
						{@render bankForm('Edit bank account', false)}
					{:else}
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div class="space-y-2">
								<div class="flex flex-wrap items-center gap-2">
									<p class="text-sm font-semibold">{account.accountHolderName}</p>
									<Chip
										variant={account.status === 'ACTIVE' ? 'success' : 'secondary'}
										children={createChipSnippet(accountStatusLabels[account.status])}
									/>
								</div>
								<p class="text-sm text-muted-foreground">
									{maskAccountNumber(account.accountNumber)} | {account.bankName} | {account.branch}
								</p>
								<p class="text-xs text-muted-foreground">
									IFSC {account.ifscCode} | {accountTypeLabels[account.accountType]}
								</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="icon-sm"
									aria-label="Edit bank account"
									onclick={() => prepareBankEdit(account)}
								>
									<Pencil class="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									class="text-destructive hover:bg-destructive/10 hover:text-destructive"
									aria-label="Delete bank account"
									onclick={() => {
										deleteAccountId = account.id;
									}}
								>
									<Trash2 class="size-4" />
								</Button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if expandedRowId !== NEW_ROW_ID}
			<Button variant="outline" onclick={prepareBankAdd}>
				<Plus class="size-4" />
				{bankAccounts.length === 0 ? 'Add Bank Account' : 'Add Another Account'}
			</Button>
		{/if}
	{/if}

	<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
		<Button variant="outline" href="/management/organizations">Cancel</Button>
		<Button onclick={goNext} disabled={saving || navigating}>
			{saving
				? 'Saving…'
				: navigating
					? 'Loading…'
					: adjacent.next?.key === 'review' || !adjacent.next
						? 'Review & approve'
						: 'Next step'}
		</Button>
	</div>
</div>

<Modal
	open={deleteAccountId !== null}
	title="Delete bank account"
	description="This removes the selected bank account from the current local page state."
>
	<p class="text-sm text-muted-foreground">
		Delete {accountPendingDelete?.accountHolderName ?? 'this bank account'}?
	</p>
	{#snippet footer()}
		<div class="flex gap-2">
			<Button variant="ghost" class="flex-1" onclick={() => (deleteAccountId = null)}>Cancel</Button
			>
			<Button variant="destructive" class="flex-1" onclick={deleteSelectedBank}>
				<Trash2 class="size-4" />
				Delete
			</Button>
		</div>
	{/snippet}
</Modal>
