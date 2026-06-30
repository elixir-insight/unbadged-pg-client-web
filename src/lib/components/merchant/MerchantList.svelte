<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { Chip, Dropdown } from '$lib/components/reusable';
	import Pagination from '$lib/components/reusable/pagination/pagination.svelte';
	import type { DropdownOption } from '$lib/components/reusable';
	import {
		Eye,
		RotateCcw,
		Landmark,
		Building2,
		Copy,
		Check,
		Search as SearchIcon
	} from '$lib/assets/icons';
	import { merchants, virtualAccounts } from '$lib/data/refunds-mock';
	import { createPagination } from '$lib/utils/pagination';
	import { debounce } from '$lib/utils/debounce';

	const pagination = createPagination();

	const LIMIT = 10;

	// ── URL params ────────────────────────────────────────────────────────────
	const urlMSkip = $derived(Math.max(0, Number(page.url.searchParams.get('mskip')) || 0));
	const urlMStatus = $derived(page.url.searchParams.get('mstatus') ?? '');
	const urlMFilter = $derived(page.url.searchParams.get('mfilter') ?? 'all');
	const urlMSearch = $derived(page.url.searchParams.get('msearch') ?? '');
	const urlMerchantId = $derived(page.url.searchParams.get('merchant') ?? merchants[0]?.id ?? '');
	const urlVaId = $derived(page.url.searchParams.get('va') ?? '');

	// ── Local state ───────────────────────────────────────────────────────────
	let merchantSearchInput = $state(page.url.searchParams.get('msearch') ?? '');
	let vaSearch = $state('');
	let copiedField = $state<string | null>(null);

	// ── Derived entities ──────────────────────────────────────────────────────
	const selectedMerchant = $derived(
		merchants.find((m) => m.id === urlMerchantId) ?? merchants[0] ?? null
	);
	const selectedVA = $derived(virtualAccounts.find((va) => va.id === urlVaId) ?? null);

	const filteredMerchants = $derived(
		merchants.filter((m) => {
			if (urlMStatus && m.status !== urlMStatus) return false;
			if (urlMSearch) {
				const q = urlMSearch.toLowerCase();
				if (urlMFilter === 'merchantId') return m.merchantId.toLowerCase().includes(q);
				if (urlMFilter === 'merchantName') return m.name.toLowerCase().includes(q);
				return m.name.toLowerCase().includes(q) || m.merchantId.toLowerCase().includes(q);
			}
			return true;
		})
	);
	const pagedMerchants = $derived(filteredMerchants.slice(urlMSkip, urlMSkip + LIMIT));
	const merchantTotalPages = $derived(Math.max(1, Math.ceil(filteredMerchants.length / LIMIT)));
	const merchantPageNumber = $derived(Math.floor(urlMSkip / LIMIT) + 1);

	const filteredVAs = $derived(
		virtualAccounts
			.filter((va) => va.merchantId === selectedMerchant?.id)
			.filter((va) => {
				const q = vaSearch.toLowerCase();
				return (
					!q || va.bankName.toLowerCase().includes(q) || va.accountNumber.toLowerCase().includes(q)
				);
			})
	);

	// ── Debounced search ──────────────────────────────────────────────────────
	const searchMerchants = debounce((val: string) => {
		if (val !== urlMSearch) pagination.updateParams({ msearch: val || null, mskip: '0' });
	}, 350);

	$effect(() => {
		searchMerchants(merchantSearchInput);
	});

	// ── Handlers ──────────────────────────────────────────────────────────────
	function selectMerchant(m: (typeof merchants)[0]) {
		vaSearch = '';
		pagination.updateParams({ merchant: m.id, mskip: '0' });
	}

	function openActivity(va: (typeof virtualAccounts)[0]) {
		pagination.updateParams(
			{
				view: 'activity',
				va: va.id,
				merchant: va.merchantId,
				skip: '0',
				filter: 'crn',
				value: null,
				status: null,
				payment: null,
				dateRange: 'last30',
				customFrom: null,
				customTo: null
			},
			true
		);
	}

	function resetLanding() {
		merchantSearchInput = '';
		pagination.updateParams({ mstatus: null, msearch: null, mskip: '0' });
	}

	async function copyToClipboard(text: string, field: string) {
		await navigator.clipboard.writeText(text).catch(() => {});
		copiedField = field;
		setTimeout(() => (copiedField = null), 1500);
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	const statusVariant = (s: string): 'success' | 'error' | 'warning' | 'info' | 'disabled' =>
		(({
			success: 'success',
			failed: 'error',
			pending: 'warning',
			processing: 'info',
			rejected: 'disabled',
			active: 'success',
			on_hold: 'warning',
			inactive: 'disabled'
		})[s] as ReturnType<typeof statusVariant>) ?? 'disabled';

	const statusLabel = (s: string) =>
		({
			active: 'Active',
			on_hold: 'On Hold',
			inactive: 'Inactive',
			success: 'Success',
			failed: 'Failed',
			pending: 'Pending',
			processing: 'Processing',
			rejected: 'Rejected'
		})[s] ?? s;

	const avatarColors = [
		'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
		'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
		'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
		'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
		'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
	];
	function getAvatarClass(mid: string) {
		return avatarColors[(parseInt(mid.replace('M', '')) - 1) % avatarColors.length];
	}
	function getMerchantInitials(name: string) {
		return name
			.split(' ')
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase();
	}
	function getLinkedCount(mid: string) {
		return virtualAccounts.filter((va) => va.merchantId === mid).length;
	}

	// ── Dropdown options ──────────────────────────────────────────────────────
	const merchantStatusOptions: DropdownOption[] = [
		{ value: 'active', label: 'Active' },
		{ value: 'on_hold', label: 'On Hold' },
		{ value: 'inactive', label: 'Inactive' }
	];
	// const merchantFilterOptions: DropdownOption[] = [
	// 	{ value: 'all', label: 'All Fields' }, { value: 'merchantName', label: 'Name' }, { value: 'merchantId', label: 'Merchant ID' }
	// ];
</script>

<div class="flex h-full flex-col">
	<div class="mb-5 shrink-0">
		<h1 class="text-xl font-semibold tracking-tight text-foreground">Refunds</h1>
		<p class="mt-0.5 text-sm text-muted-foreground">
			Select a merchant, then a virtual account to view refund activity.
		</p>
	</div>

	<div class="flex min-h-0 flex-1 gap-4">
		<!-- ── Merchant Panel ───────────────────────────────────────────────────── -->
		<div
			class="flex w-1/2 min-w-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
		>
			<div class="shrink-0 border-b border-border/40 px-5 py-4">
				<h2 class="text-sm font-semibold text-foreground">Merchants</h2>
				<p class="mt-0.5 text-xs text-muted-foreground">
					Select a merchant to view linked virtual accounts
				</p>
			</div>

			<!-- Filter bar -->
			<div class="flex shrink-0 items-center gap-2 border-b border-border/30 px-4 py-2.5">
				<Dropdown
					value={urlMStatus || undefined}
					options={merchantStatusOptions}
					placeholder="All Statuses"
					size="sm"
					bordered
					class="w-32"
					onValueChange={(v) => pagination.updateParams({ mstatus: v, mskip: '0' })}
				/>
				<!-- <Dropdown
					value={urlMFilter}
					options={merchantFilterOptions}
					placeholder="All Fields"
					size="sm"
					bordered
					class="w-28"
					onValueChange={(v) => pagination.updateParams({ mfilter: v, msearch: null, mskip: '0' })}
				/> -->
				<div class="relative flex flex-1 items-center">
					<SearchIcon
						class="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground"
					/>
					<input
						value={merchantSearchInput}
						oninput={(e) => (merchantSearchInput = e.currentTarget.value)}
						placeholder="Search by Merchant Name or Merchant ID..."
						class="h-8 w-full rounded-lg border border-border/60 bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
					/>
				</div>
				<button
					onclick={resetLanding}
					class="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
				>
					<RotateCcw class="h-3 w-3" /> Reset
				</button>
			</div>

			<!-- Merchant table -->
			<div class="min-h-0 flex-1 overflow-auto">
				{#if pagedMerchants.length === 0}
					<div class="flex h-40 flex-col items-center justify-center gap-2">
						<p class="text-sm text-muted-foreground">No merchants found</p>
					</div>
				{:else}
					<table class="w-full">
						<thead
							class="sticky top-0 z-10 border-b border-border/30 bg-card shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
						>
							<tr>
								<th
									class="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60"
									>Merchant</th
								>
								<th
									class="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60"
									>Merchant ID</th
								>
								<th
									class="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60"
									>Status</th
								>
							</tr>
						</thead>
						<tbody>
							{#each pagedMerchants as merchant (merchant.id)}
								{@const isSelected = selectedMerchant?.id === merchant.id}
								<tr
									class={cn(
										'cursor-pointer border-b border-border/20 transition-colors hover:bg-muted/20',
										isSelected && 'bg-primary/5'
									)}
									style:box-shadow={isSelected ? 'inset 3px 0 0 0 hsl(var(--primary))' : 'none'}
									onclick={() => selectMerchant(merchant)}
								>
									<td class="px-5 py-3">
										<div class="flex items-center gap-3">
											<div
												class={cn(
													'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
													getAvatarClass(merchant.id)
												)}
											>
												{getMerchantInitials(merchant.name)}
											</div>
											<div class="min-w-0">
												<p class="text-sm font-medium text-foreground">{merchant.name}</p>
												<p class="text-xs text-muted-foreground">
													{getLinkedCount(merchant.id)} linked account{getLinkedCount(
														merchant.id
													) !== 1
														? 's'
														: ''}
												</p>
											</div>
										</div>
									</td>
									<td class="px-5 py-3">
										<span
											class="max-w-24 truncate font-mono text-xs text-muted-foreground"
											title={merchant.merchantId}>{merchant.merchantId}</span
										>
									</td>
									<td class="px-5 py-3">
										<Chip variant={statusVariant(merchant.status)}
											>{statusLabel(merchant.status)}</Chip
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

			<!-- Merchant pagination -->
			<div class="flex shrink-0 items-center justify-between border-t border-border/30 px-4 py-2">
				<p class="text-xs text-muted-foreground/60">
					Showing {pagedMerchants.length} of {filteredMerchants.length} merchant{filteredMerchants.length !==
					1
						? 's'
						: ''}
				</p>
				{#if merchantTotalPages > 1}
					<Pagination
						currentPage={merchantPageNumber}
						pageCount={merchantTotalPages}
						handlePreviousClick={() =>
							pagination.updateParams({ mskip: String(Math.max(0, urlMSkip - LIMIT)) })}
						handleNextClick={() =>
							pagination.updateParams({
								mskip: String(Math.min((merchantTotalPages - 1) * LIMIT, urlMSkip + LIMIT))
							})}
						handleEnterPress={(p) => pagination.updateParams({ mskip: String((p - 1) * LIMIT) })}
					/>
				{/if}
			</div>
		</div>

		<!-- ── Virtual Accounts Panel ─────────────────────────────────────────── -->
		<div
			class="flex w-1/2 min-w-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
		>
			<div class="flex shrink-0 items-start justify-between border-b border-border/40 px-5 py-4">
				<div>
					<h2 class="text-sm font-semibold text-foreground">Linked Virtual Accounts</h2>
					{#if selectedMerchant}
						<p class="mt-0.5 text-xs text-muted-foreground">{selectedMerchant.name}</p>
					{/if}
				</div>
				{#if selectedMerchant}
					<span class="mt-0.5 text-xs text-muted-foreground"
						>{filteredVAs.length} account{filteredVAs.length !== 1 ? 's' : ''}</span
					>
				{/if}
			</div>

			{#if selectedMerchant}
				<div class="shrink-0 border-b border-border/30 px-4 py-2.5">
					<div class="relative flex items-center">
						<SearchIcon
							class="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground"
						/>
						<input
							bind:value={vaSearch}
							placeholder="Search by bank or account number..."
							class="h-8 w-full rounded-lg border border-border/60 bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
						/>
					</div>
				</div>

				<div class="min-h-0 flex-1 overflow-auto p-4">
					{#if filteredVAs.length === 0}
						<div class="flex h-40 flex-col items-center justify-center gap-2">
							<Landmark class="h-8 w-8 text-muted-foreground/20" />
							<p class="text-sm text-muted-foreground">No virtual accounts found</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each filteredVAs as va (va.id)}
								<div
									class={cn(
										'rounded-xl border bg-background p-4 shadow-xs transition-all hover:shadow-sm',
										selectedVA?.id === va.id
											? 'border-primary/40 bg-primary/2'
											: 'border-border/50 hover:border-border'
									)}
								>
									<div class="flex items-start justify-between gap-3">
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40"
											>
												<Landmark class="h-5 w-5 text-muted-foreground/60" />
											</div>
											<div class="min-w-0">
												<p class="font-medium text-foreground">{va.bankName}</p>
												<div class="mt-0.5 flex items-center gap-1.5">
													<p class="font-mono text-xs text-muted-foreground">{va.accountNumber}</p>
													<button
														onclick={() => copyToClipboard(va.accountNumber, va.id)}
														class="text-muted-foreground/40 transition-colors hover:text-muted-foreground"
													>
														{#if copiedField === va.id}<Check
																class="h-3 w-3 text-green-500"
															/>{:else}<Copy class="h-3 w-3" />{/if}
													</button>
												</div>
											</div>
										</div>
										<Chip variant={statusVariant(va.status)} class="mt-0.5 shrink-0"
											>{statusLabel(va.status)}</Chip
										>
									</div>
									<div class="mt-2 font-mono text-xs text-muted-foreground">IFSC: {va.ifsc}</div>
									<div class="mt-3 flex items-center justify-between">
										<p class="text-xs text-muted-foreground">Linked on {va.linkedDate}</p>
										<button
											onclick={() => openActivity(va)}
											class="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-all hover:bg-accent hover:shadow-sm active:scale-[0.98]"
										>
											<Eye class="h-3.5 w-3.5" /> View
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
					<div
						class="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20"
					>
						<Building2 class="h-6 w-6 text-muted-foreground/30" />
					</div>
					<p class="text-sm font-medium text-muted-foreground">No merchant selected</p>
					<p class="text-xs text-muted-foreground/60">
						Click a merchant row to view linked virtual accounts
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
