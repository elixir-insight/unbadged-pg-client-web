<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { Input } from '$lib/components/reusable';
	import { Dropdown } from '$lib/components/reusable';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ActivateOrgDialog from './activate-org-dialog.svelte';
	import VaAccountCard from './va-account-card.svelte';
	import * as Table from '$lib/components/ui/table';
	import {
		XIcon,
		ShieldCheck,
		PlusIcon,
		Trash2Icon,
		SlidersHorizontal,
		Coins,
		TableIcon,
		ChevronDown,
		Search
	} from '$lib/assets/icons';
	import { slide, fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { availableBankPipelines } from '../../../routes/management/onboarding/create-organization/constants';
	import { virtualAccountsStore } from '$lib/stores/virtual-accounts.svelte';
	import {
		firstValidationError,
		isConfigurationValid,
		validateConfiguration,
		type ConfigurationValidationInput
	} from '$lib/validation/virtual-account';
	import { cn } from '$lib/utils';
	import { getOrganizationOrgContext } from '../../../routes/management/organization/[orgId]/organization-org.svelte';
	import type { ConfigService } from './types';

	// ── Types ─────────────────────────────────────────────────────────────────

	interface TxTypeOption {
		id: string;
		label: string;
		checked: boolean;
		limits: { min: string; max: string; total: string };
	}

	interface CommissionRow {
		id: string;
		baseAmount: string;
		method: string;
		gatewayFee: string;
		partnerFee: string;
	}

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		orgId?: string;
		orgName?: string;
		serviceType: ConfigService;
		onactivate?: () => Promise<void>;
	}

	const { orgId = '', orgName = 'this organization', serviceType, onactivate }: Props = $props();

	const orgState = getOrganizationOrgContext();

	// ── Status flags ──────────────────────────────────────────────────────────

	const showCommissionSetup = $derived(serviceType === 'payout');
	const isActive = $derived(Boolean(orgState.activatedServicesByOrg[orgId]?.[serviceType]));

	const serviceLabel = $derived(serviceType === 'payout' ? 'Payout' : 'Payin');

	const bankPipelineOptions = availableBankPipelines.map((pipeline) => ({
		value: pipeline.value,
		label: pipeline.value
	}));

	let selectedBankPipeline = $state('');
	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	const fieldIdPrefix = $derived(serviceType);

	// ── Transaction Configuration ─────────────────────────────────────────────

	let txConfig = $state({
		securityDeposit: '',
		transactionLimit: '',
		dailyDepositLimit: '',
		minTxAmount: '',
		maxTxAmount: ''
	});

	// ── Transaction Types multi-select ────────────────────────────────────────

	const emptyLimits = () => ({ min: '', max: '', total: '' });

	let txTypeOptions = $state<TxTypeOption[]>([
		{ id: 'cards', label: 'Cards', checked: false, limits: emptyLimits() },
		{ id: 'upi', label: 'UPI', checked: false, limits: emptyLimits() },
		{ id: 'net_banking', label: 'Net Banking', checked: false, limits: emptyLimits() },
		{ id: 'wallets', label: 'Wallets', checked: false, limits: emptyLimits() },
		{ id: 'bank_transfer', label: 'Bank Transfer', checked: false, limits: emptyLimits() },
		{ id: 'bnpl', label: 'BNPL', checked: false, limits: emptyLimits() }
	]);

	let selectedTypes = $derived(txTypeOptions.filter((o) => o.checked));

	function removeType(id: string) {
		const opt = txTypeOptions.find((o) => o.id === id);
		if (opt) opt.checked = false;
	}

	// ── Commission Setup ──────────────────────────────────────────────────────

	const commissionMethodOptions = [
		{ value: 'flat_fee', label: 'Flat fee' },
		{ value: 'percentage', label: 'Percentage' },
		{ value: 'tiered', label: 'Tiered' },
		{ value: 'interchange', label: 'Interchange' }
	];

	function makeRow(): CommissionRow {
		return {
			id: `row-${Date.now()}-${Math.random()}`,
			baseAmount: '',
			method: 'flat_fee',
			gatewayFee: '',
			partnerFee: ''
		};
	}

	let commissionRows = $state<CommissionRow[]>([makeRow(), makeRow()]);

	function addCommissionRow() {
		commissionRows = [...commissionRows, makeRow()];
	}
	function removeCommissionRow(id: string) {
		commissionRows = commissionRows.filter((r) => r.id !== id);
	}

	// ── Virtual Accounts ──────────────────────────────────────────────────────

	const virtualAccounts = $derived(virtualAccountsStore.getAccounts(orgId, serviceType));

	function handleEditVA(vaId: string) {
		goto(resolve(`/management/organization/${orgId}/update-va/${vaId}?type=${fieldIdPrefix}`));
	}

	// ── Activation dialog ─────────────────────────────────────────────────────

	let showActivationDialog = $state(false);

	// ── VA search / filter ────────────────────────────────────────────────────

	let vaSearchQuery = $state('');
	let vaStatusFilter = $state('');
	let vaBankFilter = $state('');

	const filteredVAs = $derived(
		virtualAccounts.filter(
			(va) =>
				(!vaSearchQuery ||
					va.alias.toLowerCase().includes(vaSearchQuery.toLowerCase()) ||
					va.id.toLowerCase().includes(vaSearchQuery.toLowerCase())) &&
				(!vaStatusFilter || (va.active ? 'Active' : 'Inactive') === vaStatusFilter) &&
				(!vaBankFilter || va.bank === vaBankFilter)
		)
	);

	const uniqueBanks = $derived([...new Set(virtualAccounts.map((va) => va.bank))]);

	function clearVAFilters() {
		vaSearchQuery = '';
		vaStatusFilter = '';
		vaBankFilter = '';
	}

	const hasActiveFilters = $derived(
		vaSearchQuery !== '' || vaStatusFilter !== '' || vaBankFilter !== ''
	);

	function getConfigurationInput(): ConfigurationValidationInput {
		return {
			bankPipeline: selectedBankPipeline,
			securityDeposit: txConfig.securityDeposit,
			transactionLimit: txConfig.transactionLimit,
			dailyDepositLimit: txConfig.dailyDepositLimit,
			minTxAmount: txConfig.minTxAmount,
			maxTxAmount: txConfig.maxTxAmount,
			transactionTypes: txTypeOptions,
			commissionRows,
			requireCommission: showCommissionSetup
		};
	}

	function validateConfigurationForm(): boolean {
		errors = validateConfiguration(getConfigurationInput());
		return Object.keys(errors).length === 0;
	}

	function onFieldInput() {
		if (submitAttempted) validateConfigurationForm();
	}

	const configurationComplete = $derived(isConfigurationValid(getConfigurationInput()));

	const commissionComplete = $derived(configurationComplete);

	// ── Footer ────────────────────────────────────────────────────────────────

	function handleSaveDraft() {
		submitAttempted = true;
		if (!validateConfigurationForm()) {
			const message = firstValidationError(errors);
			if (message) toast.error(message);
			return;
		}
		toast.success('Configuration draft saved');
	}

	function handleActivateProfile() {
		submitAttempted = true;
		if (!validateConfigurationForm()) {
			const message = firstValidationError(errors);
			if (message) toast.error(message);
			return;
		}
		showActivationDialog = true;
	}

	function handleCreateVA() {
		goto(resolve(`/management/organization/${orgId}/create-va?type=${fieldIdPrefix}`));
	}
