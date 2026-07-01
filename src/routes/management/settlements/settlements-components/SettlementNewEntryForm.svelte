<script lang="ts">
	import type { SettlementStatus } from '$lib/data/partnerSettlementsDummyData';
	import { calcEntryTaxes } from '$lib/data/partnerSettlementsDummyData';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import SettlementDatePicker from './SettlementDatePicker.svelte';
	import SettlementStatusSelect from './SettlementStatusSelect.svelte';

	export interface NewEntryFormValues {
		settlementDate: string;
		amountSettled: string;
		tds: string;
		gst: string;
		accountNumber: string;
		ifsc: string;
		utr: string;
		recordStatus: SettlementStatus;
	}

	let {
		values = $bindable<NewEntryFormValues>({
			settlementDate: '',
			amountSettled: '',
			tds: '',
			gst: '',
			accountNumber: '',
			ifsc: '',
			utr: '',
			recordStatus: 'unsettled'
		})
	}: {
		values?: NewEntryFormValues;
	} = $props();

	function setField<K extends keyof NewEntryFormValues>(key: K, next: NewEntryFormValues[K]) {
		values[key] = next;
	}

	function handleAmountBlur() {
		const amount = parseFloat(values.amountSettled);
		if (Number.isNaN(amount) || amount <= 0) return;

		const taxes = calcEntryTaxes(amount);
		if (!values.tds.trim()) setField('tds', taxes.tds.toFixed(2));
		if (!values.gst.trim()) setField('gst', taxes.gst.toFixed(2));
	}
</script>

<div class="space-y-4">
	<SettlementDatePicker
		label="Settlement date"
		required
		value={values.settlementDate}
		onValueChange={(next) => setField('settlementDate', next)}
		placeholder="Pick date"
	/>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="space-y-2">
			<Label for="amount-settled">
				Amount settled (INR) <span class="text-destructive">*</span>
			</Label>
			<Input
				id="amount-settled"
				value={values.amountSettled}
				oninput={(event) => setField('amountSettled', event.currentTarget.value)}
				onblur={handleAmountBlur}
				type="number"
				step="0.01"
				min="0"
				placeholder="0.00"
				inputmode="decimal"
			/>
		</div>

		<div class="space-y-2">
			<Label for="tds">
				TDS 5% <span class="text-destructive">*</span>
			</Label>
			<Input
				id="tds"
				value={values.tds}
				oninput={(event) => setField('tds', event.currentTarget.value)}
				type="number"
				step="0.01"
				min="0"
				placeholder="0.00"
				inputmode="decimal"
			/>
		</div>

		<div class="space-y-2">
			<Label for="gst">
				GST 18% <span class="text-destructive">*</span>
			</Label>
			<Input
				id="gst"
				value={values.gst}
				oninput={(event) => setField('gst', event.currentTarget.value)}
				type="number"
				step="0.01"
				min="0"
				placeholder="0.00"
				inputmode="decimal"
			/>
		</div>

		<div class="space-y-2">
			<Label for="account-number">
				Account number <span class="text-destructive">*</span>
			</Label>
			<Input
				id="account-number"
				value={values.accountNumber}
				oninput={(event) => setField('accountNumber', event.currentTarget.value)}
				placeholder="Account no."
				inputmode="numeric"
				autocomplete="off"
			/>
		</div>

		<div class="space-y-2">
			<Label for="ifsc">
				IFSC <span class="text-destructive">*</span>
			</Label>
			<Input
				id="ifsc"
				value={values.ifsc}
				oninput={(event) => setField('ifsc', event.currentTarget.value)}
				placeholder="IFSC"
				autocomplete="off"
			/>
		</div>

		<div class="space-y-2">
			<Label for="utr">
				UTR <span class="text-destructive">*</span>
			</Label>
			<Input
				id="utr"
				value={values.utr}
				oninput={(event) => setField('utr', event.currentTarget.value)}
				placeholder="UTR…"
				autocomplete="off"
			/>
		</div>
	</div>

	<div class="space-y-2">
		<Label>
			Update record status <span class="text-destructive">*</span>
		</Label>
		<SettlementStatusSelect
			value={values.recordStatus}
			onValueChange={(next) => setField('recordStatus', next)}
			placeholder="Select status"
		/>
	</div>
</div>
