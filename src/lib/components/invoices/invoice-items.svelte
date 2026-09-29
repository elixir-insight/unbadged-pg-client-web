<script lang="ts">
	import { CirclePlus, Package, Pencil, Trash2 } from '$lib/assets/icons';
	import { Button, Input, Modal } from '$lib/components/reusable';
	import {
		createEmptyInvoiceLineItem,
		lineItemQuantity,
		lineItemTotal,
		toInvoiceAmountString,
		validateInvoiceLineItem,
		type InvoiceFormLineItem,
		type InvoiceLineItemErrors
	} from '$lib/validation/invoice';

	let {
		items = $bindable<InvoiceFormLineItem[]>([]),
		disabled = false,
		error = ''
	}: {
		items?: InvoiceFormLineItem[];
		disabled?: boolean;
		error?: string;
	} = $props();

	let open = $state(false);
	let editingId = $state<string | null>(null);
	let draftName = $state('');
	let draftAmount = $state('');
	let draftQuantity = $state('1');
	let draftErrors = $state<InvoiceLineItemErrors>({});

	const isEditing = $derived(editingId !== null);

	function openAdd() {
		if (disabled) return;
		editingId = null;
		draftName = '';
		draftAmount = '';
		draftQuantity = '1';
		draftErrors = {};
		open = true;
	}

	function openEdit(item: InvoiceFormLineItem) {
		if (disabled) return;
		editingId = item.id;
		draftName = item.name;
		draftAmount = item.amount;
		draftQuantity = item.quantity || '1';
		draftErrors = {};
		open = true;
	}

	function saveItem(event: Event) {
		event.preventDefault();
		const errors = validateInvoiceLineItem({
			name: draftName,
			description: '',
			amount: draftAmount,
			quantity: draftQuantity,
			taxPercent: '0'
		});
		draftErrors = errors;
		if (errors.name || errors.amount || errors.quantity) return;

		const next: InvoiceFormLineItem = {
			id: editingId ?? createEmptyInvoiceLineItem().id,
			name: draftName.trim(),
			description: '',
			amount: toInvoiceAmountString(draftAmount),
			quantity: String(lineItemQuantity({ quantity: draftQuantity })),
			taxPercent: '0'
		};

		if (editingId) {
			items = items.map((item) => (item.id === editingId ? next : item));
		} else {
			items = [...items, next];
		}
		open = false;
	}

	function removeItem(id: string) {
		if (disabled) return;
		items = items.filter((item) => item.id !== id);
	}

	function displayAmountValue(value: string): string {
		const amount = Number(toInvoiceAmountString(value));
		if (!Number.isFinite(amount) || amount <= 0) return '—';
		return new Intl.NumberFormat('en-IN', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	function displayLineTotal(item: InvoiceFormLineItem): string {
		const total = lineItemTotal(item);
		if (total <= 0) return '—';
		return displayAmountValue(String(total));
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between gap-3">
		<h2 class="text-base font-semibold text-foreground">Invoice items</h2>
		<p class="text-sm text-muted-foreground">Currency · INR</p>
	</div>

	{#if items.length === 0}
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
				<CirclePlus class="size-5" />
			</div>
			<div class="min-w-0">
				<p class="text-sm font-medium text-foreground">Add product details</p>
				<p class="text-xs text-muted-foreground">Name, quantity, and amount</p>
			</div>
		</button>
	{:else}
		<ul class="flex flex-col gap-3" aria-label="Invoice line items">
			{#each items as item, index (item.id)}
				<li
					class="group flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-4"
				>
					<div class="flex min-w-0 flex-1 items-center gap-3">
						<div
							class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
							aria-hidden="true"
						>
							<Package class="size-5" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-semibold text-foreground">{item.name}</p>
							<p class="text-xs text-muted-foreground">
								Qty {lineItemQuantity(item) || 1} · ₹{displayAmountValue(item.amount)} each
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2 sm:shrink-0">
						<div
							class="relative flex h-9 min-w-0 flex-1 items-center rounded-md border border-input bg-background px-3 text-sm text-foreground sm:w-40 sm:flex-none"
						>
							<span class="truncate">{displayLineTotal(item)}</span>
							<span
								class="ml-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
								aria-hidden="true"
							>
								₹
							</span>
						</div>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label={`Edit item ${index + 1}`}
							{disabled}
							onclick={() => openEdit(item)}
							class="shrink-0"
						>
							<Pencil />
						</Button>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label={`Remove item ${index + 1}`}
							{disabled}
							onclick={() => removeItem(item.id)}
							class="shrink-0 text-destructive opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
						>
							<Trash2 />
						</Button>
					</div>
				</li>
			{/each}
		</ul>

		<button
			type="button"
			class="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
			{disabled}
			onclick={openAdd}
		>
			<CirclePlus class="size-4" />
			Add New Line
		</button>
	{/if}

	{#if error}
		<p class="text-xs text-destructive" role="alert">{error}</p>
	{/if}
</div>

<Modal
	bind:open
	title={isEditing ? 'Edit product details' : 'Add product details'}
	description="Item name, quantity, and unit amount for this invoice line."
>
	<form id="invoice-item-form" class="flex flex-col gap-4 py-2" onsubmit={saveItem}>
		<div class="flex flex-col gap-1.5">
			<label for="invoice-item-name" class="text-sm font-medium text-foreground">
				Item name <span class="text-destructive">*</span>
			</label>
			<Input id="invoice-item-name" placeholder="Item name" bind:value={draftName} />
			{#if draftErrors.name}
				<p class="text-xs text-destructive">{draftErrors.name}</p>
			{/if}
		</div>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-1.5">
				<label for="invoice-item-quantity" class="text-sm font-medium text-foreground">
					Quantity <span class="text-destructive">*</span>
				</label>
				<Input
					id="invoice-item-quantity"
					type="number"
					min="1"
					step="1"
					placeholder="1"
					bind:value={draftQuantity}
				/>
				{#if draftErrors.quantity}
					<p class="text-xs text-destructive">{draftErrors.quantity}</p>
				{/if}
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="invoice-item-amount" class="text-sm font-medium text-foreground">
					Unit price <span class="text-destructive">*</span>
				</label>
				<div class="relative">
					<span
						class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
					>
						₹
					</span>
					<Input
						id="invoice-item-amount"
						type="number"
						min="0"
						step="0.01"
						placeholder="0.00"
						bind:value={draftAmount}
						class="pl-7"
					/>
				</div>
				{#if draftErrors.amount}
					<p class="text-xs text-destructive">{draftErrors.amount}</p>
				{/if}
			</div>
		</div>
	</form>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit" form="invoice-item-form">Save</Button>
		</div>
	{/snippet}
</Modal>
