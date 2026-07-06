<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/reusable';
	import { Input } from '$lib/components/reusable';
	import { Dropdown } from '$lib/components/reusable';
	import { StatusBadge, vaStatusConfig, type VAStatus } from '$lib/components/reusable';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import { organizations } from '$lib/data/mockData';
	import {
		ArrowLeft,
		XIcon,
		PlusIcon,
		Trash2Icon,
		ChevronDown,
		SlidersHorizontal,
		TableIcon,
		Coins,
		AlertCircle,
		CheckCircle2,
		Loader2
	} from '$lib/assets/icons';
	import { slide, fly, fade } from 'svelte/transition';
	import type { VirtualAccount, CommissionTier } from '../../types';

	// ── Org + VA context ──────────────────────────────────────────────────────

	const org = $derived(organizations.find((o) => o.id === page.params.orgId));

	const mockVAs: VirtualAccount[] = [
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
	];

	const currentVA = $derived(mockVAs.find((v) => v.id === page.params.vaId) ?? mockVAs[0]);

	function goBack() {
		goto(resolve('/management/organization/[orgId]', { orgId: page.params.orgId ?? '' }));
	}

	// ── VA Status ─────────────────────────────────────────────────────────────

	const vaStatuses: VAStatus[] = ['Active', 'Inactive', 'Reserved', 'Suspended'];
	let vaStatus = $state<VAStatus>('Reserved');
	let pendingStatus = $state<VAStatus | ''>('');
	let statusUpdated = $state(false);

	const statusChanged = $derived(!!pendingStatus && pendingStatus !== vaStatus);

	function handleStatusUpdate() {
		if (!pendingStatus || pendingStatus === vaStatus) return;
		vaStatus = pendingStatus as VAStatus;
		pendingStatus = '';
		statusUpdated = true;
		setTimeout(() => (statusUpdated = false), 2500);
	}

	// ── Transaction Types ─────────────────────────────────────────────────────

	interface TxTypeOption {
		id: string;
		label: string;
		subtitle: string;
		checked: boolean;
		limits: { min: string; max: string; total: string };
	}

	let txTypeOptions = $state<TxTypeOption[]>([
		{
			id: 'imps',
			label: 'IMPS',
			subtitle: 'Immediate Payment',
			checked: true,
			limits: { min: '100', max: '100000', total: '1000000' }
		},
		{
			id: 'neft',
			label: 'NEFT',
			subtitle: 'Electronic Funds Transfer',
			checked: true,
			limits: { min: '100', max: '1000000', total: '1000000' }
		},
		{
			id: 'rtgs',
			label: 'RTGS',
			subtitle: 'Real Time Settlement',
			checked: true,
			limits: { min: '200000', max: '3000000', total: '3000000' }
		},
		{
			id: 'upi',
			label: 'UPI',
			subtitle: 'Unified Payments Interface',
			checked: false,
			limits: { min: '', max: '', total: '' }
		},
		{
			id: 'cards',
			label: 'CARD',
			subtitle: 'Credit & Debit Cards',
			checked: false,
			limits: { min: '', max: '', total: '' }
		},
		{
			id: 'net_banking',
			label: 'NET BANKING',
			subtitle: 'Internet Banking',
			checked: false,
			limits: { min: '', max: '', total: '' }
		}
	]);

	const selectedTypes = $derived(txTypeOptions.filter((o) => o.checked));

	function removeType(id: string) {
		const opt = txTypeOptions.find((o) => o.id === id);
		if (opt) opt.checked = false;
	}

	// ── Limits ────────────────────────────────────────────────────────────────

	let limits = $state({
		transactionLimit: '10000000',
		dailyDepositLimit: '1000000',
		minTxAmount: '100',
		maxTxAmount: '10000000'
	});

	const limitFields = [
		{
			id: 'upd-l-tx',
			key: 'transactionLimit' as const,
			label: 'Transaction Limit',
			ph: 'e.g. 10000000',
			helper: 'Maximum per transaction'
		},
		{
			id: 'upd-l-daily',
			key: 'dailyDepositLimit' as const,
			label: 'Daily Deposit Limit',
			ph: 'e.g. 1000000',
			helper: 'Rolling 24-hour cap'
		},
		{
			id: 'upd-l-min',
			key: 'minTxAmount' as const,
			label: 'Min Transaction',
			ph: 'e.g. 100',
			helper: 'Minimum accepted per txn'
		},
		{
			id: 'upd-l-max',
			key: 'maxTxAmount' as const,
			label: 'Max Transaction',
			ph: 'e.g. 10000000',
			helper: 'Maximum accepted per txn'
		}
	];

	// ── Whitelist toggle ──────────────────────────────────────────────────────

	let allowNonWhitelisted = $state(false);

	// ── Commission ────────────────────────────────────────────────────────────

	const commissionMethodOptions = [
		{ value: 'flatrate_inr', label: 'Flatrate ₹' },
		{ value: 'percentage', label: 'Percentage %' },
		{ value: 'tiered', label: 'Tiered' }
	];

	const effectiveOptions = [
		{ value: 'tomorrow', label: 'Effective tomorrow' },
		{ value: 'now', label: 'Effective now' },
		{ value: 'next_week', label: 'Next week' }
	];

	let effectiveFrom = $state('tomorrow');

	function makeTier(): CommissionTier {
		return {
			id: `tier-${Date.now()}-${Math.random()}`,
			baseAmount: '',
			method: 'flatrate_inr',
			gatewayFee: '',
			partnerFee: ''
		};
	}

	let commissionTiers = $state<CommissionTier[]>([
		{
			id: 'tier-1',
			baseAmount: '100',
			method: 'flatrate_inr',
			gatewayFee: '3.00',
			partnerFee: '2.00'
		},
		{
			id: 'tier-2',
			baseAmount: '1000',
			method: 'percentage',
			gatewayFee: '0.50',
			partnerFee: '0.50'
		},
		{
			id: 'tier-3',
			baseAmount: '10000',
			method: 'percentage',
			gatewayFee: '0.50',
			partnerFee: '1.00'
		}
	]);

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

	// ── Save ──────────────────────────────────────────────────────────────────

	let saving = $state(false);

	async function handleSave() {
		saving = true;
		await new Promise<void>((res) => setTimeout(res, 800));
		saving = false;
		toast.success('Virtual account updated successfully');
	}
