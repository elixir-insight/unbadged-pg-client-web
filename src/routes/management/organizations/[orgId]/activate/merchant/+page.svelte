<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Checkbox } from '$lib/components/reusable';
	import { AlertCircle, CheckCircle2, Circle, ThumbsUp } from '$lib/assets/icons';
	import type {
		OrganizationCommissionRule,
		OrganizationPayoutConfiguration
	} from '$lib/data/mockData';
	import { activationDocumentReady, merchantActivationValid } from '../../completeness';
	import { cloneOrganization } from '../../helpers';
	import PayoutConfigCards from '../../components/PayoutConfigCards.svelte';

	let { data } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);

	// svelte-ignore state_referenced_locally (draft is a one-time snapshot, manually resynced below when organization.id changes)
	let commissionDraft = $state(cloneOrganization(data.organization.commissionRules));
	// svelte-ignore state_referenced_locally (draft is a one-time snapshot, manually resynced below when organization.id changes)
	let payoutDraft = $state(cloneOrganization(data.organization.payoutConfiguration));
	let agreementConfirmed = $state(false);
	// svelte-ignore state_referenced_locally (one-time snapshot used to detect subsequent org changes)
	let lastOrgId = $state(data.organization.id);

	$effect(() => {
		if (organization.id !== lastOrgId) {
			commissionDraft = cloneOrganization(organization.commissionRules);
			payoutDraft = cloneOrganization(organization.payoutConfiguration);
			agreementConfirmed = false;
			lastOrgId = organization.id;
		}
	});

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

	const agreementDone = $derived(agreementConfirmed && activationDocumentReady(organization));

	const selectedMethodLabels = $derived(
		payoutDraft.allowedTransactionTypes.map((method) => method.transactionType).join(', ')
	);

	const canActivate = $derived(
		merchantActivationValid(
			{
				...organization,
				payoutConfiguration: payoutDraft,
				commissionRules: commissionDraft
			},
			agreementConfirmed
		)
	);

	const checklist = $derived([
		{
			key: 'limits',
			title: 'Limits',
			done: limitsConfigured,
			detail: 'Daily & per-transaction limits configured'
		},
		{
			key: 'methods',
			title: 'Payment Methods',
			done: methodsConfigured,
			detail: selectedMethodLabels || 'Select at least one payout method'
		},
		{
			key: 'commission',
			title: 'Commission Rules',
			done: commissionConfigured,
			detail: `Slabs: ${commissionDraft.length}`
		},
		{
			key: 'agreement',
			title: 'Business Agreement',
			done: agreementDone,
			detail: 'Review and accept terms'
		}
	]);

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

	function methodLabel(method: OrganizationCommissionRule['method']): string {
		return method === 'PERCENTAGE' ? 'Percentage' : 'Flat';
	}

	function activateMerchant() {
		if (!canActivate) return;
		const nextPayout: OrganizationPayoutConfiguration = cloneOrganization(payoutDraft);
		nextPayout.virtualAccountsEnabled = true;
		organization.payoutConfiguration = nextPayout;
		organization.commissionRules = cloneOrganization(commissionDraft);
		organization.status = 'ACTIVE';
		goto(resolve('/management/organizations/[orgId]/manage', { orgId }));
	}
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
	<div
		class="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-400"
		role="status"
	>
		<AlertCircle class="size-3.5 shrink-0" aria-hidden="true" />
		<p>This organization is not yet active — complete all sections to activate.</p>
	</div>

	<header>
		<h1 class="text-lg font-semibold text-foreground">Activate merchant</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Configure payout limits, methods, and commission before activating this organization.
		</p>
	</header>

	<div class="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
		<div class="space-y-4">
			<PayoutConfigCards bind:payoutDraft bind:commissionDraft />

			<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div class="border-b border-border px-5 py-4">
					<h2 class="text-sm font-semibold text-card-foreground">Business Agreement</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Review and accept the merchant terms before activation.
					</p>
				</div>
				<div class="p-5">
					<div class="flex items-start gap-3">
						<Checkbox id="merchant-agreement-confirm" bind:checked={agreementConfirmed} />
						<label for="merchant-agreement-confirm" class="text-sm leading-relaxed text-foreground">
							I confirm that the merchant details are accurate and I accept the
							<button type="button" class="font-medium text-primary underline underline-offset-2">
								Merchant Agreement
							</button>
							and
							<button type="button" class="font-medium text-primary underline underline-offset-2">
								Platform Terms of Service
							</button>
							.
						</label>
					</div>
					{#if agreementConfirmed && !activationDocumentReady(organization)}
						<p class="mt-3 text-sm text-muted-foreground" role="status">
							Upload the Business Agreement document in Documents before activation can complete.
						</p>
					{/if}
				</div>
			</section>

			<div class="flex justify-start">
				<Button variant="ghost" href={`/management/organizations/${orgId}/kyb`}>Cancel</Button>
			</div>
		</div>

		<aside
			class="overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:sticky lg:top-6"
		>
			<div class="border-b border-border px-5 py-4">
				<h2 class="text-sm font-semibold text-card-foreground">Activation Checklist</h2>
				<p class="mt-1 text-xs text-muted-foreground">All sections must be complete</p>
			</div>
			<div class="p-5">
				<ul class="space-y-4">
					{#each checklist as item (item.key)}
						<li class="flex items-start gap-3">
							{#if item.done}
								<CheckCircle2 class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
							{:else}
								<Circle class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							{/if}
							<div class="min-w-0">
								<p class="text-sm font-medium text-foreground">{item.title}</p>
								<p class="text-xs text-muted-foreground">{item.detail}</p>
							</div>
						</li>
					{/each}
				</ul>

				<div class="mt-5 rounded-lg border border-border bg-muted/20 p-3">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Commission Rules
					</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">
						{commissionDraft.length}
						<span class="text-sm font-normal text-muted-foreground">slabs</span>
					</p>
					<ul class="mt-3 space-y-1.5">
						{#each commissionDraft as rule, index (rule.id)}
							<li class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
								<span>{slabRangeLabel(index)}</span>
								<span>{methodLabel(rule.method)}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div class="mt-5">
					{#if canActivate}
						<Button class="w-full" onclick={activateMerchant}>
							<ThumbsUp class="size-4" />
							Activate merchant
						</Button>
					{:else}
						<Button class="w-full" disabled variant="secondary">Complete all sections</Button>
					{/if}
				</div>
			</div>
		</aside>
	</div>
</div>
