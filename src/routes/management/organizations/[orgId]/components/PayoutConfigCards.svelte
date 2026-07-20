<script lang="ts">
	import { Button, Chip, Dropdown, Input } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { AlertCircle, CheckCircle2, Info, Plus, Trash2 } from '$lib/assets/icons';
	import type {
		OrganizationCommissionRule,
		OrganizationMethodLimit,
		OrganizationPayoutConfiguration
	} from '$lib/data/mockData';
	import { availableBankPipelines } from '../../create-organization/constants';

	type TransactionType = OrganizationMethodLimit['transactionType'];

	const TRANSACTION_TYPES: TransactionType[] = ['IMPS', 'NEFT', 'RTGS', 'UPI'];

	const commissionMethodOptions = [
		{ value: 'FLATRATE' as const, label: 'Flat Rate' },
		{ value: 'PERCENTAGE' as const, label: 'Percentage' }
	];

	let {
		payoutDraft = $bindable(),
		commissionDraft = $bindable()
	}: {
		payoutDraft: OrganizationPayoutConfiguration;
		commissionDraft: OrganizationCommissionRule[];
	} = $props();

	const bankPipelineOptions: DropdownOption[] = availableBankPipelines.map((pipeline) => ({
		value: pipeline.value,
		label: pipeline.value
	}));

	const limitsConfigured = $derived(
		Boolean(
			payoutDraft.securityDeposit &&
			payoutDraft.dailyTxnLimit &&
			payoutDraft.txnAmountMin &&
			payoutDraft.txnAmountMax &&
			payoutDraft.dailyDepositLimit &&
			payoutDraft.bankPipeline
		)
	);

	const methodsConfigured = $derived(payoutDraft.allowedTransactionTypes.length > 0);

	const commissionConfigured = $derived(
		commissionDraft.length >= 2 &&
			commissionDraft.every(
				(rule) => rule.baseAmount && rule.method && rule.gatewayFee && rule.partnerFee
			)
	);

	const methodsDailyTotal = $derived(
		payoutDraft.allowedTransactionTypes.reduce(
			(sum, method) => sum + (Number(method.dailyTxnLimit) || 0),
			0
		)
	);
	const parentDailyLimit = $derived(Number(payoutDraft.dailyTxnLimit) || 0);
	const exceedsDailyCap = $derived(parentDailyLimit > 0 && methodsDailyTotal > parentDailyLimit);

	function formatAmount(value: string): string {
		const numeric = Number(value);
		if (!value || Number.isNaN(numeric)) return value || '—';
		return numeric.toLocaleString('en-IN');
	}

	function slabRangeLabel(index: number): string {
		const current = commissionDraft[index]?.baseAmount ?? '';
		const next = commissionDraft[index + 1]?.baseAmount;
		if (!current) return '—';
		if (!next) return `${formatAmount(current)}+`;
		return `${formatAmount(current)} – ${formatAmount(next)}`;
	}

	function emptyCommissionRow(): OrganizationCommissionRule {
		return {
			id: `commission-${Date.now()}-${commissionDraft.length + 1}`,
			baseAmount: '',
			method: 'FLATRATE',
			gatewayFee: '',
			partnerFee: ''
		};
	}

	function addCommissionRow() {
		commissionDraft = [...commissionDraft, emptyCommissionRow()];
	}

	function removeCommissionRow(index: number) {
		if (index < 2) return;
		commissionDraft = commissionDraft.filter((_, rowIndex) => rowIndex !== index);
	}

	function isMethodSelected(type: TransactionType): boolean {
		return payoutDraft.allowedTransactionTypes.some((method) => method.transactionType === type);
	}

	function getMethodLimit(type: TransactionType): OrganizationMethodLimit | undefined {
		return payoutDraft.allowedTransactionTypes.find((method) => method.transactionType === type);
	}

	function toggleMethod(type: TransactionType) {
		if (isMethodSelected(type)) {
			payoutDraft.allowedTransactionTypes = payoutDraft.allowedTransactionTypes.filter(
				(method) => method.transactionType !== type
			);
			return;
		}
		payoutDraft.allowedTransactionTypes = [
			...payoutDraft.allowedTransactionTypes,
			{
				transactionType: type,
				txnAmountMin: '',
				txnAmountMax: '',
				dailyTxnLimit: ''
			}
		];
	}

	function updateMethodField(
		type: TransactionType,
		field: keyof Omit<OrganizationMethodLimit, 'transactionType'>,
		value: string
	) {
		payoutDraft.allowedTransactionTypes = payoutDraft.allowedTransactionTypes.map((method) =>
			method.transactionType === type ? { ...method, [field]: value } : method
		);
	}