</script>

<div class="flex min-h-full flex-col">
	<!-- ── Sticky header ─────────────────────────────────────────────────── -->
	<div class="sticky top-0 z-20 border-b border-border/50 bg-card/98 backdrop-blur-sm">
		<div class="flex items-center gap-4 px-6 py-4">
			<button
				type="button"
				onclick={goBack}
				class="flex size-8 shrink-0 items-center justify-center rounded-lg
				       text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<ArrowLeft class="size-4" />
			</button>
			<div class="min-w-0">
				<p class="text-xs text-muted-foreground/60">{org?.name ?? '…'} · {page.params.orgId}</p>
				<h1 class="text-base font-bold tracking-tight">Update Virtual Account</h1>
			</div>
		</div>
	</div>

	<!-- ── Two-panel body ────────────────────────────────────────────────── -->
	<div class="flex-1 p-4 sm:p-6">
		<div class="grid gap-6 lg:grid-cols-[300px_1fr]">
			<!-- ── Left: summary + status panel ─────────────────────────── -->
			<aside class="space-y-4 lg:sticky lg:top-20 lg:self-start">
				<!-- VA summary card -->
				<div class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30">
					<div class="relative overflow-hidden px-5 py-5">
						<div class="gradient-soft absolute inset-0 opacity-50"></div>
						<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-primary/50"></div>
						<div class="relative">
							<p class="text-base leading-snug font-bold">{currentVA.alias}</p>
							<p class="mt-1 font-mono text-xs font-medium text-primary">{currentVA.id}</p>
						</div>
					</div>
					<div class="divide-y divide-border/30 px-5">
						<div class="flex items-center justify-between gap-4 py-3">
							<span class="text-xs text-muted-foreground/60">A/C</span>
							<span class="font-mono text-xs font-semibold">{currentVA.accountNumber}</span>
						</div>
						<div class="flex items-center justify-between gap-4 py-3">
							<span class="text-xs text-muted-foreground/60">Bank</span>
							<span class="text-xs font-semibold">{currentVA.bank}</span>
						</div>
					</div>
				</div>

				<!-- Status change card -->
				<div class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30">
					<div class="border-b border-border/30 px-5 py-3.5">
						<p class="text-[11px] font-semibold tracking-wide text-muted-foreground/65 uppercase">
							Account Status
						</p>
					</div>
					<div class="space-y-3 p-5">
						<div class="flex items-center justify-between">
							<StatusBadge status={vaStatus} size="md" pulse={vaStatus === 'Active'} />
							{#if statusUpdated}
								<span
									class="flex items-center gap-1 text-[11px] font-semibold text-success"
									in:fade={{ duration: 150 }}
									out:fade={{ duration: 200 }}
								>
									<CheckCircle2 class="size-3.5" /> Updated
								</span>
							{/if}
						</div>

						<div class="space-y-2 rounded-xl border border-border/40 bg-muted/15 p-3">
							<p class="text-[11px] font-semibold tracking-wide text-muted-foreground/60 uppercase">
								Change status
							</p>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex h-9 w-full cursor-pointer items-center justify-between
									       rounded-lg border border-input bg-background px-2.5 text-sm
									       transition-colors hover:bg-muted/30
									       focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
								>
									{#if pendingStatus}
										<StatusBadge status={pendingStatus} size="sm" />
									{:else}
										<span class="text-xs text-muted-foreground/60">Select new status…</span>
									{/if}
									<ChevronDown class="size-3.5 shrink-0 text-muted-foreground/50" />
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="start" class="w-44">
									{#each vaStatuses as s (s)}
										{@const cfg = vaStatusConfig[s]}
										<DropdownMenu.Item
											onclick={() => (pendingStatus = s)}
											class="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm
											       transition-colors hover:bg-muted/50
											       {pendingStatus === s ? 'bg-primary/5 font-semibold' : ''}"
										>
											<span
												class="size-2 shrink-0 rounded-full {cfg?.dot ?? 'bg-muted-foreground/50'}"
											></span>
											{s}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Content>
							</DropdownMenu.Root>

							<Button
								size="sm"
								class="w-full transition-all
								       {statusChanged
									? 'gradient-primary text-primary-foreground shadow-sm hover:opacity-90'
									: 'cursor-not-allowed opacity-50'}"
								disabled={!statusChanged}
								onclick={handleStatusUpdate}
							>
								Update Status
							</Button>
						</div>
					</div>
				</div>
			</aside>

			<!-- ── Right: editable sections ──────────────────────────────── -->
			<div class="space-y-6">
				<!-- 1. Limits + Transaction Types (combined card) -->
				<section
					class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30 transition-shadow hover:shadow-md"
				>
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

						<!-- Transaction Types -->
						<div class="mt-6 space-y-3">
							<div class="flex items-center justify-between">
								<p
									class="text-[11px] font-semibold tracking-wide text-muted-foreground/55 uppercase"
								>
									Transaction Types
								</p>
							</div>
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
								<DropdownMenu.Content align="start" class="min-w-56">
									{#each txTypeOptions as opt (opt.id)}
										<DropdownMenu.CheckboxItem bind:checked={opt.checked}>
											<span class="font-semibold">{opt.label}</span>
											<span class="ml-1.5 text-xs text-muted-foreground">— {opt.subtitle}</span>
										</DropdownMenu.CheckboxItem>
									{/each}
								</DropdownMenu.Content>
							</DropdownMenu.Root>

							{#if selectedTypes.length > 0}
								<div class="flex flex-wrap gap-2" transition:slide={{ duration: 180, axis: 'y' }}>
									{#each selectedTypes as type (type.id)}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-primary/20
											       bg-primary/8 py-1 pr-2 pl-3 text-xs font-semibold text-primary"
											in:fly={{ y: -4, duration: 150 }}
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
						</div>
					</div>
				</section>

				<!-- 2. Per-method limits -->
				<section
					class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30 transition-shadow hover:shadow-md"
				>
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
								<p class="text-sm font-semibold">Per-method Limits</p>
								<p class="mt-0.5 text-xs text-muted-foreground/65">
									Tune min, max and total caps for each selected type
								</p>
							</div>
						</div>
					</div>

					{#if selectedTypes.length === 0}
						<div
							class="flex flex-col items-center gap-3 border-t border-border/30 px-6 py-10 text-center"
							in:fade={{ duration: 180 }}
						>
							<div
								class="flex size-12 items-center justify-center rounded-2xl border border-dashed border-info/25 bg-info/5"
							>
								<TableIcon class="size-5 text-info/30" />
							</div>
							<p class="max-w-xs text-sm text-muted-foreground/70">
								Select transaction types in the Limits section above to configure per-method caps.
							</p>
						</div>
					{:else}
						<div class="border-t border-border/30" transition:slide={{ duration: 200 }}>
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
										<Table.Row class="border-b border-border/25 last:border-0 hover:bg-muted/10">
											<Table.Cell class="py-4 pl-6">
												<div>
													<span
														class="inline-flex items-center rounded-md border border-primary/15
													             bg-primary/8 px-2.5 py-0.5 text-xs font-bold text-primary"
													>
														{type.label}
													</span>
													<p class="mt-0.5 text-[11px] text-muted-foreground/50">{type.subtitle}</p>
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
				</section>

				<!-- 3. Whitelist toggle -->
				<section
					class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30 transition-shadow hover:shadow-md"
				>
					<div class="flex items-start justify-between gap-4 px-6 py-5">
						<div class="space-y-1">
							<p class="text-sm font-semibold">Allow funds from non-whitelisted accounts</p>
							<p class="max-w-sm text-xs leading-relaxed text-muted-foreground/65">
								When enabled, this virtual account can receive funds from unverified or
								non-whitelisted bank accounts. Disable to restrict to approved senders only.
							</p>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={allowNonWhitelisted}
							aria-label="Toggle non-whitelisted accounts"
							onclick={() => (allowNonWhitelisted = !allowNonWhitelisted)}
							class="relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
							       border-2 border-transparent transition-colors duration-200
							       focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
							       {allowNonWhitelisted ? 'bg-primary' : 'bg-muted-foreground/25'}"
						>
							<span
								class="pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm
							             transition-transform duration-200
							             {allowNonWhitelisted ? 'translate-x-5' : 'translate-x-0'}"
							></span>
						</button>
					</div>
				</section>

				<!-- 4. Commission setup -->
				<section
					class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30 transition-shadow hover:shadow-md"
				>
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
							<div class="flex shrink-0 items-center gap-2">
								<!-- Effective from — inline in header, not in left sidebar -->
								<div
									class="flex items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/8 px-2.5 py-1.5"
								>
									<AlertCircle class="size-3 text-warning" />
									<Dropdown
										bind:value={effectiveFrom}
										options={effectiveOptions}
										placeholder="Effective"
										class="h-6 border-0 bg-transparent p-0 text-xs text-warning shadow-none"
									/>
								</div>
								<Button variant="outline" size="sm" onclick={addTier} class="shrink-0">
									<PlusIcon class="size-3.5" />
									Add tier
								</Button>
							</div>
						</div>
					</div>

					<!-- Summary line -->
					{#if commissionTiers.length > 0}
						<div class="flex items-center gap-4 border-t border-border/30 bg-muted/15 px-6 py-2.5">
							<span class="text-xs text-muted-foreground">
								<span class="font-semibold text-foreground"
									>{commissionGatewayTotal.toFixed(2)}%</span
								> total gateway fee
							</span>
							<span class="text-xs text-border/60">·</span>
							<span class="text-xs text-muted-foreground">
								<span class="font-semibold text-foreground"
									>{commissionPartnerTotal.toFixed(2)}%</span
								> total partner fee
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
										Click "Add tier" above to start configuring fee slabs.
									</p>
								</div>
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
													for="upd-cr-base-{tier.id}"
													class="text-xs font-medium text-muted-foreground">Base Amount</label
												>
												<Input
													id="upd-cr-base-{tier.id}"
													inputmode="decimal"
													bind:value={tier.baseAmount}
													placeholder="e.g. 1000"
													class="h-9 text-sm"
												/>
											</div>
											<div class="space-y-1.5">
												<label
													for="upd-cr-method-{tier.id}"
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
													for="upd-cr-gfee-{tier.id}"
													class="text-xs font-medium text-muted-foreground">Gateway Fee</label
												>
												<Input
													id="upd-cr-gfee-{tier.id}"
													inputmode="decimal"
													bind:value={tier.gatewayFee}
													placeholder="e.g. 2.5"
													class="h-9 text-sm"
												/>
											</div>
											<div class="space-y-1.5">
												<label
													for="upd-cr-pfee-{tier.id}"
													class="text-xs font-medium text-muted-foreground">Partner Fee</label
												>
												<Input
													id="upd-cr-pfee-{tier.id}"
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
				</section>
			</div>
		</div>
	</div>

	<!-- ── Sticky footer ──────────────────────────────────────────────────── -->
	<div class="sticky bottom-0 z-20 border-t border-border/50 bg-card/96 backdrop-blur-sm">
		<div class="flex items-center justify-between px-6 py-4">
			<p class="hidden text-xs text-muted-foreground/60 sm:block">
				Review your changes before saving. Status updates are applied separately.
			</p>
			<div class="flex w-full items-center justify-end gap-2.5 sm:w-auto">
				<button
					type="button"
					onclick={goBack}
					class="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground
					       transition-colors hover:bg-muted hover:text-foreground"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleSave}
					disabled={saving}
					class="gradient-primary flex items-center gap-2 rounded-xl px-5 py-2 text-sm
					       font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90
					       disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if saving}
						<Loader2 class="size-4 animate-spin" /> Saving…
					{:else}
						<CheckCircle2 class="size-4" /> Save Changes
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
