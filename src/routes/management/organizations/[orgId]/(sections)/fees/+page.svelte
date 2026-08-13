<script lang="ts">
	import { untrack } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { Button, toast } from '$lib/components/reusable';
	import { AlertCircle, CircleCheck } from '$lib/assets/icons';
	import {
		filterChargeConfigurationsForPath,
		mapChargeConfigurationsToSlabs,
		toChargeBaseAmountDisplay,
		type ChargeConfigurationItem
	} from '$lib/charge-configuration';
	import type { FeeSlabRow } from '$lib/fee-config/types';
	import {
		resolveMethodConfigIdFromConfigs,
		type PaymentMethodConfigItem,
		type PaymentPathApiSelection
	} from '$lib/payment-method-configuration';
	import FeeSectionCard from '../../components/fee-config/FeeSectionCard.svelte';
	import PaymentPathCard from '../../components/fee-config/PaymentPathCard.svelte';

	let { data } = $props();

	const organization = $derived(data.organization);
	const payinVan = $derived(data.payinVan);
	const vanError = $derived(data.vanError);
	const vanReady = $derived(Boolean(payinVan?.virtualAccountNumber));
	const pipelineOptions = $derived(data.pipelineOptions ?? []);
	const canEditFees = $derived(organization.status === 'ACTIVE');

	const editFeesHref = $derived(
		`/management/organizations/${organization.id}/activate/merchant` as ResolvedPathname
	);

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
	let chargesSlabs = $state<FeeSlabRow[]>([]);
	let commissionSlabs = $state<FeeSlabRow[]>([]);
	let chargesConfigured = $state(false);
	let commissionConfigured = $state(false);
	let pipelineDefaultApplied = $state(false);
	let chargeConfigurationsErrorNotified = $state(false);
	let commissionConfigurationsErrorNotified = $state(false);
	let pipelinesErrorNotified = $state(false);
	let configurationsErrorNotified = $state(false);

	let lastAppliedPathKey = '';

	const methodConfigId = $derived(
		resolveMethodConfigIdFromConfigs(methodConfigurations, pathSelection)
	);
	const pathReady = $derived(methodConfigId !== null);
	const feesReady = $derived(vanReady && pathReady);

	function cloneSlabs(slabs: FeeSlabRow[]): FeeSlabRow[] {
		return slabs.map((slab) => ({ ...slab }));
	}

	function mapConfigsToDisplaySlabs(
		configurations: ChargeConfigurationItem[],
		configId: string
	): FeeSlabRow[] {
		const fromApi = mapChargeConfigurationsToSlabs(
			configurations,
			configId,
			payinVan?.virtualAccountNumber
		);
		if (!fromApi.hasConfigurations) return [];

		const baseline = filterChargeConfigurationsForPath(
			configurations,
			configId,
			payinVan?.virtualAccountNumber
		);

		return cloneSlabs(fromApi.slabs).map((slab) => {
			const rawBaseAmount =
				baseline.find((config) => config.id === slab.id)?.baseAmount ?? slab.baseAmount;
			return {
				...slab,
				baseAmount: toChargeBaseAmountDisplay(rawBaseAmount)
			};
		});
	}

	function applyFeesForMethodConfig(configId: string | null) {
		if (!configId || !vanReady) {
			chargesSlabs = [];
			commissionSlabs = [];
			chargesConfigured = false;
			commissionConfigured = false;
			return;
		}

		const nextCharges = mapConfigsToDisplaySlabs(chargeConfigurations, configId);
		const nextCommission = mapConfigsToDisplaySlabs(commissionConfigurations, configId);
		chargesSlabs = nextCharges;
		commissionSlabs = nextCommission;
		chargesConfigured = nextCharges.length > 0;
		commissionConfigured = nextCommission.length > 0;
	}

	function pathLoadKey(configId: string | null): string {
		const vaNumber = payinVan?.virtualAccountNumber ?? '';
		const chargesKey = chargeConfigurations.map((config) => config.id).join('|');
		const commissionKey = commissionConfigurations.map((config) => config.id).join('|');
		return `${configId ?? ''}|${vaNumber}|${chargesKey}|${commissionKey}`;
	}

	async function loadMethodConfigurations(pipelineCode: string) {
		const trimmed = pipelineCode.trim();
		if (!trimmed) {
			methodConfigurations = [];
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
		const key = pathLoadKey(methodConfigId);
		if (key === lastAppliedPathKey) return;
		lastAppliedPathKey = key;
		applyFeesForMethodConfig(methodConfigId);
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

	$effect(() => {
		if (!data.pipelinesError || pipelinesErrorNotified) return;
		pipelinesErrorNotified = true;
		toast.error('Could not load pipelines', { description: data.pipelinesError });
	});

	$effect(() => {
		if (!data.methodConfigurationsError || configurationsErrorNotified) return;
		configurationsErrorNotified = true;
		toast.error('Could not load payment path options', {
			description: data.methodConfigurationsError
		});
	});

	$effect(() => {
		if (!data.chargeConfigurationsError || chargeConfigurationsErrorNotified) return;
		chargeConfigurationsErrorNotified = true;
		toast.error('Could not load charge configurations', {
			description: data.chargeConfigurationsError
		});
	});

	$effect(() => {
		if (!data.commissionConfigurationsError || commissionConfigurationsErrorNotified) return;
		commissionConfigurationsErrorNotified = true;
		toast.error('Could not load commission configurations', {
			description: data.commissionConfigurationsError
		});
	});
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-base font-semibold text-foreground">Fee configuration</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Review charge and commission slabs saved for this organization.
			</p>
		</div>
		{#if canEditFees}
			<Button variant="outline" href={editFeesHref}>Edit fees</Button>
		{/if}
	</div>

	{#if vanError}
		<div
			class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			role="alert"
		>
			<AlertCircle class="size-3.5 shrink-0" aria-hidden="true" />
			<p>Could not load the collection account: {vanError}</p>
		</div>
	{:else if !vanReady}
		<div
			class="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground"
			role="status"
		>
			Collection account is not ready. Fee configuration will appear once the virtual account is
			available.
		</div>
	{:else if payinVan}
		<div
			class="flex items-start gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success"
			role="status"
		>
			<CircleCheck class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
			<div>
				<p class="font-medium">Collection account</p>
				<p class="text-success/90">
					Virtual account <span class="font-mono">{payinVan.virtualAccountNumber}</span>
					{#if payinVan.pipelineCode}
						· {payinVan.pipelineCode}
					{/if}
				</p>
			</div>
		</div>

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
				readOnly={true}
				disabled={!feesReady}
				loadedFromServer={chargesConfigured}
				placeholder={vanReady
					? 'Select a payment path to view charge configurations.'
					: 'Collection account must be ready before viewing charges.'}
				bind:slabs={chargesSlabs}
				saveLabel="Save charges"
			/>

			<FeeSectionCard
				title="Commission"
				subtitle="Pipeline fee elixir pay earns — negotiated per organization."
				readOnly={true}
				disabled={!feesReady}
				loadedFromServer={commissionConfigured}
				placeholder={vanReady
					? 'Select a payment path to view commission configurations.'
					: 'Collection account must be ready before viewing commission.'}
				bind:slabs={commissionSlabs}
				saveLabel="Save commission"
			/>

			{#if feesReady && !chargesConfigured && !commissionConfigured}
				<div
					class="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground"
					role="status"
				>
					No fee configuration found for this payment path.
					{#if canEditFees}
						<a
							class="text-primary underline-offset-4 hover:underline"
							href={resolve('/management/organizations/[orgId]/activate/merchant', {
								orgId: organization.id
							})}
						>
							Configure fees
						</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
