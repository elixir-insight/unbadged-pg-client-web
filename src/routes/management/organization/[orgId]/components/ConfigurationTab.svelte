<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { Input } from '$lib/components/reusable';
	import { Dropdown } from '$lib/components/reusable';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ActivationDrawer from './ActivationDrawer.svelte';
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
		LockIcon,
		PencilIcon,
		CheckCircle2,
		Search
	} from '$lib/assets/icons';
	import { slide, fade, fly } from 'svelte/transition';
	import type { VirtualAccount } from '../types';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

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
		orgStatus?: string;
		onactivate?: () => Promise<void>;
	}

	const { orgId = '', orgStatus = '', onactivate }: Props = $props();

	// ── Status flags ──────────────────────────────────────────────────────────

	const normalizedOrgStatus = $derived(orgStatus.toUpperCase().replace(/\s+/g, '_'));
	const isApproved = $derived(normalizedOrgStatus === 'APPROVED');
	const isActive = $derived(normalizedOrgStatus === 'ACTIVE');

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

	let virtualAccounts = $state<VirtualAccount[]>([
		{
			id: 'VA-7821',
			alias: 'Primary collections',
			accountNumber: 'XXXX 4421 9912',
			bank: 'Pinnacle Trust',
			active: true
		},
		{
			id: 'VA-7822',
			alias: 'Subscriptions',
			accountNumber: 'XXXX 4421 9913',
			bank: 'Pinnacle Trust',
			active: true
		},
		{
			id: 'VA-7823',
			alias: 'Refund pool',
			accountNumber: 'XXXX 4421 9914',
			bank: 'Pinnacle Trust',
			active: false
		}
	]);

	function toggleVA(id: string) {
		const va = virtualAccounts.find((v) => v.id === id);
		if (va) va.active = !va.active;
	}

	function deleteVA(id: string) {
		virtualAccounts = virtualAccounts.filter((v) => v.id !== id);
	}

	// ── Activation drawer ─────────────────────────────────────────────────────

	let showActivationDrawer = $state(false);

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

	const commissionComplete = $derived(
		commissionRows.length > 0 &&
			commissionRows.every(
				(r) =>
					r.baseAmount.trim() !== '' && r.gatewayFee.trim() !== '' && r.partnerFee.trim() !== ''
			)
	);

	// ── Footer ────────────────────────────────────────────────────────────────

	function handleSaveDraft() {
		console.log('Save draft:', { txConfig, selectedTypes, commissionRows });
	}

	function handleCreateVA() {
		goto(resolve(`/management/organization/${orgId}/va/create`));
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
									placeholder={field.ph}
								/>
							</div>
						{/each}

						<!-- Transaction Types — spans full row -->
						<div class="space-y-2 sm:col-span-2 lg:col-span-3">
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
		</div>
	{/if}

	<!-- ── 4. Virtual Account Management (hidden when Approved) ───────────── -->
	{#if !isApproved}
		<section
			class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/40
			       transition-shadow duration-200 hover:shadow-md"
			transition:slide={{ duration: 260, axis: 'y' }}
		>
			<!-- Header -->
			<div class="relative overflow-hidden px-6 py-5">
				<div class="gradient-soft absolute inset-0 opacity-50"></div>
				<div
					class="absolute inset-y-0 left-0 w-0.5 rounded-full
				     {isActive ? 'bg-success/60' : 'bg-warning/50'}"
				></div>
				<div class="relative flex items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<div
							class="flex size-9 shrink-0 items-center justify-center rounded-xl shadow-xs
						     {isActive
								? 'bg-success/10 text-success ring-1 ring-success/15'
								: 'bg-warning/10 text-warning ring-1 ring-warning/15'}"
						>
							{#if isActive}
								<CheckCircle2 class="size-4.5" />
							{:else}
								<LockIcon class="size-4.5" />
							{/if}
						</div>
						<div>
							<p class="text-sm font-semibold">Virtual Account Management</p>
							<p class="mt-0.5 text-xs text-muted-foreground/65">
								{#if isActive}
									{virtualAccounts.length} account{virtualAccounts.length !== 1 ? 's' : ''} · Manage virtual
									accounts for this organization
								{:else}
									Activate to unlock virtual account creation
								{/if}
							</p>
						</div>
					</div>
					{#if isActive}
						<Button
							class="gradient-primary shrink-0 px-4 text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
							size="sm"
							onclick={handleCreateVA}
						>
							<PlusIcon class="size-3.5" />
							+ Create VA
						</Button>
					{/if}
				</div>
			</div>

			{#if !isActive}
				<!-- Locked state -->
				<div
					class="flex flex-col items-center gap-4 border-t border-border/40 px-6 py-12 text-center"
					in:fade={{ duration: 200 }}
				>
					<div
						class="flex size-14 items-center justify-center rounded-2xl
					            border border-dashed border-warning/30 bg-warning/5"
					>
						<LockIcon class="size-6 text-warning/40" />
					</div>
					<div class="max-w-xs">
						<p class="text-sm font-semibold">Virtual accounts are locked</p>
						<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground/65">
							Activate this organization to unlock virtual account creation and management.
						</p>
					</div>
					<div class="flex flex-col items-center gap-1.5">
						<Button
							class="gradient-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
							onclick={commissionComplete ? () => (showActivationDrawer = true) : undefined}
							disabled={!commissionComplete}
						>
							<ShieldCheck class="size-4" />
							Activate Organization
						</Button>
						{#if !commissionComplete}
							<p class="text-[11px] text-muted-foreground/50">
								Complete commission setup above to activate
							</p>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Search + filter bar -->
				<div
					class="flex flex-wrap items-center gap-3 border-t border-border/30 px-6 py-3"
					in:fade={{ duration: 150 }}
				>
					<div class="relative min-w-0 flex-1">
						<Search
							class="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/40"
						/>
						<input
							bind:value={vaSearchQuery}
							placeholder="Search by alias or ID…"
							class="h-8 w-full min-w-40 rounded-lg border border-input bg-background
							       pr-3 pl-8 text-sm transition-shadow
							       placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-ring/50 focus:outline-none"
						/>
					</div>
					<select
						bind:value={vaStatusFilter}
						class="h-8 rounded-lg border border-input bg-background px-2.5 text-xs
						       text-foreground focus:ring-2 focus:ring-ring/50 focus:outline-none"
					>
						<option value="">All statuses</option>
						<option value="Active">Active</option>
						<option value="Inactive">Inactive</option>
					</select>
					<select
						bind:value={vaBankFilter}
						class="h-8 rounded-lg border border-input bg-background px-2.5 text-xs
						       text-foreground focus:ring-2 focus:ring-ring/50 focus:outline-none"
					>
						<option value="">All banks</option>
						{#each uniqueBanks as bank (bank)}
							<option value={bank}>{bank}</option>
						{/each}
					</select>
					{#if hasActiveFilters}
						<button
							type="button"
							onclick={clearVAFilters}
							class="text-xs font-medium text-primary transition-colors hover:underline"
							in:fade={{ duration: 150 }}
						>
							Clear filters
						</button>
					{/if}
				</div>

				{#if filteredVAs.length === 0}
					<!-- Empty / no-results state -->
					<div
						class="flex flex-col items-center gap-4 border-t border-border/30 px-6 py-12 text-center"
						in:fade={{ duration: 180 }}
					>
						{#if hasActiveFilters}
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
						{:else}
							<div
								class="flex size-12 items-center justify-center rounded-2xl
							            border border-dashed border-border bg-muted/15"
							>
								<CheckCircle2 class="size-5 text-muted-foreground/25" />
							</div>
							<div class="max-w-xs">
								<p class="text-sm font-medium text-foreground/70">No virtual accounts yet</p>
								<p class="mt-1 text-xs text-muted-foreground/55">
									Create your first virtual account to start routing payments.
								</p>
							</div>
							<Button
								size="sm"
								class="gradient-primary px-4 text-primary-foreground shadow-sm"
								onclick={handleCreateVA}
							>
								<PlusIcon class="size-3.5" />
								Create First VA
							</Button>
						{/if}
					</div>
				{:else}
					<!-- VA table -->
					<div class="border-t border-border/30" in:fade={{ duration: 180 }}>
						<Table.Root>
							<Table.Header>
								<Table.Row class="border-b border-border/40 bg-muted/20 hover:bg-muted/20">
									<Table.Head
										class="py-3 pl-6 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
										>Alias</Table.Head
									>
									<Table.Head
										class="py-3 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
										>Account Number</Table.Head
									>
									<Table.Head
										class="py-3 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
										>Bank</Table.Head
									>
									<Table.Head
										class="py-3 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
										>Status</Table.Head
									>
									<Table.Head
										class="py-3 pr-6 text-right text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
										>Actions</Table.Head
									>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each filteredVAs as va (va.id)}
									<Table.Row
										class="group border-b border-border/25 transition-colors last:border-0 hover:bg-muted/15"
									>
										<!-- Alias + VA ID sub-line -->
										<Table.Cell class="py-4 pl-6">
											<div>
												<p class="text-sm font-semibold">{va.alias}</p>
												<p class="mt-0.5 font-mono text-[11px] text-primary/70">{va.id}</p>
											</div>
										</Table.Cell>
										<!-- Account Number -->
										<Table.Cell class="py-4">
											<span class="font-mono text-sm font-medium tracking-wide"
												>{va.accountNumber}</span
											>
										</Table.Cell>
										<!-- Bank -->
										<Table.Cell class="py-4">
											<span class="text-sm text-muted-foreground">{va.bank}</span>
										</Table.Cell>
										<!-- Status toggle -->
										<Table.Cell class="py-4">
											<div class="flex items-center gap-2.5">
												<button
													type="button"
													role="switch"
													aria-checked={va.active}
													aria-label="Toggle {va.alias}"
													onclick={() => toggleVA(va.id)}
													class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full
													       border-2 border-transparent transition-colors duration-200
													       focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
													       {va.active ? 'bg-primary' : 'bg-muted-foreground/25'}"
												>
													<span
														class="pointer-events-none inline-block size-4 rounded-full bg-white
														       shadow-sm transition-transform duration-200
														       {va.active ? 'translate-x-4' : 'translate-x-0'}"
													></span>
												</button>
												<span
													class="text-xs font-semibold
												     {va.active ? 'text-success' : 'text-muted-foreground/45'}"
												>
													{va.active ? 'Active' : 'Inactive'}
												</span>
											</div>
										</Table.Cell>
										<!-- Actions (hidden until row hover) -->
										<Table.Cell class="py-4 pr-6">
											<div
												class="flex items-center justify-end gap-0.5 opacity-0
												       transition-opacity group-hover:opacity-100"
											>
												<button
													type="button"
													aria-label="Edit {va.alias}"
													onclick={() =>
														goto(resolve(`/management/organization/${orgId}/va/${va.id}`))}
													class="rounded-lg p-1.5 text-muted-foreground/50 transition-colors
													       hover:bg-muted hover:text-foreground"
												>
													<PencilIcon class="size-3.5" />
												</button>
												<button
													type="button"
													aria-label="Delete {va.alias}"
													onclick={() => deleteVA(va.id)}
													class="rounded-lg p-1.5 text-muted-foreground/50 transition-colors
													       hover:bg-destructive/10 hover:text-destructive"
												>
													<Trash2Icon class="size-3.5" />
												</button>
											</div>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
			{/if}
		</section>
	{/if}

	<!-- ── Activation drawer ──────────────────────────────────────────────── -->
	<ActivationDrawer
		open={showActivationDrawer}
		onclose={() => (showActivationDrawer = false)}
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
							? 'Complete commission setup to activate.'
							: isApproved
								? 'Organization approved — save any configuration changes below.'
								: 'Review all settings before activating the organization profile.'}
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
									class="gradient-primary h-9 px-4 text-primary-foreground shadow-sm
									       transition-all hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
									// onclick={commissionComplete ? () => (showActivationDrawer = true) : undefined}
									// disabled={!commissionComplete}
									onclick={() => (showActivationDrawer = true)}
									title={!commissionComplete ? 'Complete commission setup to activate' : undefined}
								>
									<ShieldCheck class="size-4" />
									Activate Profile
								</Button>
								{#if !commissionComplete}
									<p class="text-[11px] text-muted-foreground/50">Complete commission setup</p>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
