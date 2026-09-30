<script lang="ts">
	import { CompanyLogoAlt, CompanyLogoLight } from '$lib/assets/icons';
	import { formatInvoiceAmount, formatInvoiceDueDate } from '$lib/utils/invoices-store';
	import { cn } from '$lib/utils';
	import type { InvoiceLineItem } from '$lib/types/invoice';

	let {
		invoiceNumber = '',
		customerName = '',
		customerEmail = '',
		customerPhone = '',
		customerAddress = '',
		dueDate = '',
		issuedDate = '',
		description = '',
		amount = 0,
		items = [],
		issuerName = '',
		issuerGstin = '',
		class: className
	}: {
		invoiceNumber?: string;
		customerName?: string;
		customerEmail?: string;
		customerPhone?: string;
		customerAddress?: string;
		dueDate?: string;
		issuedDate?: string;
		description?: string;
		amount?: number;
		items?: InvoiceLineItem[];
		issuerName?: string;
		issuerGstin?: string;
		class?: string;
	} = $props();

	const displayNumber = $derived(invoiceNumber.trim() || '—');
	const displayName = $derived(customerName.trim() || 'Customer name');
	const displayEmail = $derived(customerEmail.trim() || 'email@example.com');
	const displayPhone = $derived(formatPhone(customerPhone));
	const displayAddress = $derived(customerAddress.trim());
	const displayDue = $derived(dueDate.trim() ? formatInvoiceDueDate(dueDate) : '—');
	const displayIssued = $derived(
		issuedDate.trim()
			? formatInvoiceDueDate(issuedDate)
			: formatInvoiceDueDate(new Date().toISOString().slice(0, 10))
	);
	const displayIssuer = $derived(issuerName.trim() || 'Issuer');
	const displayGstin = $derived(issuerGstin.trim());

	const lineItems = $derived.by(() => {
		if (items.length > 0) return items;
		if (!description.trim() && amount <= 0) return [];
		return [
			{
				id: 'preview-item',
				name: description.trim(),
				description: '',
				amount,
				quantity: 1,
				taxPercent: 0
			} satisfies InvoiceLineItem
		].filter((item) => item.name.length > 0 || item.amount > 0);
	});

	const subtotal = $derived(
		lineItems.reduce((sum, item) => {
			const quantity = item.quantity > 0 ? item.quantity : 0;
			const unitPrice = item.amount > 0 ? item.amount : 0;
			return sum + unitPrice * quantity;
		}, 0)
	);
	const grandTotal = $derived(subtotal);

	function formatPhone(phone: string): string {
		const digits = phone.replace(/\D/g, '');
		if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
		return phone.trim();
	}

	function itemLabel(item: InvoiceLineItem): string {
		return item.name.trim() || '—';
	}

	function itemQuantity(item: InvoiceLineItem): number {
		return item.quantity > 0 ? item.quantity : 1;
	}

	function itemTotal(item: InvoiceLineItem): number {
		const unitPrice = item.amount > 0 ? item.amount : 0;
		return unitPrice * itemQuantity(item);
	}

	function formatMoney(value: number): string {
		return formatInvoiceAmount(value);
	}
</script>

<div class={cn('flex flex-col text-xs leading-relaxed text-foreground', className)}>
	<header class="flex items-start justify-between gap-3 border-b border-border pb-3">
		<div class="min-w-0">
			<h2 class="text-lg font-semibold tracking-tight text-foreground">Invoice</h2>
			<p class="mt-1 text-xs text-muted-foreground">
				Invoice Number
				<span class="font-medium text-foreground">#{displayNumber}</span>
			</p>
		</div>
		<div class="shrink-0" aria-hidden="true">
			<CompanyLogoAlt width="36" />
		</div>
	</header>

	<section class="grid grid-cols-1 gap-4 border-b border-border py-3 sm:grid-cols-2">
		<div class="min-w-0 space-y-2">
			<div>
				<p class="text-muted-foreground">Billed By :</p>
				<p class="mt-0.5 font-semibold text-foreground">{displayIssuer}</p>
				{#if displayGstin}
					<p class="text-muted-foreground">GSTIN — {displayGstin}</p>
				{/if}
			</div>
			<div>
				<p class="text-muted-foreground">
					Date Issued :
					<span class="font-semibold text-foreground">{displayIssued}</span>
				</p>
			</div>
		</div>

		<div class="min-w-0 space-y-2">
			<div>
				<p class="text-muted-foreground">Billed To :</p>
				<p class="mt-0.5 font-semibold text-foreground">{displayName}</p>
				{#if displayAddress}
					<p class="mt-0.5 whitespace-pre-line text-muted-foreground">{displayAddress}</p>
				{/if}
				<p class="mt-0.5 text-muted-foreground">{displayEmail}</p>
				{#if displayPhone}
					<p class="text-muted-foreground">{displayPhone}</p>
				{/if}
			</div>
			<div>
				<p class="text-muted-foreground">
					Due Date :
					<span class="font-semibold text-foreground">{displayDue}</span>
				</p>
			</div>
		</div>
	</section>

	<section class="py-3">
		<p class="mb-2 text-muted-foreground">Invoice items</p>

		<div class="overflow-x-auto">
			<table class="w-full min-w-[24rem] border-collapse text-xs">
				<thead>
					<tr class="border-b border-border text-left">
						<th class="pr-3 pb-2 font-semibold text-foreground">Items/Service</th>
						<th class="pr-3 pb-2 text-center font-semibold text-foreground">Quantity</th>
						<th class="pr-3 pb-2 text-right font-semibold text-foreground">Unit Price</th>
						<th class="pb-2 text-right font-semibold text-foreground">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each lineItems as item (item.id)}
						<tr class="border-b border-border/60">
							<td class="py-2 pr-3 align-top">
								<p class="font-medium text-foreground">{itemLabel(item)}</p>
							</td>
							<td class="py-2 pr-3 text-center align-top text-foreground">
								{itemQuantity(item)}
							</td>
							<td class="py-2 pr-3 text-right align-top text-foreground">
								{item.amount > 0 ? formatInvoiceAmount(item.amount) : '—'}
							</td>
							<td class="py-2 text-right align-top font-medium text-foreground">
								{itemTotal(item) > 0 ? formatInvoiceAmount(itemTotal(item)) : '—'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-3 ml-auto w-full max-w-[14rem] space-y-1 text-xs">
			<div class="flex items-center justify-between gap-4">
				<span class="text-muted-foreground">Subtotal</span>
				<span class="text-foreground">{formatMoney(subtotal)}</span>
			</div>
			<div
				class="flex items-center justify-between gap-4 border-t border-border pt-2 text-sm font-semibold"
			>
				<span class="text-foreground">Grand Total</span>
				<span class="text-foreground">{formatMoney(grandTotal)}</span>
			</div>
		</div>
	</section>

	<footer class="mt-auto flex items-center justify-end gap-2 border-t border-border pt-3">
		<span class="text-xs text-muted-foreground">Powered by</span>
		<CompanyLogoLight width="88" class="opacity-80" />
	</footer>
</div>