</script>

<!-- ─────────────────────────────────────────────────────────────────────────
     Section helper: shared card chrome
     "open layout" = no outer wrapper, each section floats independently
─────────────────────────────────────────────────────────────────────────── -->

<div class="flex flex-col gap-4">
	<!-- ── 1+2+3 — Configuration group (hidden when Active) ───────────────── -->
	{#if !isActive}
		<div class="flex flex-col gap-4" transition:slide={{ duration: 260, axis: 'y' }}>
			<!-- ── 1. Transaction Configuration ──────────────────────────── -->
			<section
				class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/40
				       transition-shadow duration-200 hover:shadow-md"
				in:fade={{ duration: 200 }}
			>
				<!-- header -->
				<div class="relative overflow-hidden px-5 py-4">
					<div class="gradient-soft absolute inset-0 opacity-50"></div>
					<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-primary/50"></div>
					<div class="relative flex items-center gap-3">
						<div
							class="flex size-8 shrink-0 items-center justify-center rounded-xl
						            bg-primary/12 text-primary shadow-xs ring-1 ring-primary/15"
						>
							<SlidersHorizontal class="size-4" />
						</div>
						<div>
							<p class="text-sm font-semibold tracking-tight">Transaction Configuration</p>
							<p class="text-xs text-muted-foreground/80">
								Set deposit limits and transaction boundaries
							</p>
						</div>
					</div>
				</div>

				<div class="border-t border-border/40 p-5 sm:p-6">
					<div class="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
						<div class="space-y-1.5">
							<label
								class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
							>
								Bank Pipeline
							</label>
							<Dropdown
								bind:value={selectedBankPipeline}
								options={bankPipelineOptions}
								placeholder="Select bank pipeline…"
								name={`${fieldIdPrefix}-bank-pipeline`}
							/>
							{#if submitAttempted && errors.bankPipeline}
								<p class="text-xs text-destructive">{errors.bankPipeline}</p>
							{/if}
						</div>

						{#each [{ id: 'tc-sd', label: 'Security Deposit (SD)', key: 'securityDeposit', ph: 'e.g. 10000' }, { id: 'tc-limit', label: 'Transaction Limit', key: 'transactionLimit', ph: 'e.g. 1000000' }, { id: 'tc-daily', label: 'Daily Deposit Limit', key: 'dailyDepositLimit', ph: 'e.g. 500000' }, { id: 'tc-min', label: 'Min Transaction Amount', key: 'minTxAmount', ph: 'e.g. 100' }, { id: 'tc-max', label: 'Max Transaction Amount', key: 'maxTxAmount', ph: 'e.g. 100000' }] as field (field.id)}
							<div class="space-y-1.5">
								<label
									for={field.id}
									class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
								>
									{field.label}
								</label>
								<Input
									id={field.id}
									inputmode="decimal"
									bind:value={txConfig[field.key as keyof typeof txConfig]}
									oninput={onFieldInput}
									placeholder={field.ph}
									class={cn(
										submitAttempted &&
											errors[field.key] &&
											'border-destructive focus-visible:ring-destructive/30'
									)}
								/>
								{#if submitAttempted && errors[field.key]}
									<p class="text-xs text-destructive">{errors[field.key]}</p>
								{/if}
							</div>
						{/each}

						<!-- Transaction Types -->
						<div class="space-y-2">
							<label
								for="tx-type-trigger"
								class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
							>
								Transaction Types
							</label>

							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									id="tx-type-trigger"
									class="flex h-9 w-full cursor-pointer items-center justify-between
									       rounded-lg border border-input bg-background px-3 text-sm
									       transition-colors hover:bg-muted/30
									       focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
								>
									{#if selectedTypes.length === 0}
										<span class="text-muted-foreground/60">Select transaction types…</span>
									{:else}
										<span class="font-medium">
											{selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''} selected
										</span>
									{/if}
									<ChevronDown
										class="size-4 shrink-0 text-muted-foreground/50 transition-transform"
									/>
								</DropdownMenu.Trigger>

								<DropdownMenu.Content align="start" class="min-w-48">
									{#each txTypeOptions as opt (opt.id)}
										<DropdownMenu.CheckboxItem bind:checked={opt.checked}>
											{opt.label}
										</DropdownMenu.CheckboxItem>
									{/each}
								</DropdownMenu.Content>
							</DropdownMenu.Root>

							{#if selectedTypes.length > 0}
								<div
									class="flex flex-wrap gap-2 pt-0.5"
									transition:slide={{ duration: 200, axis: 'y' }}
								>
									{#each selectedTypes as type (type.id)}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-primary/20
											       bg-primary/8 py-1 pr-2 pl-3 text-xs font-semibold text-primary
											       transition-all duration-150"
											in:fly={{ y: -4, duration: 180 }}
											out:fade={{ duration: 100 }}
										>
											{type.label}
											<button
												type="button"
												aria-label="Remove {type.label}"
												onclick={() => removeType(type.id)}
												class="flex size-4 items-center justify-center rounded-full
												       opacity-50 transition-all hover:bg-primary/20 hover:opacity-100"
											>
												<XIcon class="size-2.5" />
											</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>
						{#if submitAttempted && errors.transactionTypes}
							<p class="text-xs text-destructive">{errors.transactionTypes}</p>
						{/if}
					</div>
				</div>
			</section>

			<!-- ── 2. Transaction Limits by Method ───────────────────────── -->
			<section
				class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/40
				       transition-shadow duration-200 hover:shadow-md"
				in:fade={{ duration: 200 }}
			>
				<div class="relative overflow-hidden px-5 py-4">
					<div class="gradient-soft absolute inset-0 opacity-50"></div>
					<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-info/50"></div>
					<div class="relative flex items-center gap-3">
						<div
							class="flex size-8 shrink-0 items-center justify-center rounded-xl
						            bg-info/10 text-info shadow-xs ring-1 ring-info/15"
						>
							<TableIcon class="size-4" />
						</div>
						<div>
							<p class="text-sm font-semibold tracking-tight">Transaction Limits by Method</p>
							<p class="text-xs text-muted-foreground/80">
								Per-method caps auto-populate from selected types
							</p>
						</div>
					</div>
				</div>

				{#if selectedTypes.length === 0}
					<div
						class="flex flex-col items-center gap-3 border-t border-border/40 px-6 py-14 text-center"
						in:fade={{ duration: 180 }}
					>
						<div
							class="flex size-12 items-center justify-center rounded-2xl
						            border border-dashed border-info/25 bg-info/5"
						>
							<TableIcon class="size-5 text-info/25" />
						</div>
						<div class="max-w-xs">
							<p class="text-sm font-medium text-foreground/70">No payment methods selected</p>
							<p class="mt-1 text-xs leading-relaxed text-muted-foreground/70">
								Select transaction types above to configure per-method limits here.
							</p>
						</div>
					</div>
				{:else}
					<div class="border-t border-border/40" transition:slide={{ duration: 220 }}>
						<Table.Root>
							<Table.Header>
								<Table.Row class="border-b border-border/40 bg-muted/15 hover:bg-muted/15">
									<Table.Head
										class="pl-5 text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
										>Payment Method</Table.Head
									>
									<Table.Head
										class="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
										>Min Value</Table.Head
									>
									<Table.Head
										class="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
										>Max Value</Table.Head
									>
									<Table.Head
										class="pr-5 text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
										>Total Limit</Table.Head
									>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each selectedTypes as type (type.id)}
									<Table.Row
										class="border-b border-border/30 transition-colors last:border-0 hover:bg-muted/15"
									>
										<Table.Cell class="py-3.5 pl-5">
											<span
												class="inline-flex items-center rounded-full border border-primary/15
											             bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary"
											>
												{type.label}
											</span>
										</Table.Cell>
										<Table.Cell class="py-3.5">
											<Input
												inputmode="decimal"
												bind:value={type.limits.min}
												placeholder="Min"
												aria-label="Min for {type.label}"
												class="h-8 w-28 text-sm"
											/>
										</Table.Cell>
										<Table.Cell class="py-3.5">
											<Input
												inputmode="decimal"
												bind:value={type.limits.max}
												placeholder="Max"
												aria-label="Max for {type.label}"
												class="h-8 w-28 text-sm"
											/>
										</Table.Cell>
										<Table.Cell class="py-3.5 pr-5">
											<Input
												inputmode="decimal"
												bind:value={type.limits.total}
												placeholder="Total"
												aria-label="Total for {type.label}"
												class="h-8 w-28 text-sm"
											/>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
			</section>

			<!-- ── 3. Commission Setup ────────────────────────────────────── -->
			{#if showCommissionSetup}
				<section
					class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/40
				       transition-shadow duration-200 hover:shadow-md"
					in:fade={{ duration: 200 }}
				>
					<div class="relative overflow-hidden px-5 py-4">
						<div class="gradient-soft absolute inset-0 opacity-50"></div>
						<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-success/50"></div>
						<div class="relative flex items-center justify-between gap-3">
							<div class="flex items-center gap-3">
								<div
									class="flex size-8 shrink-0 items-center justify-center rounded-xl
							            bg-success/10 text-success shadow-xs ring-1 ring-success/15"
								>
									<Coins class="size-4" />
								</div>
								<div>
									<p class="text-sm font-semibold tracking-tight">Commission Setup</p>
									<p class="text-xs text-muted-foreground/80">
										Define fee slabs and commission structure
									</p>
								</div>
							</div>
							<Button variant="outline" size="sm" onclick={addCommissionRow} class="shrink-0">
								<PlusIcon class="size-3.5" />
								Add Row
							</Button>
						</div>
					</div>

					{#if commissionRows.length === 0}
						<div
							class="flex flex-col items-center gap-3 border-t border-border/40 px-6 py-14 text-center"
						>
							<div
								class="flex size-12 items-center justify-center rounded-2xl
						            border border-dashed border-success/25 bg-success/5"
							>
								<Coins class="size-5 text-success/25" />
							</div>
							<div class="max-w-xs">
								<p class="text-sm font-medium text-foreground/70">No commission slabs yet</p>
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground/70">
									Click "Add Row" to start configuring commission slabs.
								</p>
							</div>
							<Button variant="outline" size="sm" onclick={addCommissionRow}>
								<PlusIcon class="size-3.5" />
								Add First Row
							</Button>
						</div>
					{:else}
						<div class="border-t border-border/40">
							<div class="space-y-2.5 p-5 sm:p-6">
								{#each commissionRows as row, i (row.id)}
									<div
										class="group relative overflow-hidden rounded-xl bg-muted/15
									       ring-1 ring-border/30 transition-all duration-200
									       hover:bg-muted/25 hover:shadow-sm hover:ring-border/50"
										in:fly={{ y: -6, duration: 200 }}
										out:slide={{ duration: 150 }}
									>
										<!-- Row strip -->
										<div
											class="flex items-center justify-between
									            border-b border-border/25 px-4 py-2"
										>
											<div class="flex items-center gap-2">
												<span
													class="flex size-5 items-center justify-center rounded-full
											             bg-primary/12 text-[10px] font-bold text-primary"
												>
													{i + 1}
												</span>
												<span class="text-xs font-medium text-muted-foreground/60"
													>Commission Slab</span
												>
											</div>
											<button
												type="button"
												aria-label="Remove commission row {i + 1}"
												onclick={() => removeCommissionRow(row.id)}
												class="flex size-6 items-center justify-center rounded-lg
											       text-muted-foreground/30 opacity-0 transition-all
											       group-hover:opacity-100 hover:bg-destructive/10
											       hover:text-destructive"
											>
												<Trash2Icon class="size-3.5" />
											</button>
										</div>

										<div class="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
											<div class="space-y-1.5">
												<label
													for="cr-base-{row.id}"
													class="block text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
												>
													Base Amount
												</label>
												<Input
													id="cr-base-{row.id}"
													inputmode="decimal"
													bind:value={row.baseAmount}
													placeholder="e.g. 1000"
													class="h-9 text-sm"
												/>
											</div>
											<div class="space-y-1.5">
												<label
													for="cr-method-{row.id}"
													class="block text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
												>
													Method
												</label>
												<Dropdown
													bind:value={row.method}
													options={commissionMethodOptions}
													placeholder="Select"
												/>
											</div>
											<div class="space-y-1.5">
												<label
													for="cr-gfee-{row.id}"
													class="block text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
												>
													Gateway Fee
												</label>
												<Input
													id="cr-gfee-{row.id}"
													inputmode="decimal"
													bind:value={row.gatewayFee}
													placeholder="e.g. 2.5"
													class="h-9 text-sm"
												/>
											</div>
											<div class="space-y-1.5">
												<label
													for="cr-pfee-{row.id}"
													class="block text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase"
												>
													Partner Fee
												</label>
												<Input
													id="cr-pfee-{row.id}"
													inputmode="decimal"
													bind:value={row.partnerFee}
													placeholder="e.g. 1.5"
													class="h-9 text-sm"
												/>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</section>
			{/if}
		</div>
	{/if}

	{#if isActive}
		<!-- ── Virtual Accounts (shown only after service activation) ─────────── -->
		<div class="space-y-4" in:fade={{ duration: 200 }}>
			<div
				class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
				in:fade={{ duration: 150 }}
			>
				<div class="relative min-w-0 w-full sm:flex-1">
					<Search
						class="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/40"
					/>
					<input
						bind:value={vaSearchQuery}
						placeholder="Search by alias or ID…"
						class="h-9 w-full rounded-lg border border-input bg-background
						       pr-3 pl-8 text-sm transition-shadow
						       placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-ring/50 focus:outline-none
						       sm:h-8"
					/>
				</div>
				<div class="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
					<select
						bind:value={vaStatusFilter}
						class="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-xs
						       text-foreground focus:ring-2 focus:ring-ring/50 focus:outline-none
						       sm:h-8 sm:w-auto"
					>
						<option value="">All statuses</option>
						<option value="Active">Active</option>
						<option value="Inactive">Inactive</option>
					</select>
					<select
						bind:value={vaBankFilter}
						class="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-xs
						       text-foreground focus:ring-2 focus:ring-ring/50 focus:outline-none
						       sm:h-8 sm:w-auto"
					>
						<option value="">All banks</option>
						{#each uniqueBanks as bank (bank)}
							<option value={bank}>{bank}</option>
						{/each}
					</select>
				</div>
				{#if hasActiveFilters}
					<button
						type="button"
						onclick={clearVAFilters}
						class="self-start text-xs font-medium text-primary transition-colors hover:underline sm:self-auto"
						in:fade={{ duration: 150 }}
					>
						Clear filters
					</button>
				{/if}
			</div>

			{#if filteredVAs.length === 0 && hasActiveFilters}
				<div
					class="flex flex-col items-center gap-3 py-8 text-center sm:py-12"
					in:fade={{ duration: 180 }}
				>
					<div
						class="flex size-12 items-center justify-center rounded-2xl
						            border border-dashed border-border bg-muted/15"
					>
						<Search class="size-5 text-muted-foreground/30" />
					</div>
					<div class="max-w-xs">
						<p class="text-sm font-medium text-foreground/70">No accounts match your filters</p>
						<p class="mt-1 text-xs text-muted-foreground/55">
							Try adjusting the search term or clearing the filters.
						</p>
					</div>
					<button
						type="button"
						onclick={clearVAFilters}
						class="text-xs font-semibold text-primary hover:underline"
					>
						Clear all filters
					</button>
				</div>
			{:else}
				<div
					class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
					in:fade={{ duration: 180 }}
				>
					<button
						type="button"
						class="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 bg-card p-6 shadow-sm transition-all duration-200 hover:bg-primary/5"
						onclick={handleCreateVA}
					>
						<div
							class="flex size-10 items-center justify-center rounded-full border border-dashed border-primary/40 bg-primary/10 shadow-sm transition-colors"
						>
							<PlusIcon class="size-5 text-primary" />
						</div>
						<span class="text-sm font-medium text-foreground">Create VA</span>
					</button>

					{#each filteredVAs as va, index (va.id)}
						<VaAccountCard account={va} colorIndex={index} onedit={() => handleEditVA(va.id)} />
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Activation dialog ──────────────────────────────────────────────── -->
	<ActivateOrgDialog
		{orgName}
		open={showActivationDialog}
		onclose={() => (showActivationDialog = false)}
		onconfirm={async () => {
			await onactivate?.();
			setTimeout(() => {
				(document.activeElement as HTMLElement)?.blur();
			}, 0);
		}}
	/>

	<!-- ── Sticky footer (hidden entirely when Active) ────────────────────── -->
	{#if !isActive}
		<div
			class="sticky bottom-0 z-10 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6"
			transition:slide={{ duration: 220, axis: 'y' }}
		>
			<div class="border-t border-border/50 bg-card/96 px-4 py-3 backdrop-blur-sm sm:px-6">
				<div class="flex items-center justify-between gap-3">
					<p class="hidden text-xs text-muted-foreground/60 sm:block">
						{!commissionComplete
							? `Complete ${serviceLabel.toLowerCase()} configuration to activate.`
							: `Review ${serviceLabel.toLowerCase()} settings before activating this service profile.`}
					</p>
					<div class="flex w-full items-center justify-end gap-2.5 sm:w-auto">
						<!-- Save Draft: always visible when not Active -->
						<Button variant="outline" size="sm" onclick={handleSaveDraft} class="h-9 px-4">
							Save Draft
						</Button>

						<!-- Activate Profile: visible until org is Active -->
						{#if !isActive}
							<div class="flex flex-col items-end gap-0.5">
								<Button
									size="sm"
									onclick={handleActivateProfile}
									title={!commissionComplete ? 'Complete configuration to activate' : undefined}
									class="h-9 px-4"
								>
									<ShieldCheck class="size-4" />
									Activate {serviceLabel} Profile
								</Button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
