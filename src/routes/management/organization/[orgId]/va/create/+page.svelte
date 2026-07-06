<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { fly, fade } from 'svelte/transition';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Button } from '$lib/components/reusable';
	import { Input } from '$lib/components/reusable';
	import { Dropdown } from '$lib/components/reusable';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import {
		ArrowLeft,
		ChevronDown,
		XIcon,
		PlusIcon,
		Trash2Icon,
		Coins,
		TableIcon,
		SlidersHorizontal,
		Info,
		Loader2,
		ShieldCheck
	} from '$lib/assets/icons';
	import type { CommissionTier } from '../../types';

	const orgId = $derived(page.params.orgId ?? '');

	// ── Steps ─────────────────────────────────────────────────────────────────

	const steps = [
		{ label: 'Pipeline', description: 'Banking pipeline & transaction types' },
		{ label: 'Limits', description: 'Transaction amount boundaries' },
		{ label: 'Methods', description: 'Per-method caps' },
		{ label: 'Commission', description: 'Fee slabs & commission structure' }
	];

	let currentStep = $state(0);
	let submitting = $state(false);

	// ── Step 1 — Banking Pipeline ─────────────────────────────────────────────

	const pipelineOptions = [
		{ value: 'MOCK', label: 'MOCK' },
		{ value: 'HDFC', label: 'HDFC' },
		{ value: 'ICICI', label: 'ICICI' },
		{ value: 'AXIS', label: 'Axis Bank' },
		{ value: 'YES', label: 'Yes Bank' }
	];

	interface TxTypeOption {
		id: string;
		label: string;
		subtitle: string;
		checked: boolean;
		limits: { min: string; max: string; total: string };
	}

	let selectedPipeline = $state('MOCK');

	let txTypeOptions = $state<TxTypeOption[]>([
		{
			id: 'IMPS',
			label: 'IMPS',
			subtitle: 'Immediate Payment',
			checked: false,
			limits: { min: '', max: '', total: '' }
		},
		{
			id: 'NEFT',
			label: 'NEFT',
			subtitle: 'Electronic Funds Transfer',
			checked: false,
			limits: { min: '', max: '', total: '' }
		},
		{
			id: 'RTGS',
			label: 'RTGS',
			subtitle: 'Real Time Settlement',
			checked: false,
			limits: { min: '', max: '', total: '' }
		},
		{
			id: 'UPI',
			label: 'UPI',
			subtitle: 'Unified Payments Interface',
			checked: false,
			limits: { min: '', max: '', total: '' }
		},
		{
			id: 'cards',
			label: 'Cards',
			subtitle: 'Credit & Debit Cards',
			checked: false,
			limits: { min: '', max: '', total: '' }
		},
		{
			id: 'net_banking',
			label: 'Net Banking',
			subtitle: 'Internet Banking',
			checked: false,
			limits: { min: '', max: '', total: '' }
		},
		{
			id: 'wallets',
			label: 'Wallets',
			subtitle: 'Digital Wallets',
			checked: false,
			limits: { min: '', max: '', total: '' }
		}
	]);

	const selectedTypes = $derived(txTypeOptions.filter((o) => o.checked));

	function removeType(id: string) {
		const opt = txTypeOptions.find((o) => o.id === id);
		if (opt) opt.checked = false;
	}

	// ── Step 2 — Limits ───────────────────────────────────────────────────────

	let limits = $state({
		transactionLimit: '',
		dailyDepositLimit: '',
		minTxAmount: '',
		maxTxAmount: ''
	});

	const limitFields = [
		{
			id: 'l-txlimit',
			key: 'transactionLimit' as const,
			label: 'Transaction Limit',
			ph: 'e.g. 1000000',
			helper: 'Maximum per transaction'
		},
		{
			id: 'l-daily',
			key: 'dailyDepositLimit' as const,
			label: 'Daily Deposit Limit',
			ph: 'e.g. 500000',
			helper: 'Rolling 24-hour cap'
		},
		{
			id: 'l-min',
			key: 'minTxAmount' as const,
			label: 'Min Transaction Amount',
			ph: 'e.g. 100',
			helper: 'Minimum accepted per txn'
		},
		{
			id: 'l-max',
			key: 'maxTxAmount' as const,
			label: 'Max Transaction Amount',
			ph: 'e.g. 100000',
			helper: 'Maximum accepted per txn'
		}
	];

	// ── Step 4 — Commission ───────────────────────────────────────────────────

	const commissionMethodOptions = [
		{ value: 'flatrate_inr', label: 'Flatrate ₹' },
		{ value: 'percentage', label: 'Percentage %' },
		{ value: 'tiered', label: 'Tiered' }
	];

	function makeTier(): CommissionTier {
		return {
			id: `tier-${Date.now()}-${Math.random()}`,
			baseAmount: '',
			method: 'flatrate_inr',
			gatewayFee: '',
			partnerFee: ''
		};
	}

	let commissionTiers = $state<CommissionTier[]>([makeTier(), makeTier()]);

	function addTier() {
		commissionTiers = [...commissionTiers, makeTier()];
	}
	function removeTier(id: string) {
		commissionTiers = commissionTiers.filter((t) => t.id !== id);
	}

	const commissionGatewayTotal = $derived(
		commissionTiers.reduce((s, r) => s + (parseFloat(r.gatewayFee) || 0), 0)
	);
	const commissionPartnerTotal = $derived(
		commissionTiers.reduce((s, r) => s + (parseFloat(r.partnerFee) || 0), 0)
	);

	// ── canProceed per step ────────────────────────────────────────────────────

	const canProceed = $derived(
		[
			selectedPipeline !== '',
			limits.transactionLimit !== '' && limits.dailyDepositLimit !== '',
			true,
			commissionTiers.length > 0 &&
				commissionTiers.every(
					(r) => r.baseAmount !== '' && r.gatewayFee !== '' && r.partnerFee !== ''
				)
		][currentStep]
	);

	// ── Navigation ────────────────────────────────────────────────────────────

	function handleCancel() {
		goto(resolve('/management/organization/[orgId]/configuration/payout', { orgId }));
	}

	async function handleSubmit() {
		submitting = true;
		await new Promise<void>((res) => setTimeout(res, 900));
		submitting = false;
		toast.success('Virtual account created successfully');
		goto(resolve('/management/organization/[orgId]/configuration/payout', { orgId }));
	}
