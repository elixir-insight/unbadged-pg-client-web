<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	import { Chip, Button, Drawer } from '$lib/components/reusable';

	import {
		RefreshCw,
		Building2,
		Wallet,
		ArrowUpFromLine,
		ArrowDownToLine,
		ArrowRight,
		AlertCircle,
		ChevronRight,
		Copy,
		Check
	} from '$lib/assets/icons';

	import type { BankAccount, VirtualAccount, Transaction } from '$lib/types/funds';
	import TransactionTable from '$lib/components/fund/TransactionTable.svelte';

	let { data } = $props();

	// ── View toggle ───────────────────────────────────────────────────────
	const showTransactions = $derived(page.url.searchParams.get('view') === 'transactions');

	function openTransactions() {
		goto(resolve('/merchant/funds?view=transactions' as '/'), { noScroll: true });
	}

	// ── Bank pills ────────────────────────────────────────────────────────
	const BANK_PILL_LIMIT = 4;
	let showAllBanks = $state(false);
	const visibleBanks = $derived(
		showAllBanks ? data.bankAccounts : data.bankAccounts.slice(0, BANK_PILL_LIMIT)
	);
	const hiddenBankCount = $derived(data.bankAccounts.length - BANK_PILL_LIMIT);

	// ── Bank account drawer ───────────────────────────────────────────────
	let accountDrawerOpen = $state(false);
	let selectedAccount = $state<BankAccount | null>(null);
	const selectedAccountIdx = $derived(
		selectedAccount ? data.bankAccounts.findIndex((a) => a.id === selectedAccount!.id) : 0
	);

	function openAccountDrawer(account: BankAccount) {
		selectedAccount = account;
		accountDrawerOpen = true;
	}

	// ── Virtual account drawer ────────────────────────────────────────────
	let vaDrawerOpen = $state(false);
	let selectedVA = $state<VirtualAccount | null>(null);

	function openVADrawer(va: VirtualAccount) {
		selectedVA = va;
		vaDrawerOpen = true;
	}

	// ── Balance refresh ───────────────────────────────────────────────────
	let summaryLoading = $state(false);
	async function refreshSummary() {
		summaryLoading = true;
		await new Promise((r) => setTimeout(r, 800));
		summaryLoading = false;
	}

	// ── Copy ──────────────────────────────────────────────────────────────
	let copiedKey = $state<string | null>(null);
	async function copyText(value: string, key: string) {
		try {
			await navigator.clipboard.writeText(value);
			copiedKey = key;
			setTimeout(() => (copiedKey = null), 2000);
		} catch {
			/* silent */
		}
	}

	// ── Formatters ────────────────────────────────────────────────────────
	function formatCurrency(n: number) {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 2
		}).format(n / 100);
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-IN', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function statusVariant(s: Transaction['status']): 'success' | 'error' | 'warning' {
		if (s === 'Completed') return 'success';
		if (s === 'Failed') return 'error';
		return 'warning';
	}

	function usageVariant(u: BankAccount['usage']): 'info' | 'warning' | 'success' {
		if (u === 'PayIn') return 'info';
		if (u === 'Payout') return 'warning';
		return 'success';
	}

	const BANK_COLORS = [
		'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
		'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
		'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
		'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
		'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
		'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
	];

	function bankAvatarColor(i: number) {
		return BANK_COLORS[i % BANK_COLORS.length];
	}
</script>

