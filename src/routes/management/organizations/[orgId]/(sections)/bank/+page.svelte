<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { Button, Chip, Dropdown, Input, Modal } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { Check, Landmark, Pencil, Plus, Trash2 } from '$lib/assets/icons';
	import type { BankAccountStatus, OrganizationBankAccount } from '$lib/data/mockData';
	import {
		cloneOrganization,
		createChipSnippet,
		deriveBankNameFromIfsc,
		getAdjacentFlowSteps,
		maskAccountNumber,
		previewPath
	} from '../../helpers';

	const NEW_ROW_ID = 'new';

	const bankStatusOptions: DropdownOption[] = [
		{ value: 'Active', label: 'Active' },
		{ value: 'Inactive', label: 'Inactive' }
	];

	function emptyBankDraft(): OrganizationBankAccount {
		return {
			id: '',
			accountHolderName: '',
			accountNumber: '',
			ifscCode: '',
			bankName: 'HDFC Bank',
			branch: '',
			accountType: 'Current',
			status: 'Active'
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
	let draftSaved = $state(false);
	let savedClearTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	$effect(() => {
		if (organization.id !== lastOrgId) {
			bankAccounts = cloneOrganization(organization.bankAccounts);
			lastOrgId = organization.id;
			expandedRowId = null;
			deleteAccountId = null;
			bankDraft = emptyBankDraft();
			clearSavedConfirmation();
		}
	});

	$effect(() => {
		return () => {
			if (savedClearTimer) clearTimeout(savedClearTimer);
		};
	});

	const adjacent = $derived(getAdjacentFlowSteps(organization.category, 'bank'));
	const accountPendingDelete = $derived(
		bankAccounts.find((account) => account.id === deleteAccountId) ?? null
	);

	beforeNavigate(({ to }) => {
		if (!to || to.route.id === '/management/organizations') return;
		persistBanks();
	});

	function clearSavedConfirmation() {
		draftSaved = false;
		if (savedClearTimer) {
			clearTimeout(savedClearTimer);
			savedClearTimer = null;
		}
	}

	function persistBanks() {
		organization.bankAccounts = cloneOrganization(bankAccounts);
	}

	function saveAsDraft() {
		persistBanks();
		draftSaved = true;
		if (savedClearTimer) clearTimeout(savedClearTimer);
		savedClearTimer = setTimeout(() => {
			draftSaved = false;
			savedClearTimer = null;
		}, 3000);
	}

	function navigateAfterSave(href: string) {
		persistBanks();
		goto(resolve(href as '/'));
	}

	function goNext() {
		if (adjacent.next) {
			navigateAfterSave(adjacent.next.href(orgId));
			return;
		}
		navigateAfterSave(previewPath(orgId));
	}

	function prepareBankAdd() {
		clearSavedConfirmation();
		bankDraft = emptyBankDraft();
		expandedRowId = NEW_ROW_ID;
	}

	function prepareBankEdit(account: OrganizationBankAccount) {
		clearSavedConfirmation();
		bankDraft = cloneOrganization(account);
		expandedRowId = account.id;
	}

	function cancelBankForm() {
		expandedRowId = null;
		bankDraft = emptyBankDraft();
	}

	function saveBankDraft() {
		clearSavedConfirmation();
		const accountId = bankDraft.id || `bank-${Date.now()}`;
		const normalized = {
			...bankDraft,
			id: accountId,
			accountType: 'Current' as const,
			bankName: bankDraft.bankName || deriveBankNameFromIfsc(bankDraft.ifscCode)
		};

		const existingIndex = bankAccounts.findIndex((account) => account.id === accountId);
		if (existingIndex >= 0) {
			bankAccounts[existingIndex] = normalized;
			bankAccounts = [...bankAccounts];
		} else {
			bankAccounts = [...bankAccounts, normalized];
		}

		persistBanks();
		expandedRowId = null;
		bankDraft = emptyBankDraft();
	}

	function deleteSelectedBank() {
		clearSavedConfirmation();
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
	placeholder = '',
	type: 'text' | 'email' | 'tel' | 'url' = 'text'
)}
	<label class="space-y-2">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
		<Input
			{type}
			{value}
			oninput={(event) => {
				clearSavedConfirmation();
				onChange((event.currentTarget as HTMLInputElement).value);
			}}
			{placeholder}
		/>
	</label>
{/snippet}

{#snippet bankForm(title: string)}
	<div class="space-y-4">
		<p class="text-sm font-semibold">{title}</p>
		<div class="grid gap-4 md:grid-cols-2">
			{@render textField('Account Holder Name', bankDraft.accountHolderName, (value) => {
				bankDraft.accountHolderName = value;
			})}
			{@render textField('Account Number', bankDraft.accountNumber, (value) => {
				bankDraft.accountNumber = value;
			})}
			{@render textField('IFSC Code', bankDraft.ifscCode, (value) => {
				bankDraft.ifscCode = value;
				bankDraft.bankName = deriveBankNameFromIfsc(value);
			})}
			{@render textField('Branch', bankDraft.branch, (value) => {
				bankDraft.branch = value;
			})}
			<label class="space-y-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</span
				>
				<Dropdown
					class="w-full"
					value={bankDraft.status}
					options={bankStatusOptions}
					placeholder="Select status"
					onValueChange={(value) => {
						clearSavedConfirmation();
						bankDraft.status = value as BankAccountStatus;
					}}
				/>
			</label>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button variant="ghost" onclick={cancelBankForm}>Cancel</Button>
			<Button onclick={saveBankDraft}>
				<Check class="size-4" />
				Save account
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
										variant={account.status === 'Active' ? 'success' : 'secondary'}
										children={createChipSnippet(account.status)}
									/>
								</div>
								<p class="text-sm text-muted-foreground">
									{maskAccountNumber(account.accountNumber)} | {account.bankName} | {account.branch}
								</p>
								<p class="text-xs text-muted-foreground">
									IFSC {account.ifscCode} | {account.accountType}
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
		<div class="flex flex-wrap items-center gap-3">
			{#if draftSaved}
				<span class="text-sm text-muted-foreground">Saved</span>
			{/if}
			<Button variant="outline" onclick={saveAsDraft}>Save as draft</Button>
			<Button onclick={goNext}>
				{adjacent.next?.key === 'review' || !adjacent.next ? 'Review & approve' : 'Next step'}
			</Button>
		</div>
	</div>
</div>

<Modal
	open={deleteAccountId !== null}
	title="Delete bank account"
	description="This mock confirmation removes the selected bank account from the current local page state."
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