</script>

<div class="-m-5 flex min-h-full flex-col">
	<!-- ── Sticky page header + stepper ──────────────────────────────────── -->
	<div class="sticky top-0 z-20 border-b border-border/50 bg-card/98 backdrop-blur-sm">
		<!-- Breadcrumb + title -->
		<div class="flex items-center gap-4 px-6 py-4">
			<button
				type="button"
				onclick={handleCancel}
				class="flex size-8 shrink-0 items-center justify-center rounded-lg
				       text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<ArrowLeft class="size-4" />
			</button>
			<div class="min-w-0">
				<p class="text-xs text-muted-foreground/60">{orgId} · Organizations</p>
				<h1 class="text-base font-bold tracking-tight">Create Virtual Account</h1>
			</div>
		</div>

		<!-- Stepper bar -->
		<div class="flex items-center border-t border-border/30 px-6 py-3.5">
			{#each steps as step, i (i)}
				{@const done = currentStep > i}
				{@const active = currentStep === i}

				<div class="flex min-w-0 flex-1 items-center">
					<div class="flex shrink-0 flex-col items-center gap-1.5">
						<div
							class="flex size-7 items-center justify-center rounded-full text-[11px] font-bold
							       transition-colors duration-200
							       {done ? 'bg-success text-success-foreground' : ''}
							       {active ? 'gradient-primary text-primary-foreground' : ''}
							       {!done && !active ? 'bg-muted text-muted-foreground/40' : ''}"
						>
							{#if done}✓{:else}{i + 1}{/if}
						</div>
						<span
							class="hidden text-[11px] transition-colors duration-200 sm:block
							       {active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground/50'}"
						>
							{step.label}
						</span>
					</div>

					{#if i < steps.length - 1}
						<div
							class="mx-3 h-px flex-1 transition-colors duration-300
						            {done ? 'bg-success/40' : 'bg-border/40'}"
						></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- ── Step content ───────────────────────────────────────────────────── -->
	<div class="flex-1 px-4 py-6 sm:px-6">
		<div class="mx-auto max-w-2xl">
			{#key currentStep}
				<div in:fly={{ y: 10, duration: 220, easing: cubicOut }} out:fade={{ duration: 80 }}>
					<!-- Step 1: Banking Pipeline -->
					{#if currentStep === 0}
						<div class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30">
							<div class="relative overflow-hidden px-6 py-5">
								<div class="gradient-soft absolute inset-0 opacity-40"></div>
								<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-primary/50"></div>
								<div class="relative flex items-center gap-3">
									<div
										class="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15"
									>
										<SlidersHorizontal class="size-4" />
									</div>
									<div>
										<p class="text-sm font-semibold">Banking Pipeline</p>
										<p class="mt-0.5 text-xs text-muted-foreground/65">
											Pick the pipeline that will host this virtual account
										</p>
									</div>
								</div>
							</div>

							<div class="border-t border-border/30 p-6">
								<div class="grid gap-5 sm:grid-cols-2">
									<div class="space-y-2">
										<label class="text-xs font-medium text-muted-foreground">Banking Pipeline</label
										>
										<Dropdown
											bind:value={selectedPipeline}
											options={pipelineOptions}
											placeholder="Select pipeline…"
											class="h-10"
										/>
										<p class="text-[11px] text-muted-foreground/55">
											The provider that processes transactions for this VA.
										</p>
									</div>

									<div class="space-y-2">
										<label class="text-xs font-medium text-muted-foreground"
											>Transaction Types</label
										>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												class="flex h-10 w-full cursor-pointer items-center justify-between rounded-lg
												       border border-input bg-background px-3 text-sm transition-colors
												       hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
											>
												{#if selectedTypes.length === 0}
													<span class="text-muted-foreground/60">Select types…</span>
												{:else}
													<span class="font-medium"
														>{selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''} selected</span
													>
												{/if}
												<ChevronDown class="size-4 shrink-0 text-muted-foreground/50" />
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="start" class="min-w-52">
												{#each txTypeOptions as opt (opt.id)}
													<DropdownMenu.CheckboxItem bind:checked={opt.checked}>
														<span class="font-semibold">{opt.label}</span>
														<span class="ml-1.5 text-xs text-muted-foreground"
															>— {opt.subtitle}</span
														>
													</DropdownMenu.CheckboxItem>
												{/each}
											</DropdownMenu.Content>
										</DropdownMenu.Root>
										<p class="text-[11px] text-muted-foreground/55">
											Carry over to per-method limits in Step 3.
										</p>
									</div>
								</div>

								{#if selectedTypes.length > 0}
									<div
										class="mt-4 flex flex-wrap gap-2"
										transition:slide={{ duration: 200, axis: 'y' }}
									>
										{#each selectedTypes as type (type.id)}
											<span
												class="inline-flex items-center gap-1.5 rounded-full border border-primary/20
												       bg-primary/8 py-1 pr-2 pl-3 text-xs font-semibold text-primary"
												in:fly={{ y: -4, duration: 160 }}
												out:fade={{ duration: 100 }}
											>
												{type.label}
												<button
													type="button"
													aria-label="Remove {type.label}"
													onclick={() => removeType(type.id)}
													class="flex size-4 items-center justify-center rounded-full opacity-50
												               transition-all hover:bg-primary/20 hover:opacity-100"
												>
													<XIcon class="size-2.5" />
												</button>
											</span>
										{/each}
									</div>
								{/if}

								<div class="mt-5 flex items-start gap-2 rounded-xl bg-muted/30 px-4 py-3">
									<Info class="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
									<p class="text-xs leading-relaxed text-muted-foreground/65">
										Select at least one transaction type to configure per-method limits in Step 3.
										You can adjust these after creation.
									</p>
								</div>
							</div>
						</div>

						<!-- Step 2: Limits -->
					{:else if currentStep === 1}
						<div class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30">
							<div class="relative overflow-hidden px-6 py-5">
								<div class="gradient-soft absolute inset-0 opacity-40"></div>
								<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-info/50"></div>
								<div class="relative flex items-center gap-3">
									<div
										class="flex size-9 items-center justify-center rounded-xl bg-info/10 text-info ring-1 ring-info/15"
									>
										<TableIcon class="size-4" />
									</div>
									<div>
										<p class="text-sm font-semibold">Limits</p>
										<p class="mt-0.5 text-xs text-muted-foreground/65">
											Overall caps applied across this virtual account
										</p>
									</div>
								</div>
							</div>

							<div class="border-t border-border/30 p-6">
								<p
									class="mb-4 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
								>
									Amount Boundaries
								</p>
								<div class="grid gap-5 sm:grid-cols-2">
									{#each limitFields as field (field.id)}
										<div class="space-y-2">
											<label for={field.id} class="text-xs font-medium text-muted-foreground"
												>{field.label}</label
											>
											<div class="relative">
												<span
													class="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground/50"
													>₹</span
												>
												<Input
													id={field.id}
													inputmode="decimal"
													bind:value={limits[field.key]}
													placeholder={field.ph}
													class="h-10 pl-7"
												/>
											</div>
											<p class="text-[11px] text-muted-foreground/50">{field.helper}</p>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- Step 3: Per-method Limits -->
					{:else if currentStep === 2}
						<div class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30">
							<div class="relative overflow-hidden px-6 py-5">
								<div class="gradient-soft absolute inset-0 opacity-40"></div>
								<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-warning/50"></div>
								<div class="relative flex items-center gap-3">
									<div
										class="flex size-9 items-center justify-center rounded-xl bg-warning/10 text-warning ring-1 ring-warning/15"
									>
										<TableIcon class="size-4" />
									</div>
									<div>
										<p class="text-sm font-semibold">Per-method Limits</p>
										<p class="mt-0.5 text-xs text-muted-foreground/65">
											Tune min, max and total caps for each selected type
										</p>
									</div>
								</div>
							</div>

							{#if selectedTypes.length === 0}
								<div
									class="flex flex-col items-center gap-4 border-t border-border/30 px-6 py-14 text-center"
								>
									<div
										class="flex size-14 items-center justify-center rounded-2xl border-2 border-dashed border-warning/30 bg-warning/5"
									>
										<TableIcon class="size-6 text-warning/40" />
									</div>
									<div class="max-w-xs">
										<p class="text-sm font-semibold">No transaction types selected</p>
										<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground/60">
											Go back to Step 1 and select at least one transaction type to configure
											per-method limits.
										</p>
									</div>
									<button
										type="button"
										onclick={() => (currentStep = 0)}
										class="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
									>
										<ArrowLeft class="size-3.5" />
										Back to Step 1
									</button>
								</div>
							{:else}
								<div class="border-t border-border/30" transition:slide={{ duration: 220 }}>
									<Table.Root>
										<Table.Header>
											<Table.Row class="border-b border-border/40 bg-muted/20 hover:bg-muted/20">
												<Table.Head
													class="py-3 pl-6 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
													>Method</Table.Head
												>
												<Table.Head
													class="py-3 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
													>Min (₹)</Table.Head
												>
												<Table.Head
													class="py-3 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
													>Max (₹)</Table.Head
												>
												<Table.Head
													class="py-3 pr-6 text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
													>Total (₹)</Table.Head
												>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each selectedTypes as type (type.id)}
												<Table.Row
													class="border-b border-border/25 last:border-0 hover:bg-muted/10"
												>
													<Table.Cell class="py-3.5 pl-6">
														<div>
															<span
																class="inline-flex items-center rounded-md border border-primary/15 bg-primary/8 px-2.5 py-0.5 text-xs font-bold text-primary"
															>
																{type.label}
															</span>
															<p class="mt-0.5 text-[11px] text-muted-foreground/50">
																{type.subtitle}
															</p>
														</div>
													</Table.Cell>
													<Table.Cell class="py-3.5">
														<Input
															inputmode="decimal"
															bind:value={type.limits.min}
															placeholder="Min"
															aria-label="Min for {type.label}"
															class="h-9 w-28 text-sm"
														/>
													</Table.Cell>
													<Table.Cell class="py-3.5">
														<Input
															inputmode="decimal"
															bind:value={type.limits.max}
															placeholder="Max"
															aria-label="Max for {type.label}"
															class="h-9 w-28 text-sm"
														/>
													</Table.Cell>
													<Table.Cell class="py-3.5 pr-6">
														<Input
															inputmode="decimal"
															bind:value={type.limits.total}
															placeholder="Total"
															aria-label="Total for {type.label}"
															class="h-9 w-28 text-sm"
														/>
													</Table.Cell>
												</Table.Row>
											{/each}
										</Table.Body>
									</Table.Root>
								</div>
							{/if}
						</div>

						<!-- Step 4: Commission Setup -->
					{:else if currentStep === 3}
						<div class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30">
							<div class="relative overflow-hidden px-6 py-5">
								<div class="gradient-soft absolute inset-0 opacity-40"></div>
								<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-success/50"></div>
								<div class="relative flex items-center justify-between gap-3">
									<div class="flex items-center gap-3">
										<div
											class="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/15"
										>
											<Coins class="size-4" />
										</div>
										<div>
											<p class="text-sm font-semibold">Commission Setup</p>
											<p class="mt-0.5 text-xs text-muted-foreground/65">
												Define gateway and partner fees by base amount tier
											</p>
										</div>
									</div>
									<Button variant="outline" size="sm" onclick={addTier} class="shrink-0">
										<PlusIcon class="size-3.5" />
										Add tier
									</Button>
								</div>
							</div>

							<!-- Summary line -->
							{#if commissionTiers.length > 0}
								<div
									class="flex items-center gap-4 border-t border-border/30 bg-muted/15 px-6 py-2.5"
								>
									<span class="text-xs text-muted-foreground">
										<span class="font-semibold text-foreground"
											>{commissionGatewayTotal.toFixed(2)}%</span
										> gateway
									</span>
									<span class="text-xs text-border/60">·</span>
									<span class="text-xs text-muted-foreground">
										<span class="font-semibold text-foreground"
											>{commissionPartnerTotal.toFixed(2)}%</span
										> partner
									</span>
									<span class="text-xs text-border/60">·</span>
									<span class="text-xs text-muted-foreground">
										{commissionTiers.length} slab{commissionTiers.length !== 1 ? 's' : ''}
									</span>
								</div>
							{/if}

							<div class="border-t border-border/30 p-6">
								{#if commissionTiers.length === 0}
									<div class="flex flex-col items-center gap-3 py-10 text-center">
										<div
											class="flex size-12 items-center justify-center rounded-2xl border border-dashed border-success/25 bg-success/5"
										>
											<Coins class="size-5 text-success/30" />
										</div>
										<div class="max-w-xs">
											<p class="text-sm font-medium text-foreground/70">No commission slabs yet</p>
											<p class="mt-1 text-xs text-muted-foreground/55">
												Click "Add tier" to start configuring fee slabs.
											</p>
										</div>
										<Button variant="outline" size="sm" onclick={addTier}>
											<PlusIcon class="size-3.5" /> Add First Tier
										</Button>
									</div>
								{:else}
									<div class="space-y-3">
										{#each commissionTiers as tier, i (tier.id)}
											<div
												class="group relative overflow-hidden rounded-xl bg-muted/15
												       ring-1 ring-border/30 transition-all hover:bg-muted/25 hover:ring-border/50"
												in:fly={{ y: -6, duration: 200 }}
												out:slide={{ duration: 150 }}
											>
												<div
													class="flex items-center justify-between border-b border-border/25 px-4 py-2"
												>
													<div class="flex items-center gap-2">
														<span
															class="flex size-5 items-center justify-center rounded-full bg-primary/12 text-[10px] font-bold text-primary"
															>{i + 1}</span
														>
														<span class="text-xs font-medium text-muted-foreground/60"
															>Commission Slab</span
														>
													</div>
													<button
														type="button"
														aria-label="Remove slab {i + 1}"
														onclick={() => removeTier(tier.id)}
														class="flex size-6 items-center justify-center rounded-lg text-muted-foreground/30
														       opacity-0 transition-all group-hover:opacity-100
														       hover:bg-destructive/10 hover:text-destructive"
													>
														<Trash2Icon class="size-3.5" />
													</button>
												</div>
												<div class="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
													<div class="space-y-1.5">
														<label
															for="cr-base-{tier.id}"
															class="text-xs font-medium text-muted-foreground">Base Amount</label
														>
														<Input
															id="cr-base-{tier.id}"
															inputmode="decimal"
															bind:value={tier.baseAmount}
															placeholder="e.g. 1000"
															class="h-9 text-sm"
														/>
													</div>
													<div class="space-y-1.5">
														<label
															for="cr-method-{tier.id}"
															class="text-xs font-medium text-muted-foreground">Method</label
														>
														<Dropdown
															bind:value={tier.method}
															options={commissionMethodOptions}
															placeholder="Select"
														/>
													</div>
													<div class="space-y-1.5">
														<label
															for="cr-gfee-{tier.id}"
															class="text-xs font-medium text-muted-foreground">Gateway Fee</label
														>
														<Input
															id="cr-gfee-{tier.id}"
															inputmode="decimal"
															bind:value={tier.gatewayFee}
															placeholder="e.g. 2.5"
															class="h-9 text-sm"
														/>
													</div>
													<div class="space-y-1.5">
														<label
															for="cr-pfee-{tier.id}"
															class="text-xs font-medium text-muted-foreground">Partner Fee</label
														>
														<Input
															id="cr-pfee-{tier.id}"
															inputmode="decimal"
															bind:value={tier.partnerFee}
															placeholder="e.g. 1.5"
															class="h-9 text-sm"
														/>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/key}
		</div>
	</div>

	<!-- ── Sticky footer ──────────────────────────────────────────────────── -->
	<div class="sticky bottom-0 z-20 border-t border-border/50 bg-card/96 backdrop-blur-sm">
		<div class="flex items-center justify-between px-6 py-4">
			<p class="hidden text-xs text-muted-foreground/60 sm:block">
				Step {currentStep + 1} of {steps.length} · {steps[currentStep].label}
			</p>
			<div class="flex w-full items-center justify-end gap-2.5 sm:w-auto">
				<button
					type="button"
					onclick={handleCancel}
					class="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground
					       transition-colors hover:bg-muted hover:text-foreground"
				>
					Cancel
				</button>
				{#if currentStep > 0}
					<button
						type="button"
						onclick={() => currentStep--}
						class="rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-semibold
						       text-muted-foreground shadow-xs transition-all hover:bg-muted/40"
					>
						← Back
					</button>
				{/if}
				{#if currentStep < steps.length - 1}
					<button
						type="button"
						onclick={() => currentStep++}
						disabled={!canProceed}
						class="gradient-primary rounded-xl px-5 py-2 text-sm font-semibold
						       text-primary-foreground shadow-sm transition-all hover:opacity-90
						       disabled:cursor-not-allowed disabled:opacity-50"
					>
						Next step →
					</button>
				{:else}
					<button
						type="button"
						onclick={handleSubmit}
						disabled={!canProceed || submitting}
						class="gradient-primary flex items-center gap-2 rounded-xl px-5 py-2 text-sm
						       font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90
						       disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if submitting}
							<Loader2 class="size-4 animate-spin" /> Creating…
						{:else}
							<ShieldCheck class="size-4" /> Create VA
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