<!-- ════════════════════════════════════════════════════════════════════ -->
<!--  Root                                                                -->
<!-- ════════════════════════════════════════════════════════════════════ -->
<div class="relative min-h-full overflow-x-hidden">
	<!-- ── Ambient background glows ──────────────────────────────────────── -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
		<div class="absolute -left-40 -top-40 size-[560px] rounded-full bg-primary/6 blur-3xl"></div>
		<div class="absolute -right-20 -top-20 size-[420px] rounded-full bg-chart-2/6 blur-3xl"></div>
	</div>

	<!-- ════════════════════════════════════════════════════════════════════ -->
	<!--  Screen 2 — Transaction Explorer                                    -->
	<!-- ════════════════════════════════════════════════════════════════════ -->
	{#if showTransactions}
		<div in:fly={{ x: 56, duration: 350, easing: cubicOut }} out:fly={{ x: 56, duration: 220 }}>
			<TransactionTable
				transactions={data.transactions}
				total={data.total}
				skip={data.skip}
				limit={data.limit}
			/>
		</div>

		<!-- ════════════════════════════════════════════════════════════════════ -->
		<!--  Screen 1 — Funds Dashboard                                         -->
		<!-- ════════════════════════════════════════════════════════════════════ -->
	{:else}
		<div
			in:fade={{ duration: 250 }}
			out:fade={{ duration: 150 }}
			class="relative z-10 space-y-10 p-6"
		>
			<!-- ── Page header ───────────────────────────────────────────────── -->
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Funds</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Balance overview, linked accounts, and inward fund activity.
				</p>
			</div>

			<!-- ════════════════════════════════════════════════════════════════ -->
			<!--  Balance Hero Card                                               -->
			<!-- ════════════════════════════════════════════════════════════════ -->
			<section aria-label="Fund Summary">
				<div
					class="balance-card relative overflow-hidden rounded-[20px] px-6 py-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5"
				>
					<!-- Floating orbs inside card -->
					<div
						class="float-animation pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-white/6 blur-3xl"
					></div>
					<div
						class="pulse-glow pointer-events-none absolute -bottom-6 left-1/2 size-32 rounded-full bg-white/5 blur-2xl"
					></div>
					<!-- Shimmer sweep -->
					<div class="card-shimmer pointer-events-none absolute inset-0 rounded-[20px]"></div>

					<!-- Content -->
					<div class="relative z-10">
						<!-- Top row: label + balance + refresh -->
						<div class="flex flex-wrap items-center justify-between gap-4">
							<div>
								<p class="text-xs font-medium tracking-wide text-white/65">
									Total Available Balance
								</p>
								<div class="mt-1">
									{#if summaryLoading}
										<div class="h-9 w-44 animate-pulse rounded-lg bg-white/20"></div>
									{:else}
										<p class="text-3xl font-bold tracking-tight text-white lg:text-4xl">
											{formatCurrency(data.summary.totalBalance)}
										</p>
									{/if}
								</div>
							</div>
							<button
								type="button"
								onclick={refreshSummary}
								aria-label="Refresh balance"
								class="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
							>
								<RefreshCw
									class={['size-3.5', summaryLoading && 'animate-spin'].filter(Boolean).join(' ')}
								/>
								<span>Updated {formatTime(data.summary.lastUpdated)}</span>
							</button>
						</div>

						<!-- Separator -->
						<div class="my-4 h-px bg-white/15"></div>

						<!-- Sub-balances -->
						<div class="flex flex-wrap items-center gap-6">
							<div class="flex items-center gap-3">
								<div
									class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15"
								>
									<ArrowUpFromLine class="size-3.5 text-white" />
								</div>
								<div>
									<p class="text-xs font-medium text-white/60">PayIn Balance</p>
									{#if summaryLoading}
										<div class="mt-1 h-5 w-24 animate-pulse rounded bg-white/20"></div>
									{:else}
										<p class="text-base font-semibold text-white">
											{formatCurrency(data.summary.payInBalance)}
										</p>
									{/if}
								</div>
							</div>

							<div class="hidden h-8 w-px bg-white/15 sm:block"></div>

							<div class="flex items-center gap-3">
								<div
									class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15"
								>
									<ArrowDownToLine class="size-3.5 text-white" />
								</div>
								<div>
									<p class="text-xs font-medium text-white/60">Payout Balance</p>
									{#if summaryLoading}
										<div class="mt-1 h-5 w-24 animate-pulse rounded bg-white/20"></div>
									{:else}
										<p class="text-base font-semibold text-white">
											{formatCurrency(data.summary.payoutBalance)}
										</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- ════════════════════════════════════════════════════════════════ -->
			<!--  Linked Bank Accounts                                            -->
			<!-- ════════════════════════════════════════════════════════════════ -->
			<section aria-label="Linked Bank Accounts">
				<div class="mb-5">
					<h2 class="text-base font-semibold">Linked Bank Accounts</h2>
					<p class="mt-0.5 text-xs text-muted-foreground">
						{data.bankAccounts.length}
						{data.bankAccounts.length === 1 ? 'account' : 'accounts'} linked · Click to view details
					</p>
				</div>

				{#if data.bankAccounts.length === 0}
					<div
						class="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-border/60 bg-muted/10 py-12 text-center"
					>
						<Building2 class="size-8 text-muted-foreground/20" />
						<p class="text-sm text-muted-foreground">No bank accounts linked</p>
					</div>
				{:else}
					<div class="flex flex-wrap gap-3">
						{#each visibleBanks as account, i (account.id)}
							<button
								type="button"
								onclick={() => openAccountDrawer(account)}
								class="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
							>
								<div
									class={`flex size-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${bankAvatarColor(i)}`}
								>
									{account.bankName.slice(0, 2).toUpperCase()}
								</div>
								<div class="text-left">
									<p class="text-sm font-semibold leading-tight">
										{account.bankName.split(' ')[0]}
									</p>
									<p class="mt-0.5 font-mono text-xs text-muted-foreground">
										{account.accountNumber}
									</p>
								</div>
								<Chip variant={usageVariant(account.usage)} class="shrink-0 text-xs">
									{account.usage}
								</Chip>
								<div
									class="size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
								></div>
								<ChevronRight
									class="size-3.5 shrink-0 text-muted-foreground/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
								/>
							</button>
						{/each}

						{#if !showAllBanks && hiddenBankCount > 0}
							<button
								type="button"
								onclick={() => (showAllBanks = true)}
								class="flex items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-5 py-3.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-muted/50 hover:text-foreground"
							>
								+{hiddenBankCount} More
							</button>
						{/if}
					</div>
				{/if}
			</section>

			<!-- ════════════════════════════════════════════════════════════════ -->
			<!--  Virtual Accounts                                                -->
			<!-- ════════════════════════════════════════════════════════════════ -->
			{#if data.virtualAccounts.length > 0}
				<section aria-label="Virtual Accounts">
					<div class="mb-5">
						<h2 class="text-base font-semibold">Virtual Accounts</h2>
						<p class="mt-0.5 text-xs text-muted-foreground">
							{data.virtualAccounts.length} virtual {data.virtualAccounts.length === 1
								? 'account'
								: 'accounts'} · Click to view details
						</p>
					</div>

					<div class="flex flex-wrap gap-3">
						{#each data.virtualAccounts as va (va.id)}
							<button
								type="button"
								onclick={() => openVADrawer(va)}
								class="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
							>
								<div
									class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
								>
									<Wallet class="size-4" />
								</div>
								<div class="text-left">
									<p class="font-mono text-xs font-semibold leading-tight">
										{va.virtualAccountNumber}
									</p>
									<p class="mt-0.5 text-xs text-muted-foreground">{va.bankName}</p>
								</div>
								<Chip
									variant={va.status === 'Active' ? 'success' : 'disabled'}
									class="shrink-0 text-xs"
								>
									{va.status}
								</Chip>
								{#if va.status === 'Active'}
									<div
										class="size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
									></div>
								{/if}
								<ChevronRight
									class="size-3.5 shrink-0 text-muted-foreground/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
								/>
							</button>
						{/each}
					</div>
				</section>
			{/if}

			<!-- ════════════════════════════════════════════════════════════════ -->
			<!--  Recent Inward Transactions Preview                              -->
			<!-- ════════════════════════════════════════════════════════════════ -->
			<section aria-label="Recent Inward Transactions">
				<div class="overflow-hidden rounded-[20px] border border-border/60 bg-card shadow-lg">
					<!-- Header -->
					<div class="flex items-center justify-between border-b border-border/40 px-6 py-5">
						<div>
							<h2 class="text-base font-semibold">Recent Inward Transactions</h2>
							<p class="mt-0.5 text-xs text-muted-foreground">Latest 5 transactions</p>
						</div>
					</div>

					<!-- Table -->
					{#if data.recentTransactions.length === 0}
						<div class="flex flex-col items-center gap-3 py-16 text-center">
							<AlertCircle class="size-8 text-muted-foreground/20" />
							<p class="text-sm text-muted-foreground">No transactions yet</p>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full min-w-[540px] text-sm">
								<thead>
									<tr class="border-b border-border/30 bg-muted/20">
										<th
											class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
											>Txn ID</th
										>
										<th
											class="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
											>Amount</th
										>
										<th
											class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
											>Status</th
										>
										<th
											class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
											>Date & Time</th
										>
									</tr>
								</thead>
								<tbody>
									{#each data.recentTransactions as txn (txn.id)}
										<tr
											class="border-b border-border/20 bg-card transition-colors last:border-0 hover:bg-muted/20"
										>
											<td class="px-6 py-4">
												<span class="font-mono text-xs font-medium">{txn.txnId}</span>
											</td>
											<td class="px-4 py-4 text-right">
												<span class="font-semibold tabular-nums">{formatCurrency(txn.amount)}</span>
											</td>
											<td class="px-4 py-4">
												<Chip variant={statusVariant(txn.status)} class="text-xs">{txn.status}</Chip
												>
											</td>
											<td class="px-4 py-4">
												<p class="text-xs">{formatDate(txn.dateTime)}</p>
												<p class="mt-0.5 text-xs text-muted-foreground">
													{formatTime(txn.dateTime)}
												</p>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Footer CTA -->
						<div class="border-t border-border/30 px-6 py-4">
							<button
								type="button"
								onclick={openTransactions}
								class="group flex items-center gap-2 text-sm font-medium text-primary transition-all hover:gap-3 focus-visible:outline-none"
							>
								View All Transactions
								<ArrowRight
									class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
								/>
							</button>
						</div>
					{/if}
				</div>
			</section>
		</div>
	{/if}

	<!-- ════════════════════════════════════════════════════════════════════ -->
	<!--  Bank Account Drawer (always mounted)                                -->
	<!-- ════════════════════════════════════════════════════════════════════ -->
	<Drawer
		bind:open={accountDrawerOpen}
		direction="right"
		title={selectedAccount?.bankName ?? 'Bank Account'}
	>
		{#if selectedAccount}
			<div class="space-y-6 pb-2">
				<!-- Hero -->
				<div class="flex items-center gap-4 rounded-2xl bg-muted/40 px-5 py-5">
					<div
						class={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${bankAvatarColor(selectedAccountIdx)}`}
					>
						{selectedAccount.bankName.slice(0, 2).toUpperCase()}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-base font-semibold">{selectedAccount.bankName}</p>
						<p class="mt-0.5 text-xs text-muted-foreground">
							{selectedAccount.accountType} Account
						</p>
						<div class="mt-2 flex items-center gap-1.5">
							<div class="size-1.5 rounded-full bg-emerald-500"></div>
							<span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
						</div>
					</div>
					<Chip variant={usageVariant(selectedAccount.usage)} class="shrink-0 text-xs">
						{selectedAccount.usage}
					</Chip>
				</div>

				<!-- Details -->
				<div>
					<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
						Account Details
					</p>
					<dl class="divide-y divide-border/50">
						{#each [{ label: 'Account Holder', value: selectedAccount.accountHolderName, mono: false, copy: false }, { label: 'Account Number', value: selectedAccount.accountNumber, mono: true, copy: true }, { label: 'IFSC Code', value: selectedAccount.ifsc, mono: true, copy: true }, { label: 'Branch', value: selectedAccount.branchName, mono: false, copy: false }, { label: 'Account Type', value: selectedAccount.accountType, mono: false, copy: false }] as const as row (row.label)}
							<div class="flex items-center justify-between gap-4 py-3">
								<dt class="text-xs text-muted-foreground">{row.label}</dt>
								<dd class="flex items-center gap-1.5">
									<span class="text-right text-xs font-medium {row.mono ? 'font-mono' : ''}"
										>{row.value}</span
									>
									{#if row.copy}
										<button
											type="button"
											onclick={() => copyText(row.value, `acct-${row.label}`)}
											aria-label="Copy {row.label}"
											class="shrink-0 text-muted-foreground/40 transition-colors hover:text-muted-foreground focus-visible:outline-none"
										>
											{#if copiedKey === `acct-${row.label}`}
												<Check class="size-3 text-emerald-500" />
											{:else}
												<Copy class="size-3" />
											{/if}
										</button>
									{/if}
								</dd>
							</div>
						{/each}
					</dl>
				</div>

				<!-- Recent transactions -->
				{#if data.recentTransactions.length > 0}
					<div>
						<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
							Recent Transactions
						</p>
						<div class="space-y-2">
							{#each data.recentTransactions.slice(0, 3) as txn (txn.id)}
								<div class="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
									<div>
										<p class="font-mono text-xs font-medium">{txn.txnId}</p>
										<p class="mt-0.5 text-xs text-muted-foreground">{formatDate(txn.dateTime)}</p>
									</div>
									<div class="text-right">
										<p class="text-sm font-semibold">{formatCurrency(txn.amount)}</p>
										<Chip variant={statusVariant(txn.status)} class="mt-1 text-xs"
											>{txn.status}</Chip
										>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#snippet footer()}
			<div class="flex w-full gap-3">
				<Button variant="outline" class="flex-1" onclick={() => (accountDrawerOpen = false)}
					>Close</Button
				>
				<Button
					class="flex-1"
					onclick={() => {
						accountDrawerOpen = false;
						openTransactions();
					}}
				>
					View All Transactions
					<ArrowRight class="ml-1.5 size-3.5" />
				</Button>
			</div>
		{/snippet}
	</Drawer>

	<!-- ════════════════════════════════════════════════════════════════════ -->
	<!--  Virtual Account Drawer (always mounted)                             -->
	<!-- ════════════════════════════════════════════════════════════════════ -->
	<Drawer bind:open={vaDrawerOpen} direction="right" title="Virtual Account">
		{#if selectedVA}
			<div class="space-y-6 pb-2">
				<!-- Hero -->
				<div class="flex items-center gap-4 rounded-2xl bg-muted/40 px-5 py-5">
					<div
						class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
					>
						<Wallet class="size-6" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate font-mono text-sm font-semibold">
							{selectedVA.virtualAccountNumber}
						</p>
						<p class="mt-0.5 text-xs text-muted-foreground">{selectedVA.bankName}</p>
						<div class="mt-2 flex items-center gap-1.5">
							{#if selectedVA.status === 'Active'}
								<div class="size-1.5 rounded-full bg-emerald-500"></div>
								<span class="text-xs font-medium text-emerald-600 dark:text-emerald-400"
									>Active</span
								>
							{:else}
								<div class="size-1.5 rounded-full bg-muted-foreground/40"></div>
								<span class="text-xs font-medium text-muted-foreground">Inactive</span>
							{/if}
						</div>
					</div>
					<Chip
						variant={usageVariant(selectedVA.usage as BankAccount['usage'])}
						class="shrink-0 text-xs"
					>
						{selectedVA.usage}
					</Chip>
				</div>

				<!-- Details -->
				<div>
					<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
						Account Details
					</p>
					<dl class="divide-y divide-border/50">
						{#each [{ label: 'VA Number', value: selectedVA.virtualAccountNumber, copy: true }, { label: 'Bank', value: selectedVA.bankName, copy: false }, { label: 'Status', value: selectedVA.status, copy: false }, { label: 'Usage', value: selectedVA.usage, copy: false }] as const as row (row.label)}
							<div class="flex items-center justify-between gap-4 py-3">
								<dt class="text-xs text-muted-foreground">{row.label}</dt>
								<dd class="flex items-center gap-1.5">
									<span class="font-mono text-xs font-medium">{row.value}</span>
									{#if row.copy}
										<button
											type="button"
											onclick={() => copyText(row.value, `va-${row.label}`)}
											aria-label="Copy {row.label}"
											class="shrink-0 text-muted-foreground/40 transition-colors hover:text-muted-foreground focus-visible:outline-none"
										>
											{#if copiedKey === `va-${row.label}`}
												<Check class="size-3 text-emerald-500" />
											{:else}
												<Copy class="size-3" />
											{/if}
										</button>
									{/if}
								</dd>
							</div>
						{/each}
					</dl>
				</div>

				<!-- Recent credits -->
				{#if data.recentTransactions.some((t) => t.status === 'Completed')}
					<div>
						<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
							Recent Credits
						</p>
						<div class="space-y-2">
							{#each data.recentTransactions
								.filter((t) => t.status === 'Completed')
								.slice(0, 3) as txn (txn.id)}
								<div
									class="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-900/10"
								>
									<div>
										<p class="font-mono text-xs font-medium">{txn.txnId}</p>
										<p class="mt-0.5 text-xs text-muted-foreground">{formatDate(txn.dateTime)}</p>
									</div>
									<p class="font-semibold text-emerald-600 dark:text-emerald-400">
										+{formatCurrency(txn.amount)}
									</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#snippet footer()}
			<div class="flex w-full gap-3">
				<Button variant="outline" class="flex-1" onclick={() => (vaDrawerOpen = false)}
					>Close</Button
				>
				<Button
					class="flex-1"
					onclick={() => {
						vaDrawerOpen = false;
						openTransactions();
					}}
				>
					View All Transactions
					<ArrowRight class="ml-1.5 size-3.5" />
				</Button>
			</div>
		{/snippet}
	</Drawer>
</div>

<style>
	.balance-card {
		background: linear-gradient(135deg, var(--primary) 0%, var(--chart-1) 52%, var(--chart-2) 100%);
	}
	.balance-card:hover {
		box-shadow: 0 20px 48px -10px oklch(from var(--primary) l c h / 0.38);
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
	.card-shimmer {
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.06) 50%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: shimmer 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-12px);
		}
	}
	.float-animation {
		animation: float 5s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.7;
		}
	}
	.pulse-glow {
		animation: pulse-glow 3.5s ease-in-out infinite;
	}
</style>
