<script lang="ts">
	import * as v from 'valibot';
	import { Button, Input } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import { bankAccountSchema, flattenIssues } from '$lib/validation/onboarding';
	import { CreditCard, Eye, EyeOff, PlusIcon, XIcon, PencilIcon } from '$lib/assets/icons';
	import OnboardingStepShell from './OnboardingStepShell.svelte';
	import OnboardingSection from './OnboardingSection.svelte';
	import StepNavFooter from './StepNavFooter.svelte';

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

	const formTitle = $derived(isEditing ? 'Edit Bank Account' : 'Add Bank Account');
	const formDescription = $derived(
		isEditing ? 'Update the selected account details' : 'Enter banking details for settlement'
	);
</script>

{#snippet bankDetailsFooter()}
	<StepNavFooter showPrev {onprev} {onnext} nextLabel="Continue" nextDisabled={!canContinue} />
{/snippet}

<OnboardingStepShell
	icon={CreditCard}
	title="Bank Account"
	description="Add and manage settlement accounts"
	class={cn(isEditing && 'border-primary/40 ring-1 ring-primary/20')}
	footer={hideNavigation ? undefined : bankDetailsFooter}
>
	<OnboardingSection title={formTitle} description={formDescription}>
		{#snippet trailing()}
			{#if isEditing}
				<button
					onclick={clearAccountForm}
					class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					<XIcon class="size-3.5" />
					Cancel
				</button>
			{/if}
		{/snippet}

		<div class="space-y-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-3">
					<label class="text-sm font-medium" for="accountNum">
						Account number <span class="text-rose-500">*</span>
					</label>
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
					<label class="text-sm font-medium" for="confirmNum">
						Confirm account number <span class="text-rose-500">*</span>
					</label>
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
					<label class="text-sm font-medium" for="bankName">
						Bank <span class="text-rose-500">*</span>
					</label>
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
					<label class="text-sm font-medium" for="holderName">
						Account holder name <span class="text-rose-500">*</span>
					</label>
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
					<label class="text-sm font-medium" for="ifsc">
						IFSC Code <span class="text-rose-500">*</span>
					</label>
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

			<div class="flex justify-end gap-2 pt-2">
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
	</OnboardingSection>

	{#if savedAccounts.length > 0}
		<OnboardingSection
			title="Saved Bank Accounts"
			description="{savedAccounts.length} account{savedAccounts.length === 1 ? '' : 's'} added"
		>
			<div class="divide-y divide-border/30 rounded-lg border border-border/60">
				{#each savedAccounts as account (account.id)}
					<div
						class={cn(
							'flex items-center justify-between gap-3 px-4 py-3',
							editingId === account.id && 'bg-primary/5'
						)}
					>
						<div class="min-w-0 space-y-0.5">
							<p class="text-sm font-medium">{account.holderName}</p>
							<p class="font-mono text-xs tracking-wider text-muted-foreground">
								{maskAccountNumber(account.accountNumber)}
							</p>
							<p class="text-xs text-muted-foreground">
								{account.bank}{account.branch ? ` · ${account.branch}` : ''} · {account.ifscNumber}
							</p>
						</div>
						<button
							onclick={() => editAccount(account)}
							class={cn(
								'flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
								editingId === account.id
									? 'text-primary'
									: 'text-muted-foreground hover:text-foreground'
							)}
							aria-label="Edit {account.holderName}"
						>
							<PencilIcon class="size-3.5" />
							Edit
						</button>
					</div>
				{/each}
			</div>
		</OnboardingSection>
	{/if}
</OnboardingStepShell>
