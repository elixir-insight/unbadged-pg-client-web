<script lang="ts">
	import * as v from 'valibot';
	import { Button, Input } from '$lib/components/reusable';
	import { fly } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import { bankAccountSchema, flattenIssues } from '$lib/validation/onboarding';
	import {
		CreditCard,
		Landmark,
		Eye,
		EyeOff,
		PlusIcon,
		XIcon,
		PencilIcon,
		ArrowRight,
		ArrowLeft
	} from '$lib/assets/icons';
	import Card from './Card.svelte';

	interface BankAccount {
		id: number;
		holderName: string;
		accountNumber: string;
		bank: string;
		branch: string;
		ifscNumber: string;
	}

	let {
		isValid = $bindable(false),
		initialAccounts = undefined as BankAccount[] | undefined,
		hideNavigation = false,
		onnext = () => {},
		onprev = () => {}
	}: {
		isValid?: boolean;
		initialAccounts?: BankAccount[];
		hideNavigation?: boolean;
		onnext?: () => void;
		onprev?: () => void;
	} = $props();

	// ── Internal account state ────────────────────────────────────────
	let accountHolderName = $state('');
	let accountNumber = $state('');
	let confirmAccountNumber = $state('');
	let showAccountNumber = $state(false);
	let showConfirmAccountNumber = $state(false);
	let bank = $state('');
	let branch = $state('');
	let ifscNumber = $state('');

	let savedAccounts = $state<BankAccount[]>([]);
	let editingId = $state<number | null>(null);
	let nextAccountId = $state(2);
	let accountsSeeded = $state(false);

	$effect.pre(() => {
		if (!initialAccounts?.length || accountsSeeded) return;
		savedAccounts = initialAccounts.map((account) => ({ ...account }));
		nextAccountId = initialAccounts.reduce((max, account) => Math.max(max, account.id), 0) + 1;
		accountsSeeded = true;
	});

	const isEditing = $derived(editingId !== null);

	function getFormData() {
		return {
			accountHolderName,
			accountNumber,
			confirmAccountNumber,
			bank,
			branch,
			ifscNumber
		};
	}

	const canContinue = $derived(savedAccounts.length > 0);

	const bankMandatoryFilled = $derived(
		accountHolderName.trim() !== '' &&
			accountNumber.trim() !== '' &&
			confirmAccountNumber.trim() !== '' &&
			bank.trim() !== '' &&
			ifscNumber.trim() !== ''
	);

	$effect(() => {
		if (isValid !== canContinue) {
			isValid = canContinue;
		}
	});

	// ── Validation ─────────────────────────────────────────────────
	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	function validate(): boolean {
		const result = v.safeParse(bankAccountSchema, getFormData());
		errors = result.success ? {} : flattenIssues(result.issues);
		return result.success;
	}

	function onFieldInput() {
		if (submitAttempted) validate();
	}

	function maskAccountNumber(num: string): string {
		if (num.length <= 4) return num;
		return '●●●● ●●●● ' + num.slice(-4);
	}

	function addAccount() {
		submitAttempted = true;
		if (!validate()) return;
		savedAccounts = [
			...savedAccounts,
			{
				id: nextAccountId,
				holderName: accountHolderName,
				accountNumber,
				bank,
				branch,
				ifscNumber
			}
		];
		nextAccountId++;
		clearAccountForm();
	}

	function updateAccount() {
		submitAttempted = true;
		if (!validate()) return;
		savedAccounts = savedAccounts.map((a) =>
			a.id === editingId
				? {
						...a,
						holderName: accountHolderName,
						accountNumber,
						bank,
						branch,
						ifscNumber
					}
				: a
		);
		clearAccountForm();
	}

	function editAccount(account: BankAccount) {
		accountHolderName = account.holderName;
		accountNumber = account.accountNumber;
		confirmAccountNumber = account.accountNumber;
		bank = account.bank;
		branch = account.branch;
		ifscNumber = account.ifscNumber;
		editingId = account.id;
		showAccountNumber = false;
		showConfirmAccountNumber = false;
		errors = {};
		submitAttempted = false;
	}

	function clearAccountForm() {
		accountHolderName = '';
		accountNumber = '';
		confirmAccountNumber = '';
		bank = '';
		branch = '';
		ifscNumber = '';
		editingId = null;
		showAccountNumber = false;
		showConfirmAccountNumber = false;
		errors = {};
		submitAttempted = false;
	}
	const canSaveAccount = $derived(bankMandatoryFilled && Object.keys(errors).length === 0);
