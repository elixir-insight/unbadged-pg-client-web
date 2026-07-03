<script lang="ts" module>
	export interface PartnerEntryFormValues {
		settlementDate: string;
		amountSettled: string;
		tds: string;
		gst: string;
		accountNumber: string;
		ifsc: string;
		utr: string;
	}
</script>

<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import PartnerSettlementDatePicker from './partner-settlement-date-picker.svelte';
	import { calcEntryTaxes } from './shared';

	let {
		values = $bindable<PartnerEntryFormValues>({
			settlementDate: '',
			amountSettled: '',
			tds: '',
			gst: '',
			accountNumber: '',
			ifsc: '',
			utr: ''
		})
	}: {
		values?: PartnerEntryFormValues;
	} = $props();

	function setField<K extends keyof PartnerEntryFormValues>(
		key: K,
		next: PartnerEntryFormValues[K]
	) {
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
	<PartnerSettlementDatePicker
		label="Settlement date"
		required
		bind:value={values.settlementDate}
		placeholder="Pick date"
	/>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="space-y-2">
			<label for="amount-settled" class="text-sm font-medium text-foreground">
				Amount settled (INR) <span class="text-destructive">*</span>
			</label>
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
			<label for="tds" class="text-sm font-medium text-foreground">
				TDS 5% <span class="text-destructive">*</span>
			</label>
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
			<label for="gst" class="text-sm font-medium text-foreground">
				GST 18% <span class="text-destructive">*</span>
			</label>
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
			<label for="account-number" class="text-sm font-medium text-foreground">
				Account number <span class="text-destructive">*</span>
			</label>
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
			<label for="ifsc" class="text-sm font-medium text-foreground">
				IFSC <span class="text-destructive">*</span>
			</label>
			<Input
				id="ifsc"
				value={values.ifsc}
				oninput={(event) => setField('ifsc', event.currentTarget.value.toUpperCase())}
				placeholder="IFSC code"
				autocomplete="off"
			/>
		</div>

		<div class="space-y-2 sm:col-span-2">
			<label for="utr" class="text-sm font-medium text-foreground">
				UTR <span class="text-destructive">*</span>
			</label>
			<Input
				id="utr"
				value={values.utr}
				oninput={(event) => setField('utr', event.currentTarget.value)}
				placeholder="UTR reference"
				autocomplete="off"
			/>
		</div>
	</div>
</div>
