<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import {
		Button,
		Checkbox,
		DatePicker,
		Input,
		MultiSelect,
		toast
	} from '$lib/components/reusable';
	import { InvoiceBillTo, InvoiceItems, InvoicePreview } from '$lib/components/invoices';
	import { createInvoiceRequest, InvoiceReferenceConflictError } from '$lib/api/invoices';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import {
		PAYMENT_LINK_ALLOWED_METHODS,
		PAYMENT_LINK_METHOD_OPTIONS,
		type PaymentLinkAllowedMethod,
		type PaymentLinkDeliveryMethod
	} from '$lib/types/payment-link';
	import { toExpiryUtcIso } from '$lib/utils/payment-link-expiry';
	import {
		firstInvoiceValidationError,
		invoiceItemsDescription,
		invoiceItemsSubtotal,
		lineItemQuantity,
		toInvoiceAmountString,
		validateCreateInvoiceForm,
		type CreateInvoiceFormValues,
		type InvoiceFormLineItem
	} from '$lib/validation/invoice';
	import { createInvoiceId, loadInvoices, nextInvoiceNumber } from '$lib/utils/invoices-store';
	import type { InvoiceLineItem } from '$lib/types/invoice';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const DEFAULT_EXPIRE_AT = '23:59';
	const expiryMinDate = today(getLocalTimeZone());
	const fieldLabel = 'text-sm font-medium text-muted-foreground';

	const issuerName = $derived(
		data.issuer?.name?.trim() || merchantSession.session?.merchantName?.trim() || 'Merchant'
	);
	const issuerGstin = $derived(data.issuer?.gstNumber?.trim() || '');

	let invoiceNumber = $state('');
	let customerName = $state('');
	let customerEmail = $state('');
	let customerPhone = $state('');
	let customerAddress = $state('');
	let items = $state<InvoiceFormLineItem[]>([]);
	let dueDate = $state(today(getLocalTimeZone()).add({ days: 14 }).toString());
	let allowedPaymentMethods = $state<string[]>([...PAYMENT_LINK_ALLOWED_METHODS]);
	let notifyEmail = $state(true);
	let notifySms = $state(false);
	let submitting = $state(false);
	let submitAttempted = $state(false);

	const formValues = $derived<CreateInvoiceFormValues>({
		invoiceNumber,
		customerName,
		customerEmail,
		customerPhone,
		customerAddress,
		items,
		dueDate,
		allowedPaymentMethods,
		notifyEmail,
		notifySms
	});

	const fieldErrors = $derived(submitAttempted ? validateCreateInvoiceForm(formValues) : {});
	const parsedAmount = $derived(invoiceItemsSubtotal(items));
	const description = $derived(invoiceItemsDescription(items));
	const previewItems = $derived<InvoiceLineItem[]>(
		items
			.filter((item) => item.name.trim() || Number(toInvoiceAmountString(item.amount)) > 0)
			.map((item) => ({
				id: item.id,
				name: item.name.trim() || 'Item',
				description: item.description.trim(),
				amount: Number(toInvoiceAmountString(item.amount)) || 0,
				quantity: lineItemQuantity(item) || 1,
				taxPercent: Number(toInvoiceAmountString(item.taxPercent)) || 0
			}))
	);

	onMount(() => {
		invoiceNumber = nextInvoiceNumber(loadInvoices());
	});

	function selectedMethods(values: string[]): PaymentLinkAllowedMethod[] {
		return values.filter((value): value is PaymentLinkAllowedMethod =>
			PAYMENT_LINK_ALLOWED_METHODS.some((method) => method === value)
		);
	}

	function selectedDeliveryMethods(): PaymentLinkDeliveryMethod[] {
		const methods: PaymentLinkDeliveryMethod[] = [];
		if (notifyEmail) methods.push('EMAIL');
		if (notifySms) methods.push('SMS');
		return methods;
	}

	function formatAmountForApi(value: number): string {
		return value.toFixed(2);
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (submitting) return;
		submitAttempted = true;
		const errors = validateCreateInvoiceForm(formValues);
		const firstError = firstInvoiceValidationError(errors);
		if (firstError) {
			toast.error(firstError);
			return;
		}

		submitting = true;
		const id = createInvoiceId();
		const methods = selectedMethods(allowedPaymentMethods);
		const deliveryMethods = selectedDeliveryMethods();
		const address = customerAddress.trim();
		const lineItems: InvoiceLineItem[] = items.map((item) => ({
			id: item.id,
			name: item.name.trim(),
			description: item.description.trim(),
			amount: Number(toInvoiceAmountString(item.amount)),
			quantity: lineItemQuantity(item) || 1,
			taxPercent: Number(toInvoiceAmountString(item.taxPercent)) || 0
		}));
		const amountValue = formatAmountForApi(invoiceItemsSubtotal(items));
		const descriptionValue = invoiceItemsDescription(items);
		const expiresBy = toExpiryUtcIso(dueDate, DEFAULT_EXPIRE_AT);
		const customerPhoneE164 = `+91${customerPhone.trim()}`;
		const merchantName = issuerName;
		const gstNumber = issuerGstin;

		if (!gstNumber) {
			toast.error('GST number not found on your organization profile.');
			submitting = false;
			return;
		}

		try {
			const created = await createInvoiceRequest({
				amount: amountValue,
				description: descriptionValue,
				referenceId: id,
				customerName: customerName.trim(),
				customerEmail: customerEmail.trim(),
				customerPhone: customerPhoneE164,
				customerAddress: address,
				allowedPaymentMethods: methods,
				deliveryMethods,
				expiresBy,
				items: lineItems.map((item) => ({
					itemName: item.name,
					price: formatAmountForApi(item.amount),
					quantity: item.quantity,
					total: formatAmountForApi(item.amount * item.quantity)
				})),
				merchantName,
				gstNumber
			});

			toast.success(created.message || 'Invoice sent', {
				description: deliveryMethods.length > 0 ? 'The customer has been notified.' : undefined
			});
			goto(resolve('/merchant/invoices'));
		} catch (error) {
			const message =
				error instanceof InvoiceReferenceConflictError
					? error.message
					: error instanceof Error
						? error.message
						: 'Unable to create invoice. Please try again.';
			toast.error(message);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
		<h1 class="text-2xl font-semibold text-foreground">New Invoice</h1>
		<Button type="submit" form="create-invoice-form" disabled={submitting}>
			{submitting ? 'Sending…' : 'Send Invoice'}
		</Button>
	</div>

	{#if data.issuerError}
		<p class="text-sm text-destructive print:hidden" role="alert">{data.issuerError}</p>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<form id="create-invoice-form" class="flex flex-col print:hidden" onsubmit={handleSubmit}>
			<section class="flex flex-col gap-4 border-b border-border pb-8">
				<h2 class="text-base font-semibold text-foreground">Invoice details</h2>

				<div class="flex flex-col gap-2">
					<span id="invoice-bill-to-label" class={fieldLabel}>
						Bill to <span class="text-destructive">*</span>
					</span>
					<InvoiceBillTo
						bind:customerName
						bind:customerEmail
						bind:customerPhone
						bind:customerAddress
						disabled={submitting}
						nameError={fieldErrors.customerName ?? ''}
						emailError={fieldErrors.customerEmail ?? ''}
						phoneError={fieldErrors.customerPhone ?? ''}
						addressError={fieldErrors.customerAddress ?? ''}
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1.5">
						<label for="invoice-number" class={fieldLabel}>
							Invoice number <span class="text-destructive">*</span>
						</label>
						<Input
							id="invoice-number"
							placeholder="INV-202609-0001"
							bind:value={invoiceNumber}
							disabled={submitting}
						/>
						{#if fieldErrors.invoiceNumber}
							<p class="text-xs text-destructive">{fieldErrors.invoiceNumber}</p>
						{/if}
					</div>
					<div class="flex flex-col gap-1.5">
						<span class={fieldLabel}>
							Due date <span class="text-destructive">*</span>
						</span>
						<DatePicker
							bind:value={dueDate}
							placeholder="DD-MM-YYYY"
							minValue={expiryMinDate}
							disabled={submitting}
						/>
						{#if fieldErrors.dueDate}
							<p class="text-xs text-destructive">{fieldErrors.dueDate}</p>
						{/if}
					</div>
				</div>
			</section>

			<section class="border-b border-border py-8">
				<InvoiceItems bind:items disabled={submitting} error={fieldErrors.items ?? ''} />
			</section>

			<section class="flex flex-col gap-4 pt-8">
				<div class="flex flex-col gap-2">
					<span id="invoice-notify-label" class={fieldLabel}>Notify</span>
					<div
						class="grid grid-cols-1 gap-3 sm:grid-cols-2"
						role="group"
						aria-labelledby="invoice-notify-label"
					>
						<Checkbox
							id="invoice-notify-email"
							label="via Email"
							bind:checked={notifyEmail}
							disabled={submitting}
						/>
						<Checkbox
							id="invoice-notify-sms"
							label="via SMS"
							bind:checked={notifySms}
							disabled={submitting}
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<span id="invoice-methods-label" class={fieldLabel}>
						Payment methods <span class="text-destructive">*</span>
					</span>
					<MultiSelect
						bind:value={allowedPaymentMethods}
						options={[...PAYMENT_LINK_METHOD_OPTIONS]}
						placeholder="Select payment methods"
						disabled={submitting}
					/>
					{#if fieldErrors.allowedPaymentMethods}
						<p class="text-xs text-destructive">{fieldErrors.allowedPaymentMethods}</p>
					{/if}
				</div>
			</section>
		</form>

		<section class="min-w-0">
			<InvoicePreview
				{invoiceNumber}
				{customerName}
				{customerEmail}
				{customerPhone}
				{customerAddress}
				{dueDate}
				issuedDate={new Date().toISOString().slice(0, 10)}
				{description}
				amount={parsedAmount}
				items={previewItems}
				{issuerName}
				{issuerGstin}
			/>
		</section>
	</div>
</div>