</script>

<div in:fly={{ y: 10, duration: 220 }} class="space-y-4">
	<!-- Bank details form -->
	<Card class={cn(isEditing && 'border-primary/40 ring-1 ring-primary/20', 'bg-background')}>
		{#snippet header()}
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<div
						class={cn(
							'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
							isEditing ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'
						)}
					>
						<CreditCard class="size-4.5" />
					</div>
					<div>
						<p class="text-base leading-none font-semibold">
							{isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
						</p>
						<p class="mt-0.5 text-xs text-muted-foreground">
							{isEditing
								? 'Update the selected account details'
								: 'Enter banking details for this organization'}
						</p>
					</div>
				</div>
				{#if isEditing}
					<button
						onclick={clearAccountForm}
						class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<XIcon class="size-3.5" />
						Cancel
					</button>
				{/if}
			</div>
		{/snippet}

		<div class="space-y-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-3">
					<label class="text-sm font-medium" for="accountNum"
						>Account number <span class="text-rose-500">*</span></label
					>
					<div class="relative">
						<Input
							id="accountNum"
							type={showAccountNumber ? 'text' : 'password'}
							bind:value={accountNumber}
							oninput={onFieldInput}
							placeholder="Enter Account Number"
							class={cn(
								'pr-9',
								errors.accountNumber && 'border-destructive focus-visible:ring-destructive/30'
							)}
						/>
						<button
							type="button"
							onclick={() => (showAccountNumber = !showAccountNumber)}
							class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if showAccountNumber}
								<EyeOff class="size-3.5" />
							{:else}
								<Eye class="size-3.5" />
							{/if}
						</button>
					</div>
					{#if submitAttempted && errors.accountNumber}
						<p class="text-xs text-rose-500">{errors.accountNumber}</p>
					{/if}
				</div>
				<div class="flex flex-col gap-3">
					<label class="text-sm font-medium" for="confirmNum"
						>Confirm account number <span class="text-rose-500">*</span></label
					>
					<div class="relative">
						<Input
							id="confirmNum"
							type={showConfirmAccountNumber ? 'text' : 'password'}
							bind:value={confirmAccountNumber}
							oninput={onFieldInput}
							placeholder="Enter Confirm Account Number"
							class={cn(
								'pr-9',
								errors.confirmAccountNumber &&
									'border-destructive focus-visible:ring-destructive/30'
							)}
						/>
						<button
							type="button"
							onclick={() => (showConfirmAccountNumber = !showConfirmAccountNumber)}
							class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if showConfirmAccountNumber}
								<EyeOff class="size-3.5" />
							{:else}
								<Eye class="size-3.5" />
							{/if}
						</button>
					</div>
					{#if submitAttempted && errors.confirmAccountNumber}
						<p class="text-xs text-rose-500">{errors.confirmAccountNumber}</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-3">
					<label class="text-sm font-medium" for="bankName"
						>Bank <span class="text-rose-500">*</span></label
					>
					<Input
						id="bankName"
						bind:value={bank}
						oninput={onFieldInput}
						placeholder="Enter Bank Name"
						class={cn(errors.bank && 'border-destructive focus-visible:ring-destructive/30')}
					/>
					{#if submitAttempted && errors.bank}
						<p class="text-xs text-rose-500">{errors.bank}</p>
					{/if}
				</div>
				<div class="flex flex-col gap-3">
					<label class="text-sm font-medium" for="branchName">Branch</label>
					<Input
						id="branchName"
						bind:value={branch}
						oninput={onFieldInput}
						placeholder="Enter Branch Name"
					/>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-3">
					<label class="text-sm font-medium" for="holderName"
						>Account holder name <span class="text-rose-500">*</span></label
					>
					<Input
						id="holderName"
						bind:value={accountHolderName}
						oninput={onFieldInput}
						placeholder="Enter Account Holder Name"
						class={cn(
							errors.accountHolderName && 'border-destructive focus-visible:ring-destructive/30'
						)}
					/>
					{#if submitAttempted && errors.accountHolderName}
						<p class="text-xs text-rose-500">{errors.accountHolderName}</p>
					{/if}
				</div>

				<div class="flex flex-col gap-3">
					<label class="text-sm font-medium" for="ifsc"
						>IFSC Code <span class="text-rose-500">*</span></label
					>
					<Input
						id="ifsc"
						bind:value={ifscNumber}
						oninput={onFieldInput}
						placeholder="Enter IFSC Code"
						class={cn(errors.ifscNumber && 'border-destructive focus-visible:ring-destructive/30')}
					/>
					{#if submitAttempted && errors.ifscNumber}
						<p class="text-xs text-rose-500">{errors.ifscNumber}</p>
					{/if}
				</div>
			</div>
			<!-- Form action -->
			<div class="flex items-center justify-end gap-2 border-t border-border pt-4">
				{#if isEditing}
					<Button variant="outline" size="sm" onclick={clearAccountForm}>Cancel</Button>
					<Button
						size="sm"
						class="gradient-primary text-primary-foreground"
						onclick={updateAccount}
						disabled={!canSaveAccount}
					>
						Update Account
					</Button>
				{:else}
					<Button
						size="sm"
						class="gradient-primary text-primary-foreground"
						onclick={addAccount}
						disabled={!canSaveAccount}
					>
						<PlusIcon class="size-4" />
						Add Account
					</Button>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Saved bank accounts -->
	{#if savedAccounts.length > 0}
		<Card class="bg-background">
			{#snippet header()}
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2.5">
						<div
							class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Landmark class="size-4.5" />
						</div>
						<p class="text-base leading-none font-semibold">Saved Bank Accounts</p>
					</div>
					<span class="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
						{savedAccounts.length}
						{savedAccounts.length === 1 ? 'account' : 'accounts'}
					</span>
				</div>
			{/snippet}

			<div class="space-y-3">
				{#each savedAccounts as account (account.id)}
					<div
						in:fly={{ y: 8, duration: 200 }}
						class={cn(
							'group relative flex items-start justify-between gap-3 rounded-xl border p-4',
							'transition-all duration-200',
							editingId === account.id
								? 'border-primary/40 bg-primary/3 shadow-sm ring-1 shadow-primary/10 ring-primary/20'
								: 'border-border/60 bg-muted/20 hover:border-primary/25 hover:bg-primary/2 hover:shadow-sm dark:hover:bg-primary/4'
						)}
					>
						<div class="flex min-w-0 items-start gap-3.5">
							<!-- Bank initial avatar -->
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary"
							>
								{account.bank[0]}
							</div>

							<div class="min-w-0 space-y-1">
								<p class="text-sm font-semibold">{account.holderName}</p>
								<p class="font-mono text-sm tracking-widest text-muted-foreground">
									{maskAccountNumber(account.accountNumber)}
								</p>
								<div
									class="flex flex-wrap items-center gap-x-1.5 gap-y-0 text-xs text-muted-foreground"
								>
									<span>{account.bank}</span>
									{#if account.branch}
										<span class="text-border">·</span>
										<span>{account.branch}</span>
									{/if}
								</div>
								<p class="text-xs text-muted-foreground">
									<span class="font-medium text-foreground/60">IFSC</span>
									&ensp;{account.ifscNumber}
								</p>
							</div>
						</div>

						<!-- Right: edit button -->
						<div class="flex shrink-0 flex-col items-end gap-2.5">
							<button
								onclick={() => editAccount(account)}
								class={cn(
									'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium',
									'transition-all duration-150',
									editingId === account.id
										? 'bg-primary/15 text-primary'
										: 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
								)}
								aria-label="Edit {account.holderName}"
							>
								<PencilIcon class="size-3.5" />
								<span>Edit</span>
							</button>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	<!-- Step navigation -->
	{#if !hideNavigation}
		<div
			class="flex items-center justify-between rounded-2xl border border-border/40 bg-background/80 px-5 py-3.5 shadow-sm backdrop-blur-sm"
		>
			<Button variant="ghost" size="sm" onclick={onprev}>
				<ArrowLeft class="size-4" />
				Previous
			</Button>
			<Button
				size="sm"
				class="gradient-primary text-primary-foreground"
				onclick={onnext}
				disabled={!canContinue}
			>
				Continue
				<ArrowRight class="size-4" />
			</Button>
		</div>
	{/if}
</div>
