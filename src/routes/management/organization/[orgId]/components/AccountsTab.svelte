<script lang="ts">
	import { Button, Chip, Dropdown, Input } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { PencilIcon, PlusIcon, XIcon, Landmark, Trash2Icon, CheckIcon } from '$lib/assets/icons';
	import type { BankAccountStatus, BankingDetail } from '../types';
	import { BANK_ACCOUNT_STATUSES } from '../types';
	import { cn } from '$lib/utils';
	import { enumToDropdownOptions, formatStatusLabel } from '$lib/utils/status_rename';
	import * as Drawer from '$lib/components/ui/drawer';

	interface Props {
		banks: BankingDetail[];
		onaddbank?: (bank: Omit<BankingDetail, 'id'>) => void;
		oneditbank?: (bank: BankingDetail) => void;
	}

	const { banks, onaddbank, oneditbank }: Props = $props();

	const bankStatusOptions = enumToDropdownOptions(BANK_ACCOUNT_STATUSES);

	const bankStatusVariantMap: Record<BankAccountStatus, BadgeVariant> = {
		ACTIVE: 'success',
		ON_HOLD: 'warning',
		IN_ACTIVE: 'disabled',
		BLOCKED: 'error',
		CLOSED: 'secondary'
	};

	function bankStatusVariant(status: BankAccountStatus): BadgeVariant {
		return bankStatusVariantMap[status] ?? 'secondary';
	}

	// ── Drawer state ──────────────────────────────────────────────────────────────
	let isDrawerOpen = $state(false);
	let editingId = $state<string | 'new' | null>(null);

	let form = $state({
		accountHolder: '',
		accountNumber: '',
		bank: '',
		branch: '',
		routingIFSC: '',
		status: 'ACTIVE' as BankAccountStatus
	});

	// ── Primary tracking (local UI state) ─────────────────────────────────────────
	let _overridePrimaryId = $state<string | null>(null);
	const primaryBankId = $derived(
		_overridePrimaryId ?? banks.find((b) => b.isPrimary)?.id ?? banks[0]?.id ?? null
	);

	function openEdit(b: BankingDetail) {
		editingId = b.id;
		form = {
			accountHolder: b.accountHolder,
			accountNumber: b.accountNumber,
			bank: b.bank,
			branch: b.branch,
			routingIFSC: b.routingIFSC,
			status: b.status
		};
		isDrawerOpen = true;
	}

	function openAdd() {
		editingId = 'new';
		form = {
			accountHolder: '',
			accountNumber: '',
			bank: '',
			branch: '',
			routingIFSC: '',
			status: 'ACTIVE'
		};
		isDrawerOpen = true;
	}

	function closeDrawer() {
		isDrawerOpen = false;
		setTimeout(() => {
			editingId = null;
		}, 250);
	}

	function save() {
		if (editingId === 'new') {
			onaddbank?.({ ...form });
		} else {
			const existing = banks.find((b) => b.id === editingId);
			if (existing) oneditbank?.({ id: existing.id, ...form });
		}
		closeDrawer();
	}

	function setPrimary(id: string) {
		_overridePrimaryId = id;
	}

	const drawerTitle = $derived(editingId === 'new' ? 'Add Bank Account' : 'Edit Bank Account');
	const isEditMode = $derived(editingId !== null && editingId !== 'new');
</script>

