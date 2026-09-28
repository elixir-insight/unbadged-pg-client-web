<script lang="ts">
	import { Pencil, Plus, User } from '$lib/assets/icons';
	import { Button, Input, Modal, PhoneInput } from '$lib/components/reusable';
	import { validateInvoiceCustomer, type InvoiceCustomerErrors } from '$lib/validation/invoice';

	let {
		customerName = $bindable(''),
		customerEmail = $bindable(''),
		customerPhone = $bindable(''),
		disabled = false,
		nameError = '',
		emailError = '',
		phoneError = ''
	}: {
		customerName?: string;
		customerEmail?: string;
		customerPhone?: string;
		disabled?: boolean;
		nameError?: string;
		emailError?: string;
		phoneError?: string;
	} = $props();

	let open = $state(false);
	let editing = $state(false);
	let draftName = $state('');
	let draftEmail = $state('');
	let draftPhone = $state('');
	let draftErrors = $state<InvoiceCustomerErrors>({});

	const hasCustomer = $derived(customerName.trim().length > 0);
	const summaryError = $derived(nameError || emailError || phoneError);
	const phoneLabel = $derived(formatBillingPhone(customerPhone));

	function formatBillingPhone(phone: string): string {
		const digits = phone.replace(/\D/g, '');
		if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
		if (!phone.trim()) return '';
		return `+91 ${phone.trim()}`;
	}

	function openAdd() {
		if (disabled) return;
		editing = false;
		draftName = '';
		draftEmail = '';
		draftPhone = '';
		draftErrors = {};
		open = true;
	}

	function openEdit() {
		if (disabled) return;
		editing = true;
		draftName = customerName;
		draftEmail = customerEmail;
		draftPhone = customerPhone;
		draftErrors = {};
		open = true;
	}

	function saveCustomer(event: Event) {
		event.preventDefault();
		const errors = validateInvoiceCustomer({
			customerName: draftName,
			customerEmail: draftEmail,
			customerPhone: draftPhone
		});
		draftErrors = errors;
		if (errors.customerName || errors.customerEmail || errors.customerPhone) return;

		customerName = draftName.trim();
		customerEmail = draftEmail.trim();
		customerPhone = draftPhone.trim();
		open = false;
	}
</script>

<div class="flex flex-col gap-1.5">
	{#if hasCustomer}
		<div class="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
			<div
				class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				aria-hidden="true"
			>
				<User class="size-5" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold text-foreground">{customerName}</p>
				<p class="truncate text-xs text-muted-foreground">
					{customerEmail}
					{#if phoneLabel}
						<span aria-hidden="true"> | </span>
						{phoneLabel}
					{/if}
				</p>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label="Edit billing details"
				{disabled}
				onclick={openEdit}
			>
				<Pencil />
			</Button>
		</div>
	{:else}
		<button
			type="button"
			class="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
			{disabled}
			onclick={openAdd}
		>
			<div
				class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				aria-hidden="true"
			>
				<Plus class="size-5" />
			</div>
			<div class="min-w-0">
				<p class="text-sm font-medium text-foreground">Add billing details</p>
				<p class="text-xs text-muted-foreground">Name, email, and mobile</p>
			</div>
		</button>
	{/if}

	{#if summaryError}
		<p class="text-xs text-destructive" role="alert">{summaryError}</p>
	{/if}
</div>

<Modal
	bind:open
	title={editing ? 'Edit billing details' : 'Add billing details'}
	description="Customer name, email, and mobile for this invoice."
>
	<form id="invoice-bill-to-form" class="flex flex-col gap-4 py-2" onsubmit={saveCustomer}>
		<div class="flex flex-col gap-1.5">
			<label for="invoice-bill-customer-name" class="text-sm font-medium text-foreground">
				Customer name <span class="text-destructive">*</span>
			</label>
			<Input id="invoice-bill-customer-name" placeholder="Customer name" bind:value={draftName} />
			{#if draftErrors.customerName}
				<p class="text-xs text-destructive">{draftErrors.customerName}</p>
			{/if}
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="invoice-bill-customer-email" class="text-sm font-medium text-foreground">
				Email <span class="text-destructive">*</span>
			</label>
			<Input
				id="invoice-bill-customer-email"
				type="email"
				placeholder="Email"
				bind:value={draftEmail}
			/>
			{#if draftErrors.customerEmail}
				<p class="text-xs text-destructive">{draftErrors.customerEmail}</p>
			{/if}
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="invoice-bill-customer-phone" class="text-sm font-medium text-foreground">
				Mobile <span class="text-destructive">*</span>
			</label>
			<PhoneInput
				id="invoice-bill-customer-phone"
				placeholder="Mobile"
				bind:value={draftPhone}
				invalid={Boolean(draftErrors.customerPhone)}
			/>
			{#if draftErrors.customerPhone}
				<p class="text-xs text-destructive">{draftErrors.customerPhone}</p>
			{/if}
		</div>
	</form>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit" form="invoice-bill-to-form">Save</Button>
		</div>
	{/snippet}
</Modal>
