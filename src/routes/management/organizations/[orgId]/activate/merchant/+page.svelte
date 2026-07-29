<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { Button, toast } from '$lib/components/reusable';
	import { AlertCircle } from '$lib/assets/icons';
	import {
		createCommissionDefaultSlabs,
		createDefaultSlabRows,
		validateSlabs
	} from '$lib/fee-config';
	import type { FeeSlabRow } from '$lib/fee-config/types';
	import {
		filterChargeConfigurationsForPath,
		hasUnsavedFeeConfigurationChanges,
		isPersistedChargeConfigurationId,
		mapChargeConfigurationsToSlabs,
		mapSlabToUpdatePayload,
		mapSlabsToCreateItems,
		resolveDefaultGstPercentage,
		slabChangedFromBaseline,
		toChargeBaseAmountDisplay,
		type ChargeConfigurationItem
	} from '$lib/charge-configuration';
	import { mapSlabsToCommissionCreateItems } from '$lib/commission-configuration';
	import {
		formatApiLivePreviewPath,
		resolveMethodConfigIdFromConfigs,
		type PaymentMethodConfigItem,
		type PaymentPathApiSelection
	} from '$lib/payment-method-configuration';
	import FeeSectionCard from '../../components/fee-config/FeeSectionCard.svelte';
	import LivePreviewPanel from '../../components/fee-config/LivePreviewPanel.svelte';
	import PaymentPathCard from '../../components/fee-config/PaymentPathCard.svelte';
	import { defaultOrganizationLandingPath, feesPath } from '../../helpers';

	let { data } = $props();

	const organization = $derived(data.organization);
	const payinVan = $derived(data.payinVan);
	const vanError = $derived(data.vanError);
	const vanReady = $derived(Boolean(payinVan?.virtualAccountNumber));
	const pipelineOptions = $derived(data.pipelineOptions ?? []);

	function emptyPathSelection(): PaymentPathApiSelection {
		return {
			pipeline: '',
			method: '',
			instrument: '',
			paymentRails: ''
		};
	}

	let pathSelection = $state<PaymentPathApiSelection>(emptyPathSelection());
	let methodConfigurations = $state<PaymentMethodConfigItem[]>(
		untrack(() => data.methodConfigurations ?? [])
	);
	let configurationsLoading = $state(false);
	let configurationsError = $state<string | null>(
		untrack(() => data.methodConfigurationsError ?? null)
	);
	let chargeConfigurations = $state<ChargeConfigurationItem[]>(
		untrack(() => data.chargeConfigurations ?? [])
	);
	let commissionConfigurations = $state<ChargeConfigurationItem[]>(
		untrack(() => data.commissionConfigurations ?? [])
	);
	let chargesBaselineConfigs = $state<ChargeConfigurationItem[]>([]);
	let commissionBaselineConfigs = $state<ChargeConfigurationItem[]>([]);
	let chargesBaselineSlabs = $state<FeeSlabRow[]>([]);
	let commissionBaselineSlabs = $state<FeeSlabRow[]>([]);
	let chargesLoadedFromServer = $state(false);
	let commissionLoadedFromServer = $state(false);
	let chargesSaving = $state(false);
	let commissionSaving = $state(false);
	let chargesSlabs = $state<FeeSlabRow[]>(createDefaultSlabRows());
	let commissionSlabs = $state<FeeSlabRow[]>(createCommissionDefaultSlabs());
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

	let chargesSaved = $state(false);
	let commissionSaved = $state(false);
	let chargesConfigured = $state(false);
	let commissionConfigured = $state(false);
	let vanCreatedNotified = $state(false);
	let pipelinesErrorNotified = $state(false);
	let configurationsErrorNotified = $state(false);
	let chargeConfigurationsErrorNotified = $state(false);
	let commissionConfigurationsErrorNotified = $state(false);
	let pipelineDefaultApplied = $state(false);

	let lastAppliedDraftKey = '';

	const methodConfigId = $derived(
		resolveMethodConfigIdFromConfigs(methodConfigurations, pathSelection)
	);
	const pathBreadcrumb = $derived(formatApiLivePreviewPath(pathSelection));
	const pathReady = $derived(methodConfigId !== null);
	const chargesReady = $derived(vanReady && pathReady);
	const feeConfigComplete = $derived(pathReady && chargesConfigured && commissionConfigured);
	const chargesSaveEnabled = $derived(
		hasUnsavedFeeConfigurationChanges(
			chargesSlabs,
			chargesBaselineSlabs,
			chargesBaselineConfigs,
			chargesConfigured
		)
	);
	const commissionSaveEnabled = $derived(
		hasUnsavedFeeConfigurationChanges(
			commissionSlabs,
			commissionBaselineSlabs,
			commissionBaselineConfigs,
			commissionConfigured
		)
	);

	const cancelHref = $derived(
		defaultOrganizationLandingPath(organization.id, organization.status) as ResolvedPathname
	);

	function cloneSlabs(slabs: FeeSlabRow[]): FeeSlabRow[] {
		return slabs.map((slab) => ({ ...slab }));
	}

	function applyChargesForMethodConfig(configId: string | null) {
		if (!configId || !vanReady) {
			chargesLoadedFromServer = false;
			chargesBaselineConfigs = [];
			chargesBaselineSlabs = [];
			chargesConfigured = false;
			chargesSlabs = createDefaultSlabRows();
			return;
		}

		const fromApi = mapChargeConfigurationsToSlabs(
			chargeConfigurations,
			configId,
			payinVan?.virtualAccountNumber
		);

		if (fromApi.hasConfigurations) {
			chargesBaselineConfigs = filterChargeConfigurationsForPath(
				chargeConfigurations,
				configId,
				payinVan?.virtualAccountNumber
			);
			chargesSlabs = cloneSlabs(fromApi.slabs).map((slab) => {
				const rawBaseAmount =
					chargesBaselineConfigs.find((config) => config.id === slab.id)?.baseAmount ??
					slab.baseAmount;
				return {
					...slab,
					baseAmount: toChargeBaseAmountDisplay(rawBaseAmount)
				};
			});
			chargesBaselineSlabs = cloneSlabs(chargesSlabs);
			chargesConfigured = true;
			chargesLoadedFromServer = true;
			return;
		}

		chargesLoadedFromServer = false;
		chargesBaselineConfigs = [];
		const existing = organization.feeConfigDrafts.find(
			(draft) => draft.methodConfigId === configId
		);

		if (existing?.charges) {
			chargesSlabs = cloneSlabs(existing.charges.slabs);
			chargesBaselineSlabs = cloneSlabs(chargesSlabs);
			chargesConfigured = true;
			return;
		}

		chargesBaselineSlabs = [];
		chargesSlabs = createDefaultSlabRows();
		chargesConfigured = false;
	}

	function applyCommissionForMethodConfig(configId: string | null) {
		if (!configId || !vanReady) {
			commissionLoadedFromServer = false;
			commissionBaselineConfigs = [];
			commissionBaselineSlabs = [];
			commissionConfigured = false;
			commissionSlabs = createCommissionDefaultSlabs();
			return;
		}

		const fromApi = mapChargeConfigurationsToSlabs(
			commissionConfigurations,
			configId,
			payinVan?.virtualAccountNumber
		);

		if (fromApi.hasConfigurations) {
			commissionBaselineConfigs = filterChargeConfigurationsForPath(
				commissionConfigurations,
				configId,
				payinVan?.virtualAccountNumber
			);
			commissionSlabs = cloneSlabs(fromApi.slabs).map((slab) => {
				const rawBaseAmount =
					commissionBaselineConfigs.find((config) => config.id === slab.id)?.baseAmount ??
					slab.baseAmount;
				return {
					...slab,
					baseAmount: toChargeBaseAmountDisplay(rawBaseAmount)
				};
			});
			commissionBaselineSlabs = cloneSlabs(commissionSlabs);
			commissionConfigured = true;
			commissionLoadedFromServer = true;
			return;
		}

		commissionLoadedFromServer = false;
		commissionBaselineConfigs = [];
		const existing = organization.feeConfigDrafts.find(
			(draft) => draft.methodConfigId === configId
		);

		if (existing?.commission) {
			commissionSlabs = cloneSlabs(existing.commission.slabs);
			commissionBaselineSlabs = cloneSlabs(commissionSlabs);
			commissionConfigured = true;
			return;
		}

		commissionBaselineSlabs = [];
		commissionSlabs = createCommissionDefaultSlabs();
		commissionConfigured = false;
	}

	function loadDraftForPath(configId: string | null) {
		applyChargesForMethodConfig(configId);
		applyCommissionForMethodConfig(configId);
	}

	function draftLoadKey(configId: string | null): string {
		const vaNumber = payinVan?.virtualAccountNumber ?? '';
		const chargesKey = chargeConfigurations
			.map(
				(config) =>
					`${config.id}:${config.baseAmount}:${config.chargeRate}:${config.chargeType}:${config.gstExclusive}`
			)
			.join('|');
		const commissionKey = commissionConfigurations
			.map(
				(config) =>
					`${config.id}:${config.baseAmount}:${config.chargeRate}:${config.chargeType}:${config.gstExclusive}`
			)
			.join('|');
		return `${configId ?? ''}|${vaNumber}|${chargesKey}|${commissionKey}`;
	}

	function saveCharges() {
		void persistChargeConfigurations();
	}

	async function reloadChargeConfigurations() {
		const vaNumber = payinVan?.virtualAccountNumber?.trim();
		if (!vaNumber) return;

		const response = await fetch(
			`${resolve('/api/management/organizations/[orgId]/charge-configurations', {
				orgId: organization.id
			})}?vaNumber=${encodeURIComponent(vaNumber)}`
		);
		const body: { configurations?: ChargeConfigurationItem[]; message?: string } =
			await response.json();

		if (!response.ok) {
			throw new Error(body.message ?? 'Could not reload charge configurations');
		}

		chargeConfigurations = body.configurations ?? [];
		lastAppliedDraftKey = '';
	}

	async function persistChargeConfigurations() {
		if (!methodConfigId || !chargesReady || !payinVan?.virtualAccountNumber || chargesSaving) {
			return;
		}

		const validation = validateSlabs(chargesSlabs);
		chargesValidation = validation;
		if (!validation.valid) return;

		const orgId = organization.id;
		const vaNumber = payinVan.virtualAccountNumber;
		const pipelineCode = pathSelection.pipeline.trim();
		if (!pipelineCode) {
			toast.error('Could not save charges', { description: 'Select a pipeline before saving.' });
			return;
		}

		const gstPercentage = resolveDefaultGstPercentage(chargesBaselineConfigs);
		const writeContext = {
			methodConfigId,
			pipelineCode,
			vaNumber,
			gstPercentage
		};

		chargesSaving = true;

		try {
			if (chargesBaselineConfigs.length === 0) {
				const response = await fetch(
					resolve('/api/management/organizations/[orgId]/charge-configurations', { orgId }),
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							chargeConfig: mapSlabsToCreateItems(chargesSlabs, writeContext, gstPercentage)
						})
					}
				);
				const body: { message?: string } = await response.json();
				if (!response.ok) {
					throw new Error(body.message ?? 'Could not create charge configurations');
				}
			} else {
				const currentPersistedIds = new Set(
					chargesSlabs
						.filter((slab) => isPersistedChargeConfigurationId(slab.id))
						.map((slab) => slab.id)
				);

				for (const baseline of chargesBaselineConfigs) {
					if (currentPersistedIds.has(baseline.id)) continue;
					const response = await fetch(
						resolve('/api/management/organizations/[orgId]/charge-configurations/[id]', {
							orgId,
							id: baseline.id
						}),
						{ method: 'DELETE' }
					);
					const body: { message?: string } = await response.json();
					if (!response.ok) {
						throw new Error(body.message ?? 'Could not delete charge configuration');
					}
				}

				for (const slab of chargesSlabs.filter((row) => isPersistedChargeConfigurationId(row.id))) {
					const baseline = chargesBaselineConfigs.find((config) => config.id === slab.id);
					if (!baseline || !slabChangedFromBaseline(slab, chargesSlabs, baseline)) continue;

					const response = await fetch(
						resolve('/api/management/organizations/[orgId]/charge-configurations/[id]', {
							orgId,
							id: slab.id
						}),
						{
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(mapSlabToUpdatePayload(slab, chargesSlabs, gstPercentage))
						}
					);
					const body: { message?: string } = await response.json();
					if (!response.ok) {
						throw new Error(body.message ?? 'Could not update charge configuration');
					}
				}

				const newSlabs = chargesSlabs.filter((row) => !isPersistedChargeConfigurationId(row.id));
				if (newSlabs.length > 0) {
					const response = await fetch(
						resolve('/api/management/organizations/[orgId]/charge-configurations', { orgId }),
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								chargeConfig: mapSlabsToCreateItems(newSlabs, writeContext, gstPercentage)
							})
						}
					);
					const body: { message?: string } = await response.json();
					if (!response.ok) {
						throw new Error(body.message ?? 'Could not create charge configurations');
					}
				}
			}

			await reloadChargeConfigurations();
			chargesConfigured = true;
			chargesLoadedFromServer = true;
			chargesSaved = true;
			toast.success('Charges saved', {
				description: 'Charge configurations saved successfully.'
			});
		} catch (error) {
			toast.error('Could not save charges', {
				description: error instanceof Error ? error.message : 'Could not save charge configurations'
			});
		} finally {
			chargesSaving = false;
			setTimeout(() => {
				chargesSaved = false;
			}, 3000);
		}
	}

	function saveCommission() {
		void persistCommissionConfigurations();
	}

	async function reloadCommissionConfigurations() {
		const vaNumber = payinVan?.virtualAccountNumber?.trim();
		if (!vaNumber) return;

		const response = await fetch(
			`${resolve('/api/management/organizations/[orgId]/commission-configurations', {
				orgId: organization.id
			})}?vaNumber=${encodeURIComponent(vaNumber)}`
		);
		const body: { configurations?: ChargeConfigurationItem[]; message?: string } =
			await response.json();

		if (!response.ok) {
			throw new Error(body.message ?? 'Could not reload commission configurations');
		}

		commissionConfigurations = body.configurations ?? [];
		lastAppliedDraftKey = '';
	}

	async function persistCommissionConfigurations() {
		if (
			!methodConfigId ||
			!pathReady ||
			!vanReady ||
			!payinVan?.virtualAccountNumber ||
			commissionSaving
		) {
			return;
		}

		const validation = validateSlabs(commissionSlabs);
		commissionValidation = validation;
		if (!validation.valid) return;

		const orgId = organization.id;
		const vaNumber = payinVan.virtualAccountNumber;
		const pipelineCode = pathSelection.pipeline.trim();
		if (!pipelineCode) {
			toast.error('Could not save commission', { description: 'Select a pipeline before saving.' });
			return;
		}

		const gstPercentage = resolveDefaultGstPercentage(commissionBaselineConfigs);
		const writeContext = {
			methodConfigId,
			pipelineCode,
			vaNumber,
			gstPercentage
		};

		commissionSaving = true;

		try {
			if (commissionBaselineConfigs.length === 0) {
				const response = await fetch(
					resolve('/api/management/organizations/[orgId]/commission-configurations', { orgId }),
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							commissionConfig: mapSlabsToCommissionCreateItems(
								commissionSlabs,
								writeContext,
								gstPercentage
							)
						})
					}
				);
				const body: { message?: string } = await response.json();
				if (!response.ok) {
					throw new Error(body.message ?? 'Could not create commission configurations');
				}
			} else {
				const currentPersistedIds = new Set(
					commissionSlabs
						.filter((slab) => isPersistedChargeConfigurationId(slab.id))
						.map((slab) => slab.id)
				);

				for (const baseline of commissionBaselineConfigs) {
					if (currentPersistedIds.has(baseline.id)) continue;
					const response = await fetch(
						resolve('/api/management/organizations/[orgId]/commission-configurations/[id]', {
							orgId,
							id: baseline.id
						}),
						{ method: 'DELETE' }
					);
					const body: { message?: string } = await response.json();
					if (!response.ok) {
						throw new Error(body.message ?? 'Could not delete commission configuration');
					}
				}

				const newSlabs = commissionSlabs.filter((row) => !isPersistedChargeConfigurationId(row.id));
				if (newSlabs.length > 0) {
					const response = await fetch(
						resolve('/api/management/organizations/[orgId]/commission-configurations', {
							orgId
						}),
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								commissionConfig: mapSlabsToCommissionCreateItems(
									newSlabs,
									writeContext,
									gstPercentage
								)
							})
						}
					);
					const body: { message?: string } = await response.json();
					if (!response.ok) {
						throw new Error(body.message ?? 'Could not create commission configurations');
					}
				}

				const changedPersistedSlabs = commissionSlabs.filter((slab) => {
					if (!isPersistedChargeConfigurationId(slab.id)) return false;
					const baseline = commissionBaselineConfigs.find((config) => config.id === slab.id);
					return baseline && slabChangedFromBaseline(slab, commissionSlabs, baseline);
				});

				if (changedPersistedSlabs.length > 0) {
					throw new Error(
						'Updating existing commission slabs is not supported yet. Only new slabs can be added.'
					);
				}
			}

			await reloadCommissionConfigurations();
			commissionConfigured = true;
			commissionLoadedFromServer = true;
			commissionSaved = true;
			toast.success('Commission saved', {
				description: 'Commission configurations saved successfully.'
			});
		} catch (error) {
			toast.error('Could not save commission', {
				description:
					error instanceof Error ? error.message : 'Could not save commission configurations'
			});
		} finally {
			commissionSaving = false;
			setTimeout(() => {
				commissionSaved = false;
			}, 3000);
		}
	}

	function completeFeeConfiguration() {
		if (!feeConfigComplete) {
			toast.error('Complete fee configuration', {
				description: 'Save charges and commission before continuing.'
			});
			return;
		}

		toast.success('Fee configuration saved', {
			description: 'Organization setup is complete.'
		});
		goto(feesPath(organization.id) as ResolvedPathname);
	}

	async function loadMethodConfigurations(pipelineCode: string) {
		const trimmed = pipelineCode.trim();
		if (!trimmed) {
			methodConfigurations = [];
			configurationsError = null;
			return;
		}

		configurationsLoading = true;
		configurationsError = null;

		try {
			const response = await fetch(
				resolve('/api/management/payment-method-configurations/[pipelineCode]', {
					pipelineCode: trimmed
				})
			);
			const body: { configurations?: PaymentMethodConfigItem[]; message?: string } =
				await response.json();

			if (!response.ok) {
				throw new Error(body.message ?? 'Could not load payment method configurations');
			}

			methodConfigurations = body.configurations ?? [];
		} catch (error) {
			methodConfigurations = [];
			configurationsError =
				error instanceof Error ? error.message : 'Could not load payment method configurations';
		} finally {
			configurationsLoading = false;
		}
	}

	async function onPipelineSelect(pipelineCode: string) {
		await loadMethodConfigurations(pipelineCode);
	}

	$effect(() => {
		if (!lastOrgId) {
			lastOrgId = organization.id;
			return;
		}
		if (organization.id !== lastOrgId) {
			pathSelection = emptyPathSelection();
			methodConfigurations = data.methodConfigurations ?? [];
			chargeConfigurations = data.chargeConfigurations ?? [];
			commissionConfigurations = data.commissionConfigurations ?? [];
			configurationsError = data.methodConfigurationsError ?? null;
			chargesLoadedFromServer = false;
			commissionLoadedFromServer = false;
			chargesBaselineConfigs = [];
			commissionBaselineConfigs = [];
			chargesBaselineSlabs = [];
			commissionBaselineSlabs = [];
			chargesSlabs = createDefaultSlabRows();
			commissionSlabs = createCommissionDefaultSlabs();
			pipelineDefaultApplied = false;
			configurationsErrorNotified = false;
			chargeConfigurationsErrorNotified = false;
			commissionConfigurationsErrorNotified = false;
			lastAppliedDraftKey = '';
			lastOrgId = organization.id;
		}
	});

	$effect(() => {
		const key = draftLoadKey(methodConfigId);
		if (key === lastAppliedDraftKey) return;
		lastAppliedDraftKey = key;
		loadDraftForPath(methodConfigId);
	});

	$effect(() => {
		if (!data.vanCreated || vanCreatedNotified || !payinVan?.virtualAccountNumber) {
			return;
		}
		vanCreatedNotified = true;
		toast.success('Collection account created', {
			description: `Virtual account ${payinVan.virtualAccountNumber} is ready.`
		});
	});

	$effect(() => {
		if (!data.pipelinesError || pipelinesErrorNotified) {
			return;
		}
		pipelinesErrorNotified = true;
		toast.error('Could not load pipelines', {
			description: data.pipelinesError
		});
	});

	$effect(() => {
		if (!data.methodConfigurationsError || configurationsErrorNotified) {
			return;
		}
		configurationsErrorNotified = true;
		toast.error('Could not load payment path options', {
			description: data.methodConfigurationsError
		});
	});

	$effect(() => {
		if (!data.chargeConfigurationsError || chargeConfigurationsErrorNotified) {
			return;
		}
		chargeConfigurationsErrorNotified = true;
		toast.error('Could not load charge configurations', {
			description: data.chargeConfigurationsError
		});
	});

	$effect(() => {
		if (!data.commissionConfigurationsError || commissionConfigurationsErrorNotified) {
			return;
		}
		commissionConfigurationsErrorNotified = true;
		toast.error('Could not load commission configurations', {
			description: data.commissionConfigurationsError
		});
	});

	$effect(() => {
		if (pipelineDefaultApplied || pathSelection.pipeline || !data.defaultPipelineCode) {
			return;
		}

		pathSelection = {
			...pathSelection,
			pipeline: data.defaultPipelineCode
		};
		methodConfigurations = data.methodConfigurations ?? [];
		chargeConfigurations = data.chargeConfigurations ?? [];
		commissionConfigurations = data.commissionConfigurations ?? [];
		configurationsError = data.methodConfigurationsError ?? null;
		pipelineDefaultApplied = true;
	});
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
	{#if vanError}
		<div
			class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			role="alert"
		>
			<AlertCircle class="size-3.5 shrink-0" aria-hidden="true" />
			<p>Could not set up the collection account: {vanError}</p>
		</div>
	{/if}

	<header>
		<h1 class="text-lg font-semibold text-foreground">Fee Configuration</h1>
	</header>

	<div class="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
		<div class="space-y-4">
			<PaymentPathCard
				bind:selection={pathSelection}
				{pipelineOptions}
				{methodConfigurations}
				{configurationsLoading}
				{configurationsError}
				{onPipelineSelect}
			/>

			<FeeSectionCard
				title="Charges"
				subtitle="Gateway / aggregator fees — pipeline-level, applies to all organizations."
				disabled={!chargesReady}
				loadedFromServer={chargesLoadedFromServer && !chargesSaved}
				placeholder={vanReady
					? 'Select a payment path to load charge configurations.'
					: 'Collection account must be ready before loading charges.'}
				bind:slabs={chargesSlabs}
				rowErrors={chargesValidation.rowErrors}
				validationErrors={chargesValidation.errors}
				saveLabel={chargesSaving ? 'Saving charges…' : 'Save charges'}
				saved={chargesSaved}
				saving={chargesSaving}
				saveDisabled={!chargesSaveEnabled}
				savedLabel="Saved to server."
				onSave={saveCharges}
			/>

			<FeeSectionCard
				title="Commission"
				subtitle="Pipeline fee elixir pay earns — negotiated per organization."
				disabled={!pathReady || !vanReady}
				loadedFromServer={commissionLoadedFromServer && !commissionSaved}
				placeholder={vanReady
					? 'Select a payment path to load commission configurations.'
					: 'Collection account must be ready before configuring commission.'}
				bind:slabs={commissionSlabs}
				rowErrors={commissionValidation.rowErrors}
				validationErrors={commissionValidation.errors}
				saveLabel={commissionSaving ? 'Saving commission…' : 'Save commission'}
				saved={commissionSaved}
				saving={commissionSaving}
				saveDisabled={!commissionSaveEnabled}
				savedLabel="Saved to server."
				onSave={saveCommission}
			/>

			<div class="flex flex-wrap items-center justify-between gap-2">
				<Button variant="ghost" href={cancelHref}>Cancel</Button>
				<Button disabled={!feeConfigComplete} onclick={completeFeeConfiguration}>
					Complete & view fees
				</Button>
			</div>
		</div>

		<aside class="space-y-4 lg:sticky lg:top-6">
			<LivePreviewPanel
				selection={pathSelection}
				{pathBreadcrumb}
				bind:testGrossAmount
				{chargesSlabs}
				{commissionSlabs}
			/>
		</aside>
	</div>
</div>