<div class="space-y-4">
	<!-- Section header -->
	<div class="flex items-center justify-between">
		<div>
			<p class="text-base font-semibold">Bank Accounts</p>
			<p class="mt-0.5 text-xs text-muted-foreground/60">
				{banks.length === 0
					? 'No accounts added yet'
					: `${banks.length} account${banks.length !== 1 ? 's' : ''} on file`}
			</p>
		</div>
		<Button
			class="gradient-primary text-primary-foreground shadow-sm hover:opacity-90 hover:shadow-md"
			onclick={openAdd}
		>
			<PlusIcon class="size-4" />
			Add Bank Account
		</Button>
	</div>

	<!-- Bank cards -->
	{#if banks.length > 0}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each banks as bank (bank.id)}
				{@const isPrimary = bank.id === primaryBankId}
				<div
					class={cn(
						'group relative overflow-hidden rounded-2xl border shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
						isPrimary ? 'border-primary/25 bg-primary/5' : 'border-border/60 bg-card'
					)}
				>
					<!-- Primary indicator accent bar -->
					{#if isPrimary}
						<div class="gradient-primary absolute inset-x-0 top-0 h-0.5"></div>
					{/if}

					<!-- Card header -->
					<div
						class="flex items-center justify-between border-b px-4 py-3 {isPrimary
							? 'border-primary/15'
							: 'border-border/40'}"
					>
						<div class="flex items-center gap-2.5">
							<div
								class={cn(
									'flex size-8 items-center justify-center rounded-xl ring-1',
									isPrimary
										? 'bg-primary/12 text-primary ring-primary/20'
										: 'bg-muted/40 text-muted-foreground ring-border/50'
								)}
							>
								<Landmark class="size-4" />
							</div>
							<div>
								<p class="text-sm font-semibold">{bank.bank}</p>
								{#if isPrimary}
									<p class="text-[10px] font-semibold text-primary">Primary account</p>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-1.5">
							<Chip variant={bankStatusVariant(bank.status)}>
								{formatStatusLabel(bank.status)}
							</Chip>
						</div>
					</div>

					<!-- Card body -->
					<div class="grid grid-cols-2 gap-x-6 gap-y-3.5 px-4 py-4">
						<div>
							<p
								class="text-[10px] font-semibold tracking-wider text-muted-foreground/55 uppercase"
							>
								Account holder
							</p>
							<p class="mt-0.5 text-sm font-semibold">{bank.accountHolder}</p>
						</div>
						<div>
							<p
								class="text-[10px] font-semibold tracking-wider text-muted-foreground/55 uppercase"
							>
								Account number
							</p>
							<p class="mt-0.5 font-mono text-sm font-semibold tracking-wider">
								{bank.accountNumber}
							</p>
						</div>
						<div>
							<p
								class="text-[10px] font-semibold tracking-wider text-muted-foreground/55 uppercase"
							>
								Branch
							</p>
							<p class="mt-0.5 text-sm text-muted-foreground/80">{bank.branch}</p>
						</div>
						<div>
							<p
								class="text-[10px] font-semibold tracking-wider text-muted-foreground/55 uppercase"
							>
								IFSC / Routing
							</p>
							<p class="mt-0.5 font-mono text-sm text-muted-foreground/80">{bank.routingIFSC}</p>
						</div>
					</div>

					<!-- Card actions -->
					<div
						class="flex items-center justify-between border-t px-4 py-2.5 {isPrimary
							? 'border-primary/15'
							: 'border-border/30'}"
					>
						{#if !isPrimary}
							<button
								type="button"
								onclick={() => setPrimary(bank.id)}
								class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium
								       text-muted-foreground/60 transition-colors hover:bg-primary/8 hover:text-primary"
							>
								<CheckIcon class="size-3" />
								Set as primary
							</button>
						{:else}
							<div></div>
						{/if}

						<div class="flex items-center gap-0.5">
							<button
								type="button"
								onclick={() => openEdit(bank)}
								aria-label="Edit {bank.bank}"
								class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium
								       text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
							>
								<PencilIcon class="size-3.5" />
								Edit
							</button>
							<button
								type="button"
								aria-label="Delete {bank.bank}"
								class="rounded-lg p-1.5 text-muted-foreground/40 transition-colors
								       hover:bg-destructive/10 hover:text-destructive"
							>
								<Trash2Icon class="size-3.5" />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Empty state -->
		<div
			class="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border
			       border-dashed border-border/60 p-8 text-center"
		>
			<div
				class="flex size-12 items-center justify-center rounded-2xl border border-dashed
				       border-border bg-muted/15"
			>
				<Landmark class="size-5 text-muted-foreground/30" />
			</div>
			<div>
				<p class="text-sm font-medium text-muted-foreground/70">No bank accounts added</p>
				<p class="mt-0.5 text-xs text-muted-foreground/45">
					Add a bank account to enable payouts for this organization.
				</p>
			</div>
			<Button
				class="gradient-primary text-primary-foreground shadow-sm hover:opacity-90"
				onclick={openAdd}
			>
				<PlusIcon class="size-4" />
				Add Bank Account
			</Button>
		</div>
	{/if}
</div>

<!-- ── Slide-over drawer ─────────────────────────────────────────────────────── -->
<Drawer.Root bind:open={isDrawerOpen} direction="right">
	<Drawer.Content>
		<Drawer.Header>
			<div class="flex items-start justify-between gap-3">
				<div class="flex items-start gap-3">
					<div
						class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<Landmark class="size-4.5" />
					</div>
					<div>
						<p class="text-base font-semibold">{drawerTitle}</p>
						<p class="mt-0.5 text-xs text-muted-foreground/60">
							Provide bank account details for payouts and settlements.
						</p>
					</div>
				</div>
				<button
					onclick={closeDrawer}
					class="mt-0.5 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<XIcon class="size-4" />
				</button>
			</div>
		</Drawer.Header>

		<div class="overflow-auto px-4 pb-2">
			<div class="grid gap-5">
				<div class="space-y-1.5">
					<label
						for="dr-holder"
						class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
					>
						Account holder <span class="text-destructive/60">*</span>
					</label>
					<Input id="dr-holder" bind:value={form.accountHolder} placeholder="Full legal name" />
				</div>
				<div class="space-y-1.5">
					<label
						for="dr-number"
						class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
					>
						Account number <span class="text-destructive/60">*</span>
					</label>
					<Input id="dr-number" bind:value={form.accountNumber} placeholder="e.g. •••• •••• 4421" />
				</div>
				<div class="space-y-1.5">
					<label
						for="dr-bank"
						class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
					>
						Bank name <span class="text-destructive/60">*</span>
					</label>
					<Input id="dr-bank" bind:value={form.bank} placeholder="e.g. Pinnacle Trust" />
				</div>
				<div class="space-y-1.5">
					<label
						for="dr-branch"
						class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
					>
						Branch
					</label>
					<Input id="dr-branch" bind:value={form.branch} placeholder="Branch name or city" />
				</div>
				<div class="space-y-1.5">
					<label
						for="dr-ifsc"
						class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
					>
						IFSC / Routing code <span class="text-destructive/60">*</span>
					</label>
					<Input id="dr-ifsc" bind:value={form.routingIFSC} placeholder="e.g. PINTUS33" />
				</div>
				{#if isEditMode}
					<div class="space-y-1.5">
						<label
							for="dr-status"
							class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
						>
							Status
						</label>
						<Dropdown
							bind:value={form.status}
							options={bankStatusOptions}
							placeholder="Select status"
							bordered
						/>
					</div>
				{/if}
			</div>
		</div>

		<Drawer.Footer>
			<Button variant="outline" onclick={closeDrawer}>Cancel</Button>

			<Button
				class="gradient-primary text-primary-foreground shadow-sm hover:opacity-90"
				onclick={save}
			>
				<CheckIcon class="size-4" />
				Save account
			</Button>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
<!-- <svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && isDrawerOpen) closeDrawer();
	}}
/> -->
