<script lang="ts">
	import { getSettlementsStore } from '../settlements.svelte';
	import {
		addEntryToRecord,
		calcEntryTaxes,
		getRecordById,
		formatInr,
		formatRecordDate,
		type SettlementStatus
	} from '$lib/data/partnerSettlementsDummyData';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/reusable';
	import Drawer from '$lib/components/reusable/drawer/drawer.svelte';
	import SettlementStatusBadge from './SettlementStatusBadge.svelte';
	import SettlementNewEntryForm, { type NewEntryFormValues } from './SettlementNewEntryForm.svelte';
	import { X } from '$lib/assets/icons';

	const store = getSettlementsStore();

	const record = $derived.by(() => {
		void store.entriesRevision;
		return store.drawerRecordId ? (getRecordById(store.drawerRecordId) ?? null) : null;
	});

	const emptyForm = (status: SettlementStatus = 'unsettled'): NewEntryFormValues => ({
		settlementDate: '',
		amountSettled: '',
		tds: '',
		gst: '',
		accountNumber: '',
		ifsc: '',
		utr: '',
		recordStatus: status
	});

	let formValues = $state<NewEntryFormValues>(emptyForm());
	let wasDrawerOpen = $state(false);
	let formError = $state('');

	const isAddMode = $derived(store.drawerMode === 'add');

	const drawerTitle = $derived.by(() => {
		switch (store.drawerMode) {
			case 'add':
				return 'New entry';
			case 'settle':
				return 'Settle record';
			case 'edit':
				return 'Edit settlement';
		}
	});

	const drawerDescription = $derived.by(() => {
		if (isAddMode) return 'Fill in the settlement details.';
		if (!record || !store.selectedMerchant) return '';
		return `${store.selectedMerchant.name} · ${formatRecordDate(record.date)}`;
	});

	function resetForm() {
		formValues = emptyForm(record?.status ?? 'unsettled');
		formError = '';
	}

	function handleClose() {
		store.closeDrawer();
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

	function handleSubmit() {
		if (store.drawerMode !== 'add' || !record) {
			handleClose();
			return;
		}

		const validationError = validateForm();
		if (validationError) {
			formError = validationError;
			return;
		}

		const amount = parseFloat(formValues.amountSettled);
		const taxes = calcEntryTaxes(amount);

		addEntryToRecord(
			record.id,
			{
				date: formValues.settlementDate,
				amount,
				tds: parseFloat(formValues.tds) || taxes.tds,
				gst: parseFloat(formValues.gst) || taxes.gst,
				accountNumber: formValues.accountNumber.trim(),
				ifsc: formValues.ifsc.trim(),
				utr: formValues.utr.trim()
			},
			{ statusOverride: formValues.recordStatus }
		);
		store.notifyEntriesChanged();
		handleClose();
	}

	$effect(() => {
		const isOpen = store.drawerOpen;

		if (!isOpen) {
			if (wasDrawerOpen) resetForm();
			wasDrawerOpen = false;
			return;
		}

		if (!wasDrawerOpen && store.drawerMode === 'add' && record) {
			formValues = emptyForm(record.status);
			formError = '';
		}

		wasDrawerOpen = true;
	});
</script>

<Drawer bind:open={store.drawerOpen} direction="right" scrollable={false}>
	{#if isAddMode}
		<div class="flex items-start justify-between gap-3 border-b border-border/40 px-4 pt-4 pb-3">
			<div class="space-y-1">
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="text-lg font-semibold">{drawerTitle}</h2>
					<Chip variant="default" class="bg-primary/15 text-primary">Add</Chip>
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
	{:else}
		<div class="border-b border-border/40 px-4 pt-4 pb-3">
			<h2 class="text-lg font-semibold">{drawerTitle}</h2>
			{#if drawerDescription}
				<p class="text-sm text-muted-foreground">{drawerDescription}</p>
			{/if}
		</div>
	{/if}

	{#if store.drawerMode === 'add' || record}
		<div class="space-y-5 overflow-y-auto px-4 py-4">
			{#if store.drawerMode === 'add' && record}
				<SettlementNewEntryForm bind:values={formValues} />
				{#if formError}
					<p class="text-sm text-destructive">{formError}</p>
				{/if}
			{:else if record}
				<div
					class="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
				>
					<div>
						<p class="text-xs text-muted-foreground">Commission earned</p>
						<p class="text-sm font-semibold">{formatInr(record.commissionEarned)}</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground">Entries</p>
						<p class="text-sm font-semibold">{record.entriesCount}</p>
					</div>
					<SettlementStatusBadge status={record.status} />
				</div>

				{#if store.drawerMode === 'settle'}
					<p class="text-sm text-muted-foreground">
						Confirm settlement for this record. All pending entries will be marked as settled.
					</p>
				{:else}
					<p class="text-sm text-muted-foreground">
						Update adjusted entries for this settlement cycle before re-processing.
					</p>
				{/if}
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex w-full gap-2 px-4 pb-4">
			<Button variant="outline" class="flex-1" onclick={handleClose}>Cancel</Button>
			<Button class="flex-1" onclick={handleSubmit}>
				{store.drawerMode === 'settle'
					? 'Confirm settle'
					: store.drawerMode === 'edit'
						? 'Save changes'
						: 'Save entry'}
			</Button>
		</div>
	{/snippet}
</Drawer>
