<script lang="ts">
	import { Dropdown, Input } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import {
		FIXED_PIPELINE,
		getInstrumentsForMethod,
		getRailsForMethodInstrument,
		isValidPaymentPathCombo,
		PAYMENT_METHODS,
		railsDisplayLabel,
		resolveMethodConfigId
	} from '$lib/fee-config';
	import type { PaymentPathSelection } from '$lib/fee-config/types';
	import FeeConfigCard from './FeeConfigCard.svelte';

	let {
		selection = $bindable()
	}: {
		selection: PaymentPathSelection;
	} = $props();

	const methodConfigId = $derived(resolveMethodConfigId(selection));

	const methodOptions: DropdownOption[] = PAYMENT_METHODS.map((method) => ({
		value: method,
		label: method
	}));

	const instrumentOptions = $derived(
		getInstrumentsForMethod(selection.method).map((instrument) => ({
			value: instrument,
			label: instrument
		}))
	);

	const railsOptions = $derived(
		getRailsForMethodInstrument(selection.method, selection.instrument).map((rails) => ({
			value: rails,
			label: railsDisplayLabel(rails)
		}))
	);

	const pathResolved = $derived(
		isValidPaymentPathCombo(selection.method, selection.instrument, selection.paymentRails) &&
			methodConfigId !== null
	);

	function onMethodChange(value: string) {
		selection = {
			...selection,
			method: value as PaymentPathSelection['method'],
			instrument: '',
			paymentRails: ''
		};
	}

	function onInstrumentChange(value: string) {
		selection = {
			...selection,
			instrument: value as PaymentPathSelection['instrument'],
			paymentRails: ''
		};
	}

	function onRailsChange(value: string) {
		selection = {
			...selection,
			paymentRails: value as PaymentPathSelection['paymentRails']
		};
	}
</script>

{#snippet body()}
	<div class="grid gap-4 sm:grid-cols-2">
		<label class="space-y-2">
			<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Pipeline
			</span>
			<Input value={FIXED_PIPELINE} disabled aria-label="Pipeline" />
		</label>
		<label class="space-y-2">
			<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Method</span>
			<Dropdown
				bind:value={selection.method}
				options={methodOptions}
				placeholder="Select method"
				class="w-full"
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
				disabled={!selection.method}
				onValueChange={onInstrumentChange}
			/>
		</label>
		<label class="space-y-2">
			<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Payment rails
			</span>
			<Dropdown
				bind:value={selection.paymentRails}
				options={railsOptions}
				placeholder="Select rails"
				class="w-full"
				disabled={!selection.instrument}
				onValueChange={onRailsChange}
			/>
		</label>
	</div>

	{#if selection.paymentRails && !pathResolved}
		<p class="mt-3 text-sm text-destructive" role="alert">
			No matching method configuration exists for this combination.
		</p>
	{/if}
{/snippet}

<FeeConfigCard title="Payment path" subtitle="Shared context for all fee sections.">
	{@render body()}
</FeeConfigCard>
