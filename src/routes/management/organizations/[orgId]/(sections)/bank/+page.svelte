<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
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
		maskAccountNumber,
		previewPath
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

	let bankAccounts = $state(untrack(() => cloneOrganization(organization.bankAccounts)));
	let lastOrgId = $state(untrack(() => organization.id));
	let expandedRowId = $state<string | null>(null);
	let deleteAccountId = $state<string | null>(null);
	let bankDraft = $state<OrganizationBankAccount>(emptyBankDraft());
	let fieldErrors = $state<Record<string, string>>({});
	let saving = $state(false);

	$effect(() => {
		if (organization.id !== lastOrgId) {
			bankAccounts = cloneOrganization(organization.bankAccounts);
			lastOrgId = organization.id;
			expandedRowId = null;
			deleteAccountId = null;
			bankDraft = emptyBankDraft();
			fieldErrors = {};
		}
	});

	const adjacent = $derived(getAdjacentFlowSteps('bank'));
	const accountPendingDelete = $derived(
		bankAccounts.find((account) => account.id === deleteAccountId) ?? null
	);
	const isAddingNew = $derived(expandedRowId === NEW_ROW_ID);

	function clearFieldError(key: string) {
		if (!fieldErrors[key]) return;
		const next = { ...fieldErrors };
		delete next[key];
		fieldErrors = next;
	}

	function persistBanks() {
		organization.bankAccounts = cloneOrganization(bankAccounts);
	}

	function navigateAfterSave(href: string) {
		persistBanks();
		goto(resolve(href as '/'));
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
			navigateAfterSave(adjacent.next.href(orgId));
			return;
		}
		navigateAfterSave(previewPath(orgId));
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

	async function addBankViaApi() {
		const response = await fetch(
			resolve('/api/management/onboard/organization/[orgId]/bank', { orgId }),
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accountHolderName: bankDraft.accountHolderName,
					accountNumber: bankDraft.accountNumber,
					ifscCode: bankDraft.ifscCode,
					bankName: bankDraft.bankName || deriveBankNameFromIfsc(bankDraft.ifscCode),
					branch: bankDraft.branch,
					accountType: bankDraft.accountType,
					status: bankDraft.status
				})
			}
		);

		const payload: unknown = await response.json().catch(() => null);
		const message =
			payload &&
			typeof payload === 'object' &&
			'message' in payload &&
			typeof payload.message === 'string'
				? payload.message
				: `Request failed (${response.status})`;

		if (!response.ok) {
			throw new Error(message);
		}

		const accountId =
			payload &&
			typeof payload === 'object' &&
			'accountId' in payload &&
			typeof payload.accountId === 'string' &&
			payload.accountId.trim()
				? payload.accountId.trim()
				: payload &&
					  typeof payload === 'object' &&
					  'accountId' in payload &&
					  typeof payload.accountId === 'number' &&
					  Number.isFinite(payload.accountId)
					? String(payload.accountId)
					: null;

		return { message, accountId };
	}

	async function updateBankViaApi(accountId: string) {
		const response = await fetch(
			resolve('/api/management/onboard/organization/[orgId]/bank/[accountId]', {
				orgId,
				accountId
			}),
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accountHolderName: bankDraft.accountHolderName,
					accountNumber: bankDraft.accountNumber,
					ifscCode: bankDraft.ifscCode,
					bankName: bankDraft.bankName || deriveBankNameFromIfsc(bankDraft.ifscCode),
					branch: bankDraft.branch,
					accountType: bankDraft.accountType,
					status: bankDraft.status
				})
			}
		);

		const payload: unknown = await response.json().catch(() => null);
		const message =
			payload &&
			typeof payload === 'object' &&
			'message' in payload &&
			typeof payload.message === 'string'
				? payload.message
				: `Request failed (${response.status})`;

		if (!response.ok) {
			throw new Error(message);
		}

		return message;
	}

	async function saveBankDraft() {
		if (saving) return;

		fieldErrors = validateBankAccount({
			accountHolderName: bankDraft.accountHolderName,
			accountNumber: bankDraft.accountNumber,
			ifscCode: bankDraft.ifscCode,
			bankName: bankDraft.bankName || deriveBankNameFromIfsc(bankDraft.ifscCode),
			branch: bankDraft.branch,
			accountType: bankDraft.accountType,
			status: bankDraft.status
		});

		const validationError = firstValidationError(fieldErrors);
		if (validationError) {
			toast.error('Please fix the highlighted fields', { description: validationError });
			return;
		}

		const normalizedIfsc = bankDraft.ifscCode.trim().toUpperCase();
		const bankName = bankDraft.bankName || deriveBankNameFromIfsc(normalizedIfsc);

		if (isAddingNew) {
			saving = true;
			try {
				const { message, accountId } = await addBankViaApi();
				const localId = accountId ?? `bank-${Date.now()}`;
				bankAccounts = [
					...bankAccounts,
					{
						...bankDraft,
						id: localId,
						ifscCode: normalizedIfsc,
						bankName
					}
				];
				persistBanks();
				expandedRowId = null;
				bankDraft = emptyBankDraft();
				fieldErrors = {};
				toast.success('Bank account added', { description: message });
			} catch (error) {
				toast.error('Failed to add bank account', {
					description:
						error instanceof Error ? error.message : 'Something went wrong. Please try again.'
				});
			} finally {
				saving = false;
			}
			return;
		}

		const accountId = bankDraft.id;
		if (!accountId) {
			toast.error('Missing bank account id', {
				description: 'This account cannot be updated because it has no API account id.'
			});
			return;
		}

		saving = true;
		try {
			const message = await updateBankViaApi(accountId);
			const normalized = {
				...bankDraft,
				id: accountId,
				ifscCode: normalizedIfsc,
				bankName
			};

			const existingIndex = bankAccounts.findIndex((account) => account.id === accountId);
			if (existingIndex >= 0) {
				bankAccounts[existingIndex] = normalized;
				bankAccounts = [...bankAccounts];
			}

			persistBanks();
			expandedRowId = null;
			bankDraft = emptyBankDraft();
			fieldErrors = {};
			toast.success('Bank account updated', { description: message });
		} catch (error) {
			toast.error('Failed to update bank account', {
				description:
					error instanceof Error ? error.message : 'Something went wrong. Please try again.'
			});
		} finally {
			saving = false;
		}
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

{#snippet textField(
	label: string,
	value: string,
	onChange: (value: string) => void,
	errorKey: string,
	placeholder = ''
)}
	{@const error = fieldErrors[errorKey]}
	<label class="space-y-2">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
		<Input
			type="text"
			{value}
			aria-invalid={error ? 'true' : undefined}
			class={cn(error && 'border-destructive focus-visible:ring-destructive/30')}
			oninput={(event) => {
				clearFieldError(errorKey);
				onChange((event.currentTarget as HTMLInputElement).value);
			}}
			{placeholder}
		/>
		{#if error}
			<p class="text-xs text-destructive">{error}</p>
		{/if}
	</label>
{/snippet}

{#snippet bankForm(title: string)}
	<div class="space-y-4">
		<p class="text-sm font-semibold">{title}</p>
		<div class="grid gap-4 md:grid-cols-2">
			{@render textField(
				'Account Holder Name',
				bankDraft.accountHolderName,
				(value) => {
					bankDraft.accountHolderName = value;
				},
				'accountHolderName'
			)}
			{@render textField(
				'Account Number',
				bankDraft.accountNumber,
				(value) => {
					bankDraft.accountNumber = value;
				},
				'accountNumber'
			)}
			{@render textField(
				'IFSC Code',
				bankDraft.ifscCode,
				(value) => {
					bankDraft.ifscCode = value;
					bankDraft.bankName = deriveBankNameFromIfsc(value);
				},
				'ifscCode'
			)}
			{@render textField(
				'Branch',
				bankDraft.branch,
				(value) => {
					bankDraft.branch = value;
				},
				'branch'
			)}
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
					>Account type</span
				>
				<Dropdown
					class={cn('w-full', fieldErrors.accountType && 'border-destructive')}
					value={bankDraft.accountType}
					options={bankAccountTypeOptions}
					placeholder="Select account type"
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
					class={cn('w-full', fieldErrors.status && 'border-destructive')}
					value={bankDraft.status}
					options={bankStatusOptions}
					placeholder="Select status"
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
			<Button variant="ghost" onclick={cancelBankForm} disabled={saving}>Cancel</Button>
			<Button onclick={saveBankDraft} disabled={saving}>
				<Check class="size-4" />
				{saving ? 'Saving…' : 'Save account'}
			</Button>
		</div>
	</div>
{/snippet}

<div class="space-y-6">
	<div>
		<h2 class="text-base font-semibold">Bank details</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Add at least one active account before approval.
		</p>
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
					{@render bankForm('Add bank account')}
				</div>
			{/if}

			{#each bankAccounts as account (account.id)}
				<div class="rounded-xl border border-border/60 p-4">
					{#if expandedRowId === account.id}
						{@render bankForm('Edit bank account')}
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
		<Button onclick={goNext} disabled={saving}>
			{adjacent.next?.key === 'review' || !adjacent.next ? 'Review & approve' : 'Next step'}
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
