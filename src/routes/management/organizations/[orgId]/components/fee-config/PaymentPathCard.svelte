<script lang="ts">
	import { Dropdown } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import {
		findPaymentMethodConfiguration,
		getInstrumentOptions,
		getPaymentRailOptions,
		getServiceTypeOptions,
		resolveMethodConfigIdFromConfigs
	} from '$lib/payment-method-configuration';
	import type {
		PaymentMethodConfigItem,
		PaymentPathApiSelection
	} from '$lib/payment-method-configuration';
	import FeeConfigCard from './FeeConfigCard.svelte';

	let {
		selection = $bindable(),
		pipelineOptions = [],
		methodConfigurations = [],
		configurationsLoading = false,
		configurationsError = null,
		onPipelineSelect
	}: {
		selection: PaymentPathApiSelection;
		pipelineOptions?: DropdownOption[];
		methodConfigurations?: PaymentMethodConfigItem[];
		configurationsLoading?: boolean;
		configurationsError?: string | null;
		onPipelineSelect?: (pipelineCode: string) => void | Promise<void>;
	} = $props();

	const methodConfigId = $derived(
		resolveMethodConfigIdFromConfigs(methodConfigurations, selection)
	);
	const matchedConfiguration = $derived(
		findPaymentMethodConfiguration(methodConfigurations, selection)
	);

	const methodOptions = $derived(getServiceTypeOptions(methodConfigurations));
	const instrumentOptions = $derived(getInstrumentOptions(methodConfigurations, selection.method));
	const railsOptions = $derived(
		getPaymentRailOptions(methodConfigurations, selection.method, selection.instrument)
	);

	const pathResolved = $derived(methodConfigId !== null);

	function onPipelineChange(value: string) {
		selection = {
			pipeline: value,
			method: '',
			instrument: '',
			paymentRails: ''
		};
		void onPipelineSelect?.(value);
	}

	function onMethodChange(value: string) {
		selection = {
			...selection,
			method: value,
			instrument: '',
			paymentRails: ''
		};
	}

	function onInstrumentChange(value: string) {
		selection = {
			...selection,
			instrument: value,
			paymentRails: ''
		};
	}

	function onRailsChange(value: string) {
		selection = {
			...selection,
			paymentRails: value
		};
	}
</script>

{#snippet body()}
	<div class="grid gap-4 sm:grid-cols-2">
		<label class="space-y-2">
			<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Pipeline
			</span>
			<Dropdown
				bind:value={selection.pipeline}
				options={pipelineOptions}
				placeholder="Select pipeline"
				class="w-full"
				disabled={pipelineOptions.length === 0 || configurationsLoading}
				onValueChange={onPipelineChange}
			/>
		</label>
		<label class="space-y-2">
			<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Service type
			</span>
			<Dropdown
				bind:value={selection.method}
				options={methodOptions}
				placeholder="Select service type"
				class="w-full"
				disabled={!selection.pipeline || configurationsLoading || methodOptions.length === 0}
				onValueChange={onMethodChange}
			/>
		</label>
		<label class="space-y-2">
			<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Instrument
			</span>
			<Dropdown
				bind:value={selection.instrument}
				options={instrumentOptions}
				placeholder="Select instrument"
				class="w-full"
				disabled={!selection.method || configurationsLoading || instrumentOptions.length === 0}
				onValueChange={onInstrumentChange}
			/>
		</label>
		<label class="space-y-2">
			<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Payment rail
			</span>
			<Dropdown
				bind:value={selection.paymentRails}
				options={railsOptions}
				placeholder="Select payment rail"
				class="w-full"
				disabled={!selection.instrument || configurationsLoading || railsOptions.length === 0}
				onValueChange={onRailsChange}
			/>
		</label>
	</div>

	{#if configurationsLoading}
		<p class="mt-3 text-sm text-muted-foreground" role="status">Loading payment path options…</p>
	{:else if configurationsError}
		<p class="mt-3 text-sm text-destructive" role="alert">{configurationsError}</p>
	{:else if selection.pipeline && methodConfigurations.length === 0}
		<p class="mt-3 text-sm text-muted-foreground" role="status">
			No payment method configurations found for this pipeline.
		</p>
	{:else if selection.paymentRails && !pathResolved}
		<p class="mt-3 text-sm text-destructive" role="alert">
			No matching method configuration exists for this combination.
		</p>
	{:else if matchedConfiguration?.description}
		<p class="mt-3 text-sm text-muted-foreground">{matchedConfiguration.description}</p>
	{/if}
{/snippet}

<FeeConfigCard title="Payment path" subtitle="Shared context for all fee sections.">
	{@render body()}
</FeeConfigCard>
