<script lang="ts">
	import Drawer from '$lib/components/reusable/drawer/drawer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/reusable';
	import { X } from '$lib/assets/icons';
	import PartnerSettlementEntryForm, {
		type PartnerEntryFormValues
	} from './partner-settlement-entry-form.svelte';
	import type { PartnerSettlementEntry } from './types';
	import { addPartnerSettlementEntry, updatePartnerSettlementEntry } from './data';
	import { calcEntryTaxes } from './shared';

	let {
		open = $bindable(false),
		mode = 'add' as 'add' | 'edit',
		merchantId,
		seedEntry = null,
		onSaved
	}: {
		open?: boolean;
		mode?: 'add' | 'edit';
		merchantId: string;
		seedEntry?: PartnerSettlementEntry | null;
		onSaved?: () => void | Promise<void>;
	} = $props();

	const emptyForm = (): PartnerEntryFormValues => ({
		settlementDate: '',
		amountSettled: '',
		tds: '',
		gst: '',
		accountNumber: '',
		ifsc: '',
		utr: ''
	});

	let formValues = $state<PartnerEntryFormValues>(emptyForm());
	let formError = $state('');
	let submitting = $state(false);
	let wasOpen = $state(false);

	const isAddMode = $derived(mode === 'add');
	const drawerTitle = $derived(isAddMode ? 'New entry' : 'Edit entry');
	const drawerDescription = $derived(
		isAddMode ? 'Fill in the settlement details.' : 'Update this settlement entry.'
	);

	function resetForm() {
		formValues = emptyForm();
		formError = '';
	}

	function populateFromEntry(entry: PartnerSettlementEntry) {
		formValues = {
			settlementDate: entry.date,
			amountSettled: String(entry.amount),
			tds: String(entry.tds),
			gst: String(entry.gst),
			accountNumber: entry.accountNumber,
			ifsc: entry.ifsc,
			utr: entry.utr
		};
		formError = '';
	}

	function handleClose() {
		open = false;
		resetForm();
	}

	function validateForm(): string | null {
		if (!formValues.settlementDate.trim()) return 'Settlement date is required.';
		if (!formValues.amountSettled.trim() || parseFloat(formValues.amountSettled) <= 0) {
			return 'Enter a valid amount settled.';
		}
		if (!formValues.tds.trim()) return 'TDS is required.';
		if (!formValues.gst.trim()) return 'GST is required.';
		if (!formValues.accountNumber.trim()) return 'Account number is required.';
		if (!formValues.ifsc.trim()) return 'IFSC is required.';
		if (!formValues.utr.trim()) return 'UTR is required.';
		return null;
	}

	async function handleSubmit() {
		const validationError = validateForm();
		if (validationError) {
			formError = validationError;
			return;
		}

		submitting = true;
		formError = '';

		const amount = parseFloat(formValues.amountSettled);
		const taxes = calcEntryTaxes(amount);
		const payload = {
			date: formValues.settlementDate,
			amount,
			tds: parseFloat(formValues.tds) || taxes.tds,
			gst: parseFloat(formValues.gst) || taxes.gst,
			accountNumber: formValues.accountNumber.trim(),
			ifsc: formValues.ifsc.trim(),
			utr: formValues.utr.trim()
		};

		try {
			if (isAddMode) {
				await addPartnerSettlementEntry(merchantId, payload);
			} else if (seedEntry) {
				await updatePartnerSettlementEntry(merchantId, seedEntry.id, payload);
			}
			await onSaved?.();
			handleClose();
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Unable to save entry.';
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		if (!open) {
			if (wasOpen) resetForm();
			wasOpen = false;
			return;
		}

		if (!wasOpen) {
			if (mode === 'edit' && seedEntry) populateFromEntry(seedEntry);
			else resetForm();
		}

		wasOpen = true;
	});
</script>

{#snippet drawerBody()}
	<div class="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
		<div class="space-y-1">
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="text-lg font-semibold">{drawerTitle}</h2>
				<Chip variant="default" class="bg-primary/15 text-primary"
					>{isAddMode ? 'Add' : 'Edit'}</Chip
				>
			</div>
			<p class="text-sm text-muted-foreground">{drawerDescription}</p>
		</div>
		<button
			type="button"
			class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			aria-label="Close drawer"
			onclick={handleClose}
		>
			<X class="size-4" />
		</button>
	</div>

	<div class="space-y-4 pt-4">
		<PartnerSettlementEntryForm bind:values={formValues} />

		{#if formError}
			<p class="text-sm text-destructive">{formError}</p>
		{/if}
	</div>
{/snippet}

{#snippet drawerFooter()}
	<div class="flex w-full justify-end gap-2">
		<Button variant="outline" onclick={handleClose} disabled={submitting}>Cancel</Button>
		<Button onclick={handleSubmit} disabled={submitting}>
			{isAddMode ? 'Save entry' : 'Update entry'}
		</Button>
	</div>
{/snippet}

<Drawer bind:open direction="right" children={drawerBody} footer={drawerFooter} />
