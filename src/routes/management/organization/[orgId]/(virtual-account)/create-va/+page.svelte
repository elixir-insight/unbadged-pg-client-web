<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { Button, Dropdown, Input } from '$lib/components/reusable';
	import { SlidersHorizontal } from '$lib/assets/icons';
	import { organizations } from '$lib/data/mockData';
	import VaConfigSection from '$lib/components/organization/va-config-section.svelte';
	import VaTransactionTypesPicker from '$lib/components/organization/va-transaction-types-picker.svelte';
	import VaMethodLimitsSection from '$lib/components/organization/va-method-limits-section.svelte';
	import VaCommissionSection from '$lib/components/organization/va-commission-section.svelte';
	import type { CommissionTier } from '$lib/components/organization/types';
	import {
		VA_BANK_PIPELINES,
		filterSelectedTransactionTypes,
		makeCommissionTier
	} from '$lib/components/organization/va-form-constants';
	import { virtualAccountsStore } from '$lib/stores/virtual-accounts.svelte';
	import {
		firstValidationError,
		isCreateVaValid,
		validateCreateVa,
		VA_PIPELINE_UNIQUE_ERROR,
		type VaFormValidationInput
	} from '$lib/validation/virtual-account';
	import { cn } from '$lib/utils';
	import { breadcrumb } from '$lib/stores/breadcrumb.svelte';

	const orgId = $derived(page.params.orgId ?? '');
	const configType = $derived(page.url.searchParams.get('type') === 'payout' ? 'payout' : 'payin');
	const configurationHref = $derived(
		resolve(
			configType === 'payout'
				? '/management/organization/[orgId]/configuration/payout'
				: '/management/organization/[orgId]/configuration/payin',
			{ orgId }
		)
	);
	const org = $derived(organizations.find((o) => o.id === orgId));
	const existingPipelines = $derived(virtualAccountsStore.getUsedPipelines(orgId, configType));
	const pipelineConflict = $derived(
		bankingPipeline.trim() !== '' && existingPipelines.includes(bankingPipeline)
	);

	let bankingPipeline = $state('');
	let transactionLimit = $state('');
	let dailyDepositLimit = $state('');
	let minTxAmount = $state('100');
	let maxTxAmount = $state('');
	let selectedTransactionTypes = $state<string[]>([]);
	let methodLimits = $state<Record<string, { min: string; max: string; total: string }>>({});
	let commissionTiers = $state<CommissionTier[]>([
		makeCommissionTier('100', true),
		makeCommissionTier('1000')
	]);
	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	const hasBankingPipeline = $derived(bankingPipeline.trim() !== '');

	function getFormData(): VaFormValidationInput {
		return {
			bankingPipeline,
			transactionLimit,
			dailyDepositLimit,
			minTxAmount,
			maxTxAmount,
			transactionTypes: selectedTransactionTypes,
			methodLimits,
			commissionTiers
		};
	}

	const formComplete = $derived(isCreateVaValid(getFormData(), existingPipelines));

	function validate(): boolean {
		errors = validateCreateVa(getFormData(), existingPipelines);
		return Object.keys(errors).length === 0;
	}

	function onFieldInput() {
		if (submitAttempted) validate();
	}

	function handleBankingPipelineChange(pipeline: string) {
		selectedTransactionTypes = filterSelectedTransactionTypes(selectedTransactionTypes, pipeline);
		onFieldInput();
	}

	function removeTransactionType(type: string) {
		selectedTransactionTypes = selectedTransactionTypes.filter((value) => value !== type);
		onFieldInput();
	}

	function handleCancel() {
		goto(configurationHref);
	}

	function handleCreateVa() {
		submitAttempted = true;
		if (!validate()) {
			const message = firstValidationError(errors);
			if (message) toast.error(message);
			return;
		}

		const vaId = virtualAccountsStore.nextAccountId(orgId, configType);
		virtualAccountsStore.addAccount(orgId, configType, {
			id: vaId,
			alias: `${bankingPipeline} VA`,
			accountNumber: `XXXX ${vaId.slice(-4)} ${Math.floor(Math.random() * 9000 + 1000)}`,
			bank: bankingPipeline,
			bankingPipeline,
			active: true
		});

		toast.success('Virtual account created successfully');
		goto(configurationHref);
	}

	$effect(() => {
		if (org) {
			breadcrumb.set([
				{ label: 'Organizations', href: '/management/organization' },
				{
					label: org.name,
					href: `/management/organization/${org.id}/configuration/${configType}`
				},
				{ label: 'Create VA', href: `/management/organization/${org.id}/create-va` }
			]);
		}
		return () => breadcrumb.clear();
	});
</script>

