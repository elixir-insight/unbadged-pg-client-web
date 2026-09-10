<script lang="ts">
	import { getContext } from 'svelte';
	import { Button, Input } from '$lib/components/reusable';
	import { InlineRemark, SectionCard, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromTab } from '$lib/components/self-onboarding/navigation';
	import { STAGE_NAV_KEY, type StageNav } from '$lib/components/self-onboarding/stage-nav.svelte';
	import { isValidAccountNumber, isValidIfsc } from '$lib/components/self-onboarding/validation';
	import { Eye, EyeOff } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { getFieldRemark } from '$lib/utils/remarkRouting';
	import { cn } from '$lib/utils';

	const stageNav = getContext<StageNav | undefined>(STAGE_NAV_KEY);
	let revealAccount = $state(false);
	let revealConfirm = $state(false);
	let submitted = $state(false);

	const bank = $derived(onboarding.formData.bankDetails);
	const focusField = $derived(onboarding.focusField);
	const holderRemark = $derived(
		getFieldRemark(onboarding.verifications, 'bankDetails.accountHolderName')
	);
	const numberRemark = $derived(
		getFieldRemark(onboarding.verifications, 'bankDetails.accountNumber')
	);
	const ifscRemark = $derived(getFieldRemark(onboarding.verifications, 'bankDetails.ifscCode'));
	const bankNameRemark = $derived(getFieldRemark(onboarding.verifications, 'bankDetails.bankName'));
	const branchRemark = $derived(getFieldRemark(onboarding.verifications, 'bankDetails.branchName'));

	const errors = $derived.by(() => {
		if (!submitted) return {} as Record<string, string>;
		const next: Record<string, string> = {};
		if (!bank.accountHolderName.trim()) next.accountHolderName = 'Account holder name is required.';
		if (!isValidAccountNumber(bank.accountNumber)) {
			next.accountNumber = 'Enter a 9–18 digit account number.';
		}
		if (bank.accountNumber !== bank.confirmAccountNumber) {
			next.confirmAccountNumber = 'Account numbers do not match.';
		}
		if (!isValidIfsc(bank.ifscCode)) next.ifscCode = 'Enter a valid 11-character IFSC.';
		return next;
	});

	const canContinue = $derived(
		bank.accountHolderName.trim().length > 0 &&
			isValidAccountNumber(bank.accountNumber) &&
			bank.accountNumber === bank.confirmAccountNumber &&
			isValidIfsc(bank.ifscCode)
	);

	function digitsOnly(value: string): string {
		return value.replace(/\D/g, '').slice(0, 18);
	}

	function continueToDirectors() {
		submitted = true;
		if (!canContinue) return;
		void advanceFromTab('bank');
	}

	function blockPaste(event: ClipboardEvent) {
		event.preventDefault();
	}

	$effect.pre(() => {
		stageNav?.setConfig({
			canContinue,
			onContinue: continueToDirectors,
			label: 'Continue'
		});
	});
</script>

