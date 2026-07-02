<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Chip } from '$lib/components/reusable';

	import {
		RefreshCw,
		Landmark,
		Wallet,
		ArrowUpFromLine,
		ArrowDownToLine,
		AlertCircle
	} from '$lib/assets/icons';

	import type { BankAccount } from '$lib/types/funds';
	import TransactionTable from '$lib/components/fund/TransactionTable.svelte';

	let { data } = $props();

	// ── Balance refresh (simulated) ───────────────────────────────────────
	let summaryLoading = $state(false);
	async function refreshSummary() {
		summaryLoading = true;
		await new Promise((r) => setTimeout(r, 800));
		summaryLoading = false;
	}

	// ── Formatters ────────────────────────────────────────────────────────
	function formatCurrency(n: number) {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 2
		}).format(n / 100);
	}

	function usageVariant(u: BankAccount['usage']): 'info' | 'warning' | 'success' {
		if (u === 'PayIn') return 'info';
		if (u === 'Payout') return 'warning';
		return 'success';
	}
</script>

<div class="min-h-full space-y-8 p-6 lg:p-8">
	<!-- ── Page header ───────────────────────────────────────────────── -->
	<div>
		<h1 class="text-xl font-semibold tracking-tight">Funds</h1>
		<p class="mt-0.5 text-sm text-muted-foreground">
			Monitor balances, linked bank accounts, and inward fund transactions.
		</p>
	</div>

	<!-- ── Section 1: Fund Summary ───────────────────────────────────── -->
	<section aria-label="Fund Summary">
		<div class="rounded-2xl border border-border bg-card p-6 shadow-xs">
			<!-- Card header -->
			<div class="mb-5 flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Total Available Balance</span>
				<button
					type="button"
					onclick={refreshSummary}
					aria-label="Refresh balances"
					class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				>
					<RefreshCw
						class={['size-3', summaryLoading && 'animate-spin'].filter(Boolean).join(' ')}
					/>
					<span class="hidden sm:inline">
						Updated {new Date(data.summary.lastUpdated).toLocaleTimeString('en-IN', {
							hour: '2-digit',
							minute: '2-digit'
						})}
					</span>
				</button>
			</div>

			<!-- Hero balance -->
			{#if summaryLoading}
				<Skeleton class="h-12 w-52" />
			{:else}
				<p class="text-4xl font-bold tracking-tight lg:text-5xl">
					{formatCurrency(data.summary.totalBalance)}
				</p>
			{/if}

			<!-- Divider -->
			<div class="my-6 border-t border-border/50"></div>

			<!-- Sub-balances -->
			<div class="grid grid-cols-2 gap-6">
				<div>
					<div class="mb-2 flex items-center gap-2">
						<div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
							<ArrowUpFromLine class="size-3 text-primary" />
						</div>
						<dt class="text-xs font-medium text-muted-foreground">PayIn Balance</dt>
					</div>
					{#if summaryLoading}
						<Skeleton class="h-7 w-36" />
					{:else}
						<dd class="text-2xl font-semibold tabular-nums">
							{formatCurrency(data.summary.payInBalance)}
						</dd>
					{/if}
				</div>

				<div>
					<div class="mb-2 flex items-center gap-2">
						<div class="flex size-6 items-center justify-center rounded-md bg-accent">
							<ArrowDownToLine class="size-3 text-accent-foreground" />
						</div>
						<dt class="text-xs font-medium text-muted-foreground">Payout Balance</dt>
					</div>
					{#if summaryLoading}
						<Skeleton class="h-7 w-36" />
					{:else}
						<dd class="text-2xl font-semibold tabular-nums">
							{formatCurrency(data.summary.payoutBalance)}
						</dd>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- ── Section 2: Active Bank Accounts ───────────────────────────── -->
	<section aria-label="Active Bank Accounts">
		<h2 class="mb-4 text-sm font-semibold">Active Bank Accounts</h2>

		{#if data.bankAccounts.length === 0}
			<div
				class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 py-12 text-center"
			>
				<Landmark class="size-8 text-muted-foreground/20" />
				<div>
					<p class="text-sm font-medium text-muted-foreground">No active bank accounts</p>
					<p class="mt-0.5 text-xs text-muted-foreground/60">
						Accounts will appear here once activated.
					</p>
				</div>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.bankAccounts as account (account.id)}
					<div
						class="rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
					>
						<div class="mb-4 flex items-start justify-between gap-2">
							<div class="flex items-center gap-3 min-w-0">
								<div
									class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10"
								>
									<Landmark class="size-4 text-primary" />
								</div>
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold">{account.bankName}</p>
									<p class="text-xs text-muted-foreground">{account.accountType}</p>
								</div>
							</div>
							<Chip variant={usageVariant(account.usage)} class="shrink-0 text-xs">
								{account.usage}
							</Chip>
						</div>
						<dl class="space-y-2 text-xs">
							<div class="flex justify-between gap-2">
								<dt class="text-muted-foreground">Account No.</dt>
								<dd class="font-mono font-medium">{account.accountNumber}</dd>
							</div>
							<div class="flex justify-between gap-2">
								<dt class="text-muted-foreground">IFSC</dt>
								<dd class="font-mono font-medium">{account.ifsc}</dd>
							</div>
							<div class="flex justify-between gap-2">
								<dt class="text-muted-foreground">Branch</dt>
								<dd class="max-w-[55%] truncate text-right font-medium">{account.branchName}</dd>
							</div>
						</dl>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Virtual Accounts -->
		{#if data.virtualAccounts.length > 0}
			<h3 class="mb-4 mt-6 text-sm font-semibold">Virtual Accounts</h3>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.virtualAccounts as va (va.id)}
					<div class="rounded-2xl border border-border bg-card p-5 shadow-xs">
						<div class="mb-4 flex items-center justify-between gap-2">
							<div class="flex items-center gap-3">
								<div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent">
									<Wallet class="size-4 text-accent-foreground" />
								</div>
								<span class="text-sm font-semibold">{va.bankName}</span>
							</div>
							<Chip variant={va.status === 'Active' ? 'success' : 'disabled'} class="text-xs">
								{va.status}
							</Chip>
						</div>
						<dl class="space-y-2 text-xs">
							<div class="flex justify-between gap-2">
								<dt class="text-muted-foreground">Virtual Account No.</dt>
								<dd class="font-mono font-medium">{va.virtualAccountNumber}</dd>
							</div>
							<div class="flex justify-between gap-2">
								<dt class="text-muted-foreground">Usage</dt>
								<dd>
									<Chip variant={usageVariant(va.usage as BankAccount['usage'])} class="text-xs">
										{va.usage}
									</Chip>
								</dd>
							</div>
						</dl>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- ── Section 3: Inward Fund Transactions ───────────────────────── -->
	<section aria-label="Inward Fund Transactions">
		{#if data.transactions.length === 0 && !data.total}
			<div
				class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 py-12 text-center"
			>
				<AlertCircle class="size-8 text-muted-foreground/20" />
				<div>
					<p class="text-sm font-medium text-muted-foreground">No transactions yet</p>
					<p class="mt-0.5 text-xs text-muted-foreground/60">
						Inward fund transactions will appear here.
					</p>
				</div>
			</div>
		{:else}
			<TransactionTable
				transactions={data.transactions}
				total={data.total}
				skip={data.skip}
				limit={data.limit}
			/>
		{/if}
	</section>
</div>
