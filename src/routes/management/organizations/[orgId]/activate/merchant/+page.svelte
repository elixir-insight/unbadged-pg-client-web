<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import { Button } from '$lib/components/reusable';
	import { AlertCircle } from '$lib/assets/icons';
	import type { OrganizationFeeConfigDraft } from '$lib/data/mockData';
	import {
		createCommissionDefaultSlabs,
		createDefaultSlabRows,
		createPartnerDefaultSlabs,
		defaultPaymentPathSelection,
		resolveMethodConfigId,
		validateSlabs
	} from '$lib/fee-config';
	import type { FeeSectionDraft, FeeSlabRow, PaymentPathSelection } from '$lib/fee-config/types';
	import FeeSectionCard from '../../components/fee-config/FeeSectionCard.svelte';
	import LivePreviewPanel from '../../components/fee-config/LivePreviewPanel.svelte';
	import OpenDecisionsCard from '../../components/fee-config/OpenDecisionsCard.svelte';
	import PaymentPathCard from '../../components/fee-config/PaymentPathCard.svelte';
	import { defaultOrganizationLandingPath } from '../../helpers';

	let { data } = $props();

	const organization = $derived(data.organization);

	let pathSelection = $state<PaymentPathSelection>(defaultPaymentPathSelection());
	let chargesSlabs = $state<FeeSlabRow[]>(createDefaultSlabRows());
	let commissionSlabs = $state<FeeSlabRow[]>(createCommissionDefaultSlabs());
	let partnerSlabs = $state<FeeSlabRow[]>(createPartnerDefaultSlabs());
	let chargesEffectiveFrom = $state(new Date().toISOString().slice(0, 10));
	let chargesEffectiveTo = $state('');
	let commissionEffectiveFrom = $state(new Date().toISOString().slice(0, 10));
	let commissionEffectiveTo = $state('');
	let partnerEffectiveFrom = $state(new Date().toISOString().slice(0, 10));
	let partnerEffectiveTo = $state('');
	let testGrossAmount = $state('50000');
	let lastOrgId = $state('');

	let chargesValidation = $state<ReturnType<typeof validateSlabs>>({
		valid: true,
		errors: [],
		rowErrors: {}
	});
	let commissionValidation = $state<ReturnType<typeof validateSlabs>>({
		valid: true,
		errors: [],
		rowErrors: {}
	});
	let partnerValidation = $state<ReturnType<typeof validateSlabs>>({
		valid: true,
		errors: [],
		rowErrors: {}
	});

	let chargesSaved = $state(false);
	let commissionSaved = $state(false);
	let partnerSaved = $state(false);

	const methodConfigId = $derived(resolveMethodConfigId(pathSelection));
	const pathReady = $derived(methodConfigId !== null);

	const cancelHref = $derived(
		defaultOrganizationLandingPath(organization.id, organization.status) as ResolvedPathname
	);

	function cloneSlabs(slabs: FeeSlabRow[]): FeeSlabRow[] {
		return slabs.map((slab) => ({ ...slab }));
	}

	function sectionDraft(
		slabs: FeeSlabRow[],
		effectiveFrom: string,
		effectiveTo: string
	): FeeSectionDraft {
		return {
			slabs: cloneSlabs(slabs),
			effectiveFrom,
			effectiveTo
		};
	}

	function loadDraftForPath(configId: string | null) {
		if (!configId) return;
		const existing = organization.feeConfigDrafts.find(
			(draft) => draft.methodConfigId === configId
		);
		if (!existing) {
			chargesSlabs = createDefaultSlabRows();
			commissionSlabs = createCommissionDefaultSlabs();
			partnerSlabs = createPartnerDefaultSlabs();
			chargesEffectiveFrom = new Date().toISOString().slice(0, 10);
			commissionEffectiveFrom = new Date().toISOString().slice(0, 10);
			partnerEffectiveFrom = new Date().toISOString().slice(0, 10);
			chargesEffectiveTo = '';
			commissionEffectiveTo = '';
			partnerEffectiveTo = '';
			return;
		}

		if (existing.charges) {
			chargesSlabs = cloneSlabs(existing.charges.slabs);
			chargesEffectiveFrom = existing.charges.effectiveFrom;
			chargesEffectiveTo = existing.charges.effectiveTo;
		}
		if (existing.commission) {
			commissionSlabs = cloneSlabs(existing.commission.slabs);
			commissionEffectiveFrom = existing.commission.effectiveFrom;
			commissionEffectiveTo = existing.commission.effectiveTo;
		}
		if (existing.partner) {
			partnerSlabs = cloneSlabs(existing.partner.slabs);
			partnerEffectiveFrom = existing.partner.effectiveFrom;
			partnerEffectiveTo = existing.partner.effectiveTo;
		}
	}

	function upsertDraft(nextDraft: OrganizationFeeConfigDraft) {
		const index = organization.feeConfigDrafts.findIndex(
			(draft) => draft.methodConfigId === nextDraft.methodConfigId
		);
		if (index >= 0) {
			organization.feeConfigDrafts[index] = nextDraft;
			return;
		}
		organization.feeConfigDrafts = [...organization.feeConfigDrafts, nextDraft];
	}

	function getCurrentDraft(): OrganizationFeeConfigDraft | null {
		if (!methodConfigId) return null;
		return (
			organization.feeConfigDrafts.find((draft) => draft.methodConfigId === methodConfigId) ?? {
				methodConfigId,
				charges: null,
				commission: null,
				partner: null,
				feeConfigId: null
			}
		);
	}

	function saveCharges() {
		if (!methodConfigId) return;
		const validation = validateSlabs(chargesSlabs);
		chargesValidation = validation;
		if (!validation.valid) return;

		const current = getCurrentDraft();
		if (!current) return;
		const feeConfigId = current.feeConfigId ?? `fc-${methodConfigId}-${Date.now()}`;
		upsertDraft({
			...current,
			feeConfigId,
			charges: sectionDraft(chargesSlabs, chargesEffectiveFrom, chargesEffectiveTo)
		});
		chargesSaved = true;
		setTimeout(() => {
			chargesSaved = false;
		}, 3000);
	}

	function saveCommission() {
		if (!methodConfigId) return;
		const validation = validateSlabs(commissionSlabs);
		commissionValidation = validation;
		if (!validation.valid) return;

		const current = getCurrentDraft();
		if (!current) return;
		upsertDraft({
			...current,
			commission: sectionDraft(commissionSlabs, commissionEffectiveFrom, commissionEffectiveTo)
		});
		commissionSaved = true;
		setTimeout(() => {
			commissionSaved = false;
		}, 3000);
	}

	function savePartner() {
		if (!methodConfigId) return;
		const validation = validateSlabs(partnerSlabs);
		partnerValidation = validation;
		if (!validation.valid) return;

		const current = getCurrentDraft();
		if (!current) return;
		upsertDraft({
			...current,
			partner: sectionDraft(partnerSlabs, partnerEffectiveFrom, partnerEffectiveTo)
		});
		partnerSaved = true;
		setTimeout(() => {
			partnerSaved = false;
		}, 3000);
	}

	$effect(() => {
		if (!lastOrgId) {
			lastOrgId = organization.id;
			return;
		}
		if (organization.id !== lastOrgId) {
			pathSelection = defaultPaymentPathSelection();
			chargesSlabs = createDefaultSlabRows();
			commissionSlabs = createCommissionDefaultSlabs();
			partnerSlabs = createPartnerDefaultSlabs();
			lastOrgId = organization.id;
		}
	});

	$effect(() => {
		loadDraftForPath(methodConfigId);
	});
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
	<div
		class="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-400"
		role="status"
	>
		<AlertCircle class="size-3.5 shrink-0" aria-hidden="true" />
		<p>This organization is not yet active — configure fees before activation.</p>
	</div>

	<header>
		<h1 class="text-lg font-semibold text-foreground">Fee Configuration</h1>
	</header>

	<div class="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
		<div class="space-y-4">
			<PaymentPathCard bind:selection={pathSelection} />

			<FeeSectionCard
				title="Charges"
				subtitle="Gateway / aggregator fees — pipeline-level, applies to all organizations."
				disabled={!pathReady}
				placeholder="Resolve a payment path before configuring charges."
				bind:slabs={chargesSlabs}
				bind:effectiveFrom={chargesEffectiveFrom}
				bind:effectiveTo={chargesEffectiveTo}
				rowErrors={chargesValidation.rowErrors}
				validationErrors={chargesValidation.errors}
				saveLabel="Save charges"
				saved={chargesSaved}
				onSave={saveCharges}
			/>

			<FeeSectionCard
				title="Commission"
				subtitle="Pipeline fee elixir pay earns — negotiated per organization."
				disabled={!pathReady}
				placeholder="Select a payment path to configure commission."
				bind:slabs={commissionSlabs}
				bind:effectiveFrom={commissionEffectiveFrom}
				bind:effectiveTo={commissionEffectiveTo}
				rowErrors={commissionValidation.rowErrors}
				validationErrors={commissionValidation.errors}
				saveLabel="Save commission"
				saved={commissionSaved}
				onSave={saveCommission}
			/>

			<FeeSectionCard
				title="Partner fee"
				subtitle="Cut paid to the organization's referring reseller/partner."
				disabled={!pathReady}
				placeholder="Select a payment path to configure partner fee."
				bind:slabs={partnerSlabs}
				bind:effectiveFrom={partnerEffectiveFrom}
				bind:effectiveTo={partnerEffectiveTo}
				rowErrors={partnerValidation.rowErrors}
				validationErrors={partnerValidation.errors}
				saveLabel="Save partner fee"
				saved={partnerSaved}
				onSave={savePartner}
			/>

			<div class="flex justify-start">
				<Button variant="ghost" href={cancelHref}>Cancel</Button>
			</div>
		</div>

		<aside class="space-y-4 lg:sticky lg:top-6">
			<LivePreviewPanel
				selection={pathSelection}
				bind:testGrossAmount
				{chargesSlabs}
				{commissionSlabs}
				{partnerSlabs}
			/>
			<OpenDecisionsCard />
		</aside>
	</div>
</div>
