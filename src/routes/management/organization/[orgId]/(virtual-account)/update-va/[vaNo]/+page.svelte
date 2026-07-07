<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { Button, Dropdown, Input, Switch } from '$lib/components/reusable';
	import type { VAStatus } from '$lib/components/reusable';
	import { AlertCircle, ShieldCheck, SlidersHorizontal } from '$lib/assets/icons';
	import { organizations } from '$lib/data/mockData';
	import VaConfigSection from '$lib/components/organization/va-config-section.svelte';
	import VaTransactionTypesPicker from '$lib/components/organization/va-transaction-types-picker.svelte';
	import VaMethodLimitsSection from '$lib/components/organization/va-method-limits-section.svelte';
	import VaCommissionSection from '$lib/components/organization/va-commission-section.svelte';
	import VaStatusSidebar from '$lib/components/organization/va-status-sidebar.svelte';
	import type { CommissionTier } from '$lib/components/organization/types';
	import {
		VA_BANK_PIPELINES,
		filterSelectedTransactionTypes,
		getVaMockDetails,
		makeCommissionTier
	} from '$lib/components/organization/va-form-constants';
	import { virtualAccountsStore } from '$lib/stores/virtual-accounts.svelte';
	import {
		firstValidationError,
		isUpdateVaValid,
		validateUpdateVa,
		VA_PIPELINE_UNIQUE_ERROR,
		type VaFormValidationInput
	} from '$lib/validation/virtual-account';
	import { cn } from '$lib/utils';
	import { breadcrumb } from '$lib/stores/breadcrumb.svelte';

	const orgId = $derived(page.params.orgId ?? '');
	const vaNo = $derived(page.params.vaNo ?? '');
	const configType = $derived(page.url.searchParams.get('type') === 'payout' ? 'payout' : 'payin');
	const org = $derived(organizations.find((o) => o.id === orgId));
	const vaDetails = $derived(getVaMockDetails(vaNo));
	const existingPipelines = $derived(
		virtualAccountsStore.getUsedPipelines(orgId, configType, vaNo)
	);
	const pipelineConflict = $derived(
		bankingPipeline.trim() !== '' && existingPipelines.includes(bankingPipeline)
	);

	let bankingPipeline = $state('');
	let transactionLimit = $state('1000000000000');
	let dailyDepositLimit = $state('20000000');
	let minTxAmount = $state('100');
	let maxTxAmount = $state('300000');
	let selectedTransactionTypes = $state<string[]>([]);
	let methodLimits = $state<Record<string, { min: string; max: string; total: string }>>({});
	let allowNonWhitelisted = $state(false);
	let vaStatus = $state<VAStatus>('ACTIVE');
	let commissionEffectiveDate = $state('tomorrow');
	let commissionTiers = $state<CommissionTier[]>([
		{ ...makeCommissionTier('100', true), method: 'percentage', gatewayFee: '3.00' },
		{ ...makeCommissionTier('1000'), method: 'flatrate', gatewayFee: '4.00' }
	]);
	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	$effect(() => {
		const details = vaDetails;
		bankingPipeline = details.bankingPipeline;
		selectedTransactionTypes = [...details.transactionTypes];
		methodLimits = { ...details.methodLimits };
	});

	function getFormData(): VaFormValidationInput {
		return {
			bankingPipeline,
			transactionLimit,
			dailyDepositLimit,
			minTxAmount,
			maxTxAmount,
			transactionTypes: selectedTransactionTypes,
			methodLimits,
			commissionTiers,
			allowNonWhitelisted,
			vaStatus,
			commissionEffectiveDate
		};
	}

	const formComplete = $derived(isUpdateVaValid(getFormData(), existingPipelines));

	function validate(): boolean {
		errors = validateUpdateVa(getFormData(), existingPipelines);
		return Object.keys(errors).length === 0;
	}

	function onFieldInput() {
		if (submitAttempted) validate();
	}

	function removeTransactionType(type: string) {
		selectedTransactionTypes = selectedTransactionTypes.filter((value) => value !== type);
		onFieldInput();
	}

	function handleBankingPipelineChange(pipeline: string) {
		selectedTransactionTypes = filterSelectedTransactionTypes(selectedTransactionTypes, pipeline);
		onFieldInput();
	}

	function handleUpdateVa() {
		submitAttempted = true;
		if (!validate()) {
			const message = firstValidationError(errors);
			if (message) toast.error(message);
			return;
		}

		virtualAccountsStore.updateAccount(orgId, configType, vaNo, {
			bankingPipeline,
			bank: bankingPipeline,
			active: vaStatus === 'ACTIVE'
		});
		toast.success('Virtual account updated successfully');
	}

	function handleUpdateVaStatus() {
		submitAttempted = true;
		if (!validate()) {
			const message = firstValidationError(errors);
			if (message) toast.error(message);
			return;
		}

		virtualAccountsStore.updateAccount(orgId, configType, vaNo, {
			active: vaStatus === 'ACTIVE',
			bankingPipeline,
			bank: bankingPipeline
		});
		toast.success('Virtual account status updated');
	}

	$effect(() => {
		if (org) {
			breadcrumb.set([
				{ label: 'Organizations', href: '/management/organization' },
				{
					label: org.name,
					href: `/management/organization/${org.id}/configuration/${configType}`
				},
				{
					label: `Update VA ${vaNo}`,
					href: `/management/organization/${org.id}/update-va/${vaNo}`
				}
			]);
		}
		return () => breadcrumb.clear();
	});