{#if org}
	<div class="mx-auto flex w-full max-w-6xl flex-col gap-4">
		<div>
			<h1 class="text-xl font-semibold tracking-tight">Create Virtual Account</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Configure transaction limits and commission for {org.name}.
			</p>
		</div>

		<div class="flex flex-col gap-4" in:fade={{ duration: 200 }}>
			<VaConfigSection
				title="Transaction Configuration"
				description="Set deposit limits and transaction boundaries"
				icon={SlidersHorizontal}
				accent="primary"
			>
				<div class="p-5 sm:p-6">
					<div class="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
						<div class="space-y-1.5">
							<label
								for="bank-pipeline"
								class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
							>
								Bank Pipeline
							</label>
							<Dropdown
								bind:value={bankingPipeline}
								options={VA_BANK_PIPELINES}
								placeholder="Select bank pipeline…"
								name="bank-pipeline"
								onValueChange={handleBankingPipelineChange}
							/>
							{#if (submitAttempted && errors.bankingPipeline) || pipelineConflict}
								<p class="text-xs text-destructive">
									{errors.bankingPipeline ?? VA_PIPELINE_UNIQUE_ERROR}
								</p>
							{/if}
						</div>

						{#each [{ id: 'transaction-limit', label: 'Transaction Limit', ph: 'e.g. 1000000' }, { id: 'daily-deposit-limit', label: 'Daily Deposit Limit', ph: 'e.g. 500000' }, { id: 'min-tx-amount', label: 'Min Transaction Amount', ph: 'e.g. 100' }, { id: 'max-tx-amount', label: 'Max Transaction Amount', ph: 'e.g. 100000' }] as field (field.id)}
							<div class="space-y-1.5">
								<label
									for={field.id}
									class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
								>
									{field.label}
								</label>
								{#if field.id === 'transaction-limit'}
									<Input
										id={field.id}
										inputmode="decimal"
										bind:value={transactionLimit}
										oninput={onFieldInput}
										placeholder={field.ph}
										class={cn(
											submitAttempted &&
												errors.transactionLimit &&
												'border-destructive focus-visible:ring-destructive/30'
										)}
									/>
									{#if submitAttempted && errors.transactionLimit}
										<p class="text-xs text-destructive">{errors.transactionLimit}</p>
									{/if}
								{:else if field.id === 'daily-deposit-limit'}
									<Input
										id={field.id}
										inputmode="decimal"
										bind:value={dailyDepositLimit}
										oninput={onFieldInput}
										placeholder={field.ph}
										class={cn(
											submitAttempted &&
												errors.dailyDepositLimit &&
												'border-destructive focus-visible:ring-destructive/30'
										)}
									/>
									{#if submitAttempted && errors.dailyDepositLimit}
										<p class="text-xs text-destructive">{errors.dailyDepositLimit}</p>
									{/if}
								{:else if field.id === 'min-tx-amount'}
									<Input
										id={field.id}
										inputmode="decimal"
										bind:value={minTxAmount}
										oninput={onFieldInput}
										placeholder={field.ph}
										class={cn(
											submitAttempted &&
												errors.minTxAmount &&
												'border-destructive focus-visible:ring-destructive/30'
										)}
									/>
									{#if submitAttempted && errors.minTxAmount}
										<p class="text-xs text-destructive">{errors.minTxAmount}</p>
									{/if}
								{:else}
									<Input
										id={field.id}
										inputmode="decimal"
										bind:value={maxTxAmount}
										oninput={onFieldInput}
										placeholder={field.ph}
										class={cn(
											submitAttempted &&
												errors.maxTxAmount &&
												'border-destructive focus-visible:ring-destructive/30'
										)}
									/>
									{#if submitAttempted && errors.maxTxAmount}
										<p class="text-xs text-destructive">{errors.maxTxAmount}</p>
									{/if}
								{/if}
							</div>
						{/each}

						<div class="space-y-1.5">
							<VaTransactionTypesPicker
								bind:selectedTypes={selectedTransactionTypes}
								pipeline={bankingPipeline}
								onRemoveType={removeTransactionType}
								id="create-tx-type-trigger"
							/>
							{#if submitAttempted && errors.transactionTypes}
								<p class="text-xs text-destructive">{errors.transactionTypes}</p>
							{/if}
						</div>
					</div>
				</div>
			</VaConfigSection>

			{#if hasBankingPipeline}
				<div class="space-y-1.5">
					<VaMethodLimitsSection
						bind:methodLimits
						selectedTypes={selectedTransactionTypes}
						onRemoveType={removeTransactionType}
					/>
					{#if submitAttempted && errors.methodLimits}
						<p class="px-5 text-xs text-destructive">{errors.methodLimits}</p>
					{/if}
				</div>
			{/if}

			<div class="space-y-1.5">
				<VaCommissionSection bind:tiers={commissionTiers} mode="create" />
				{#if submitAttempted && errors.commissionTiers}
					<p class="px-5 text-xs text-destructive">{errors.commissionTiers}</p>
				{/if}
			</div>
		</div>

		<div class="flex justify-end gap-2.5 pb-2">
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button
				class="gradient-primary text-primary-foreground"
				disabled={!formComplete}
				onclick={handleCreateVa}
			>
				Create VA
			</Button>
		</div>
	</div>
{:else}
	<div class="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
		Organization not found.
	</div>
{/if}