<StepShell>
	<SectionCard title="Account">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<InlineRemark
				remark={holderRemark}
				fieldKey="bankDetails.accountHolderName"
				highlighted={focusField === 'bankDetails.accountHolderName'}
			>
				<label class="space-y-1">
					<span class="text-sm font-medium text-primary">Account Holder Name</span>
					<Input
						id="account-holder"
						value={bank.accountHolderName}
						aria-invalid={Boolean(errors.accountHolderName)}
						oninput={(event) =>
							onboarding.updateBankDetails({ accountHolderName: event.currentTarget.value })}
					/>
					{#if errors.accountHolderName}
						<p class="text-xs text-destructive">{errors.accountHolderName}</p>
					{/if}
				</label>
			</InlineRemark>

			<InlineRemark
				remark={ifscRemark}
				fieldKey="bankDetails.ifscCode"
				highlighted={focusField === 'bankDetails.ifscCode'}
			>
				<label class="space-y-1">
					<span class="text-sm font-medium text-primary">IFSC Code</span>
					<Input
						id="ifsc"
						class="font-mono tracking-widest uppercase"
						maxlength={11}
						value={bank.ifscCode}
						aria-invalid={Boolean(errors.ifscCode)}
						oninput={(event) => {
							onboarding.updateBankDetails({
								ifscCode: event.currentTarget.value
									.replace(/[^a-zA-Z0-9]/g, '')
									.toUpperCase()
									.slice(0, 11)
							});
						}}
					/>
					{#if errors.ifscCode}
						<p class="text-xs text-destructive">{errors.ifscCode}</p>
					{:else}
						<p class="text-xs text-muted-foreground">Enter an 11-character IFSC.</p>
					{/if}
				</label>
			</InlineRemark>

			<InlineRemark
				remark={bankNameRemark}
				fieldKey="bankDetails.bankName"
				highlighted={focusField === 'bankDetails.bankName'}
			>
				<label class="space-y-1">
					<span class="text-sm font-medium text-primary">Bank Name</span>
					<Input
						id="bank-name"
						value={bank.bankName}
						oninput={(event) =>
							onboarding.updateBankDetails({ bankName: event.currentTarget.value })}
					/>
				</label>
			</InlineRemark>

			<InlineRemark
				remark={branchRemark}
				fieldKey="bankDetails.branchName"
				highlighted={focusField === 'bankDetails.branchName'}
			>
				<label class="space-y-1">
					<span class="text-sm font-medium text-primary">Branch Name</span>
					<Input
						id="branch-name"
						value={bank.branchName}
						oninput={(event) =>
							onboarding.updateBankDetails({ branchName: event.currentTarget.value })}
					/>
				</label>
			</InlineRemark>

			<InlineRemark
				remark={numberRemark}
				fieldKey="bankDetails.accountNumber"
				highlighted={focusField === 'bankDetails.accountNumber'}
			>
				<label class="space-y-1">
					<span class="text-sm font-medium text-primary">Account Number</span>
					<div class="relative">
						<Input
							id="account-number"
							class={cn(
								'pr-10 font-mono tracking-wide',
								!revealAccount && '[-webkit-text-security:disc]'
							)}
							inputmode="numeric"
							autocomplete="off"
							value={bank.accountNumber}
							aria-invalid={Boolean(errors.accountNumber)}
							oninput={(event) =>
								onboarding.updateBankDetails({
									accountNumber: digitsOnly(event.currentTarget.value)
								})}
						/>
						<button
							type="button"
							class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							aria-label={revealAccount ? 'Hide account number' : 'Show account number'}
							onclick={() => (revealAccount = !revealAccount)}
						>
							{#if revealAccount}
								<EyeOff class="size-4" />
							{:else}
								<Eye class="size-4" />
							{/if}
						</button>
					</div>
					{#if errors.accountNumber}
						<p class="text-xs text-destructive">{errors.accountNumber}</p>
					{/if}
				</label>
			</InlineRemark>

			<label class="space-y-1">
				<span class="text-sm font-medium text-primary">Confirm Account Number</span>
				<div class="relative">
					<Input
						id="confirm-account"
						class={cn(
							'pr-10 font-mono tracking-wide',
							!revealConfirm && '[-webkit-text-security:disc]'
						)}
						inputmode="numeric"
						autocomplete="off"
						value={bank.confirmAccountNumber}
						aria-invalid={Boolean(errors.confirmAccountNumber)}
						onpaste={blockPaste}
						oninput={(event) =>
							onboarding.updateBankDetails({
								confirmAccountNumber: digitsOnly(event.currentTarget.value)
							})}
					/>
					<button
						type="button"
						class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						aria-label={revealConfirm ? 'Hide confirmation' : 'Show confirmation'}
						onclick={() => (revealConfirm = !revealConfirm)}
					>
						{#if revealConfirm}
							<EyeOff class="size-4" />
						{:else}
							<Eye class="size-4" />
						{/if}
					</button>
				</div>
				{#if errors.confirmAccountNumber}
					<p class="text-xs text-destructive">{errors.confirmAccountNumber}</p>
				{/if}
			</label>
		</div>
	</SectionCard>

	{#snippet footer()}
		<Button onclick={continueToDirectors}>Continue</Button>
	{/snippet}
</StepShell>