</script>

{#snippet statusChip(configured: boolean)}
	<Chip variant={configured ? 'success' : 'warning'}>
		{#if configured}
			<CheckCircle2 class="size-3" />
			Configured
		{:else}
			<AlertCircle class="size-3" />
			Incomplete
		{/if}
	</Chip>
{/snippet}

{#snippet cardHeader(title: string, subtitle: string, configured: boolean)}
	<div class="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
		<div class="min-w-0">
			<h2 class="text-sm font-semibold text-card-foreground">{title}</h2>
			<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
		</div>
		{@render statusChip(configured)}
	</div>
{/snippet}

<div class="space-y-4">
	<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
		{@render cardHeader('Limits', 'Configure transaction and deposit limits', limitsConfigured)}
		<div class="grid gap-4 p-5 sm:grid-cols-2">
			<label class="space-y-2">
				<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Security Deposit
				</span>
				<Input inputmode="decimal" bind:value={payoutDraft.securityDeposit} placeholder="0" />
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Daily Txn Limit
				</span>
				<Input inputmode="decimal" bind:value={payoutDraft.dailyTxnLimit} placeholder="0" />
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Min Txn Amount
				</span>
				<Input inputmode="decimal" bind:value={payoutDraft.txnAmountMin} placeholder="100" />
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Max Txn Amount
				</span>
				<Input inputmode="decimal" bind:value={payoutDraft.txnAmountMax} placeholder="0" />
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Daily Deposit Limit
				</span>
				<Input inputmode="decimal" bind:value={payoutDraft.dailyDepositLimit} placeholder="0" />
			</label>
			<label class="space-y-2">
				<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Bank Pipeline
				</span>
				<Dropdown
					bind:value={payoutDraft.bankPipeline}
					options={bankPipelineOptions}
					placeholder="Select pipeline"
					class="w-full"
				/>
			</label>
		</div>
	</section>

	<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
		{@render cardHeader(
			'Payment Methods',
			'Select allowed payout methods and per-method limits',
			methodsConfigured
		)}
		<div class="p-5">
			<div class="flex flex-wrap gap-2">
				{#each TRANSACTION_TYPES as type (type)}
					{@const selected = isMethodSelected(type)}
					<Button
						type="button"
						size="sm"
						variant={selected ? 'default' : 'outline'}
						onclick={() => toggleMethod(type)}
						aria-pressed={selected}
					>
						{type}
					</Button>
				{/each}
			</div>

			{#if methodsConfigured}
				<div class="mt-4 space-y-3">
					{#each TRANSACTION_TYPES as type (type)}
						{@const methodLimit = getMethodLimit(type)}
						{#if methodLimit}
							<div class="rounded-lg border border-border bg-muted/20 p-3">
								<div class="mb-3 flex items-center justify-between gap-2">
									<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
										{type}
									</p>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => toggleMethod(type)}
										aria-label="Remove {type}"
									>
										<Trash2 class="size-3.5" />
										Remove
									</Button>
								</div>
								<div class="grid gap-3 sm:grid-cols-3">
									<label class="space-y-2">
										<span class="text-xs font-medium text-muted-foreground">Min</span>
										<Input
											inputmode="decimal"
											value={methodLimit.txnAmountMin}
											oninput={(event) =>
												updateMethodField(
													type,
													'txnAmountMin',
													(event.currentTarget as HTMLInputElement).value
												)}
											placeholder="Min"
											aria-label="{type} min amount"
										/>
									</label>
									<label class="space-y-2">
										<span class="text-xs font-medium text-muted-foreground">Max</span>
										<Input
											inputmode="decimal"
											value={methodLimit.txnAmountMax}
											oninput={(event) =>
												updateMethodField(
													type,
													'txnAmountMax',
													(event.currentTarget as HTMLInputElement).value
												)}
											placeholder="Max"
											aria-label="{type} max amount"
										/>
									</label>
									<label class="space-y-2">
										<span class="text-xs font-medium text-muted-foreground">Daily</span>
										<Input
											inputmode="decimal"
											value={methodLimit.dailyTxnLimit}
											oninput={(event) =>
												updateMethodField(
													type,
													'dailyTxnLimit',
													(event.currentTarget as HTMLInputElement).value
												)}
											placeholder="Daily"
											aria-label="{type} daily limit"
										/>
									</label>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			{#if exceedsDailyCap}
				<p class="mt-3 text-sm text-destructive" role="alert">
					Method daily limits total {methodsDailyTotal}, which exceeds the parent daily txn limit of
					{parentDailyLimit}.
				</p>
			{/if}
		</div>
	</section>

	<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
		{@render cardHeader(
			'Commission Rules',
			'Define gateway and partner fees by amount slab',
			commissionConfigured
		)}
		<div class="p-5">
			<div
				class="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground"
			>
				<Info class="mt-0.5 size-4 shrink-0 text-foreground" />
				<p>
					Gateway fee is charged by the platform and deducted from the transaction. Partner fee is
					your earning on each transaction.
				</p>
			</div>

			<div class="mb-2 hidden grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] gap-3 px-1 sm:grid">
				<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Amount Slab
				</p>
				<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Method</p>
				<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Gateway Fee <span class="text-destructive" aria-hidden="true">*</span>
				</p>
				<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Partner Fee <span class="text-destructive" aria-hidden="true">*</span>
				</p>
				<span class="sr-only">Actions</span>
			</div>

			<div class="space-y-4">
				{#each commissionDraft as rule, index (rule.id)}
					<div class="grid items-start gap-3 sm:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto]">
						<label class="space-y-2">
							<span class="text-xs font-medium text-muted-foreground sm:hidden">Amount Slab</span>
							<Input
								inputmode="decimal"
								bind:value={rule.baseAmount}
								placeholder="Enter amount"
								aria-label="Amount slab for row {index + 1}"
							/>
							<p class="text-xs text-muted-foreground">{slabRangeLabel(index)}</p>
						</label>

						<div class="space-y-2">
							<span class="text-xs font-medium text-muted-foreground sm:hidden">Method</span>
							<div
								class="flex rounded-lg border border-border bg-background p-0.5"
								role="group"
								aria-label="Commission method for row {index + 1}"
							>
								{#each commissionMethodOptions as option (option.value)}
									<Button
										type="button"
										size="sm"
										variant={rule.method === option.value ? 'default' : 'ghost'}
										class="flex-1"
										aria-pressed={rule.method === option.value}
										onclick={() => {
											rule.method = option.value;
										}}
									>
										{option.label}
									</Button>
								{/each}
							</div>
						</div>

						<label class="space-y-2">
							<span class="text-xs font-medium text-muted-foreground sm:hidden">Gateway Fee *</span>
							<div class="relative">
								<span
									class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
								>
									₹
								</span>
								<Input
									inputmode="decimal"
									bind:value={rule.gatewayFee}
									placeholder="0"
									aria-label="Gateway fee for row {index + 1}"
									required
									class="pl-6"
								/>
							</div>
						</label>

						<label class="space-y-2">
							<span class="text-xs font-medium text-muted-foreground sm:hidden">Partner Fee *</span>
							<div class="relative">
								<span
									class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
								>
									₹
								</span>
								<Input
									inputmode="decimal"
									bind:value={rule.partnerFee}
									placeholder="0"
									aria-label="Partner fee for row {index + 1}"
									required
									class="pl-6"
								/>
							</div>
						</label>

						{#if index >= 2}
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								class="mt-1"
								aria-label="Remove commission row {index + 1}"
								onclick={() => removeCommissionRow(index)}
							>
								<Trash2 class="size-3.5 text-muted-foreground" />
							</Button>
						{:else}
							<span class="hidden size-8 sm:block" aria-hidden="true"></span>
						{/if}
					</div>
				{/each}
			</div>

			<Button type="button" variant="link" class="mt-4 px-0" onclick={addCommissionRow}>
				<Plus class="size-3.5" />
				Add commission slab
			</Button>
		</div>
	</section>
</div>
