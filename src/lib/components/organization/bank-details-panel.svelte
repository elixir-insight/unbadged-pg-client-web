<script lang="ts">
	import { Button, Input, toast } from '$lib/components/reusable';
	import DetailSection from './detail-section.svelte';
	import DetailField from './detail-field.svelte';
	import type { OrganizationBankAccount } from '$lib/utils/organization-form';
	import { maskAccountNumber } from '$lib/utils/organization-form';
	import { CreditCard, Landmark, Pencil } from '$lib/assets/icons';

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

<div class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-foreground">Bank Accounts</h2>
			<p class="text-xs text-muted-foreground">
				{accounts.length} settlement account{accounts.length === 1 ? '' : 's'} on file
			</p>
		</div>
		{#if !editing}
			<Button
				variant="outline"
				size="sm"
				onclick={() => startEditing(accounts[0])}
				disabled={accounts.length === 0}
			>
				<Pencil class="size-4" />
				Edit
			</Button>
		{:else}
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" onclick={cancelEditing}>Cancel</Button>
				<Button size="sm" onclick={saveChanges}>Save changes</Button>
			</div>
		{/if}
	</div>

	{#if editing}
		<DetailSection
			title="Edit Bank Account"
			description="Update settlement account details"
			icon={CreditCard}
		>
			<div class="grid gap-4 sm:grid-cols-2">
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
		</DetailSection>
	{/if}

	{#if accounts.length === 0}
		<div class="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
			<p class="text-sm text-muted-foreground">No bank accounts linked to this organization.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each accounts as account (account.id)}
				<div class="rounded-xl border border-border bg-card p-5 shadow">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div class="flex min-w-0 items-start gap-3">
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow"
							>
								<Landmark class="size-4" />
							</div>
							<div class="min-w-0">
								<p class="text-sm font-semibold text-foreground">{account.holderName}</p>
								<p class="font-mono text-sm tracking-widest text-muted-foreground">
									{maskAccountNumber(account.accountNumber)}
								</p>
								<p class="mt-1 text-xs text-muted-foreground">
									{account.bankName}{account.branchName ? ` · ${account.branchName}` : ''}
								</p>
							</div>
						</div>
						{#if !editing}
							<Button variant="ghost" size="sm" onclick={() => startEditing(account)}>
								<Pencil class="size-4" />
								Edit
							</Button>
						{/if}
					</div>
					<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<DetailField label="Bank" value={account.bankName} />
						<DetailField label="Branch" value={account.branchName} />
						<DetailField label="IFSC" value={account.ifscCode} mono />
						<DetailField label="Account Type" value={account.accountType} />
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
