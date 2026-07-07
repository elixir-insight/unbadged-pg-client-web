<script lang="ts">
	import { Button, Input, toast } from '$lib/components/reusable';
	import DetailPanel from './detail-panel.svelte';
	import DetailField from './detail-field.svelte';
	import DetailFieldGrid from './detail-field-grid.svelte';
	import DetailFieldSpacer from './detail-field-spacer.svelte';
	import type { OrganizationBankAccount } from '$lib/utils/organization-form';
	import { maskAccountNumber } from '$lib/utils/organization-form';
	import { Pencil } from '$lib/assets/icons';

	let {
		accounts = $bindable()
	}: {
		accounts: OrganizationBankAccount[];
	} = $props();

	let editing = $state(false);
	let editingAccountId = $state<number | null>(null);
	let form = $state({
		holderName: '',
		accountNumber: '',
		bankName: '',
		branchName: '',
		ifscCode: ''
	});

	function startEditing(account?: OrganizationBankAccount) {
		if (account) {
			editingAccountId = account.id;
			form = {
				holderName: account.holderName,
				accountNumber: account.accountNumber,
				bankName: account.bankName,
				branchName: account.branchName,
				ifscCode: account.ifscCode
			};
		}
		editing = true;
	}

	function cancelEditing() {
		editing = false;
		editingAccountId = null;
	}

	function saveChanges() {
		if (editingAccountId !== null) {
			accounts = accounts.map((account) =>
				account.id === editingAccountId
					? {
							...account,
							holderName: form.holderName,
							accountNumber: form.accountNumber,
							bankName: form.bankName,
							branchName: form.branchName,
							ifscCode: form.ifscCode
						}
					: account
			);
		}
		editing = false;
		editingAccountId = null;
		toast.success('Bank details updated successfully');
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-foreground">Bank Accounts</h2>
			<p class="text-xs text-muted-foreground">
				{accounts.length} settlement account{accounts.length === 1 ? '' : 's'} on file
			</p>
		</div>
		{#if editing}
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" onclick={cancelEditing}>Cancel</Button>
				<Button size="sm" onclick={saveChanges}>Save</Button>
			</div>
		{/if}
	</div>

	{#if accounts.length === 0}
		<div class="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
			<p class="text-sm text-muted-foreground">No bank accounts linked to this organization.</p>
		</div>
	{:else if editing}
		<DetailPanel>
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="holder-name" class="text-xs font-medium text-muted-foreground"
						>Account Holder</label
					>
					<Input id="holder-name" bind:value={form.holderName} />
				</div>
				<div class="space-y-1.5">
					<label for="bank-name" class="text-xs font-medium text-muted-foreground">Bank Name</label>
					<Input id="bank-name" bind:value={form.bankName} />
				</div>
				<div class="space-y-1.5">
					<label for="account-number" class="text-xs font-medium text-muted-foreground"
						>Account Number</label
					>
					<Input id="account-number" bind:value={form.accountNumber} />
				</div>
				<div class="space-y-1.5">
					<label for="ifsc-code" class="text-xs font-medium text-muted-foreground">IFSC Code</label>
					<Input id="ifsc-code" bind:value={form.ifscCode} />
				</div>
				<div class="space-y-1.5 sm:col-span-2">
					<label for="branch-name" class="text-xs font-medium text-muted-foreground">Branch</label>
					<Input id="branch-name" bind:value={form.branchName} />
				</div>
			</div>
		</DetailPanel>
	{:else}
		<DetailPanel>
			<DetailFieldGrid>
				{#each accounts as account, index (account.id)}
					{#if index > 0}
						<DetailFieldSpacer />
					{/if}
					<DetailField
						label="Account Holder{accounts.length > 1 ? ` ${index + 1}` : ''}"
						value={account.holderName}
					/>
					<DetailField
						label="Account Number{accounts.length > 1 ? ` ${index + 1}` : ''}"
						value={maskAccountNumber(account.accountNumber)}
						mono
					/>
					<DetailField
						label="Bank{accounts.length > 1 ? ` ${index + 1}` : ''}"
						value={account.bankName}
					/>
					<DetailField
						label="Branch{accounts.length > 1 ? ` ${index + 1}` : ''}"
						value={account.branchName}
					/>
					<DetailField
						label="IFSC{accounts.length > 1 ? ` ${index + 1}` : ''}"
						value={account.ifscCode}
						mono
					/>
					<DetailField
						label="Account Type{accounts.length > 1 ? ` ${index + 1}` : ''}"
						value={account.accountType}
					/>
					<div class="flex justify-end pt-1 lg:col-span-2">
						<Button variant="outline" size="sm" onclick={() => startEditing(account)}>
							<Pencil class="size-3.5" />
							Edit{accounts.length > 1 ? ` account ${index + 1}` : ''}
						</Button>
					</div>
				{/each}
			</DetailFieldGrid>
		</DetailPanel>
	{/if}
</div>