</script>

{#if org}
	<div class="mx-auto flex w-full max-w-6xl flex-col gap-4">
		<div>
			<h1 class="text-xl font-semibold tracking-tight">Update Virtual Account</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Manage limits, status, and commission for VA {vaNo}.
			</p>
		</div>

		<div
			class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]"
			in:fade={{ duration: 200 }}
		>
			<aside class="lg:sticky lg:top-4">
				<VaStatusSidebar {vaNo} bind:status={vaStatus} onUpdateStatus={handleUpdateVaStatus} />
			</aside>

			<div class="flex min-w-0 flex-col gap-4">
				<VaConfigSection
					title="Transaction Configuration"
					description="Set deposit limits, transaction types, and per-method caps"
					icon={SlidersHorizontal}
					accent="primary"
				>
					{#snippet footer()}
						<div class="flex justify-end px-5 py-4">
							<Button variant="outline" disabled={!formComplete} onclick={handleUpdateVa}>
								Update VA
							</Button>
						</div>
					{/snippet}

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
									id="update-tx-type-trigger"
								/>
								{#if submitAttempted && errors.transactionTypes}
									<p class="text-xs text-destructive">{errors.transactionTypes}</p>
								{/if}
							</div>
						</div>
					</div>

					{#if bankingPipeline}
						<div class="border-t border-border/40">
							<div class="border-b border-border/40 bg-muted/10 px-5 py-3">
								<p class="text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
									Transaction Limits by Method
								</p>
								<p class="mt-0.5 text-xs text-muted-foreground/70">
									Per-method caps auto-populate from selected types
								</p>
							</div>
							<VaMethodLimitsSection
								embedded
								bind:methodLimits
								selectedTypes={selectedTransactionTypes}
								onRemoveType={removeTransactionType}
							/>
							{#if submitAttempted && errors.methodLimits}
								<p class="px-5 pb-4 text-xs text-destructive">{errors.methodLimits}</p>
							{/if}
						</div>
					{/if}
				</VaConfigSection>

				<VaConfigSection
					title="Whitelist & Status Controls"
					description="Manage fund acceptance and virtual account status"
					icon={ShieldCheck}
					accent="warning"
				>
					<div class="space-y-4 p-5 sm:p-6">
						<div
							class={cn(
								'flex items-center justify-between gap-4 rounded-xl border-2 px-4 py-3.5 transition-all duration-200',
								allowNonWhitelisted
									? 'border-warning/40 bg-warning/5 shadow-sm shadow-warning/10'
									: 'border-border/50 bg-background hover:border-border'
							)}
						>
							<div class="min-w-0 flex-1">
								<p
									class={cn(
										'text-sm font-semibold',
										allowNonWhitelisted ? 'text-warning' : 'text-foreground'
									)}
								>
									Allow Funds from Non-Whitelisted Accounts
								</p>
								<p class="mt-0.5 text-xs text-muted-foreground">
									Accept deposits from bank accounts that are not whitelisted or verified
								</p>
							</div>
							<Switch bind:checked={allowNonWhitelisted} class="shrink-0" />
						</div>

						<div
							class="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
						>
							<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
							<p class="text-sm text-destructive/90">
								Control whether your Virtual Account can receive funds from bank accounts that are
								not whitelisted or verified.
							</p>
						</div>
					</div>
				</VaConfigSection>

				<div class="space-y-1.5">
					<VaCommissionSection
						bind:tiers={commissionTiers}
						bind:effectiveDate={commissionEffectiveDate}
						mode="update"
					/>
					{#if submitAttempted && errors.commissionTiers}
						<p class="px-5 text-xs text-destructive">{errors.commissionTiers}</p>
					{/if}
					{#if submitAttempted && errors.commissionEffectiveDate}
						<p class="px-5 text-xs text-destructive">{errors.commissionEffectiveDate}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
		Organization not found.
	</div>
{/if}
