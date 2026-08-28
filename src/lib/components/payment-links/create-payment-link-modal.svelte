<script lang="ts">
	import {
		Button,
		DatePicker,
		Input,
		Modal,
		MultiSelect,
		PhoneInput,
		toast
	} from '$lib/components/reusable';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import {
		firstPaymentLinkValidationError,
		toPaymentLinkAmountString,
		validateCreatePaymentLinkForm,
		type CreatePaymentLinkFormValues
	} from '$lib/validation/payment-link';
	import {
		createPaymentLinkRequest,
		PaymentLinkReceiptConflictError
	} from '$lib/api/payment-links';
	import { persistCreatedPaymentLink } from '$lib/utils/payment-links-store';
	import { mapCreatedPaymentLink } from '$lib/utils/payment-link-map';
	import { toExpiryUtcIso } from '$lib/utils/payment-link-expiry';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import {
		PAYMENT_LINK_ALLOWED_METHODS,
		PAYMENT_LINK_METHOD_OPTIONS,
		type PaymentLink,
		type PaymentLinkAllowedMethod
	} from '$lib/types/payment-link';

	interface Props {
		open?: boolean;
		onCreated?: (link: PaymentLink) => void;
	}

	let { open = $bindable(false), onCreated }: Props = $props();

	const DEFAULT_EXPIRE_AT = '23:59';
	const expiryMinDate = today(getLocalTimeZone());

	let amount = $state('');
	let paymentFor = $state('');
	let receipt = $state('');
	let customerName = $state('');
	let customerEmail = $state('');
	let customerPhone = $state('');
	let allowedPaymentMethods = $state<string[]>([]);
	let expireOn = $state('');
	let expireAt = $state(DEFAULT_EXPIRE_AT);
	let submitting = $state(false);
	let formError = $state<string | null>(null);
	let fieldErrors = $state<Partial<Record<keyof CreatePaymentLinkFormValues, string>>>({});

	function resetForm() {
		amount = '';
		paymentFor = '';
		receipt = '';
		customerName = '';
		customerEmail = '';
		customerPhone = '';
		allowedPaymentMethods = [];
		expireOn = '';
		expireAt = DEFAULT_EXPIRE_AT;
		formError = null;
		fieldErrors = {};
	}

	$effect(() => {
		if (!open) resetForm();
	});

	function selectedMethods(values: string[]): PaymentLinkAllowedMethod[] {
		return values.filter((value): value is PaymentLinkAllowedMethod =>
			PAYMENT_LINK_ALLOWED_METHODS.some((method) => method === value)
		);
	}

	async function handleSubmit(event?: Event) {
		event?.preventDefault();
		if (submitting) return;
		formError = null;

		const values: CreatePaymentLinkFormValues = {
			amount,
			paymentFor,
			receipt,
			customerName,
			customerEmail,
			customerPhone,
			allowedPaymentMethods,
			expireOn,
			expireAt
		};
		const errors = validateCreatePaymentLinkForm(values);
		fieldErrors = errors;

		const firstError = firstPaymentLinkValidationError(errors);
		if (firstError) {
			formError = firstError;
			return;
		}

		const amountValue = toPaymentLinkAmountString(amount);
		const expiresBy = toExpiryUtcIso(expireOn, expireAt);

		const payload = {
			amount: amountValue,
			description: paymentFor.trim(),
			referenceId: receipt.trim(),
			customerName: customerName.trim(),
			customerEmail: customerEmail.trim(),
			customerPhone: customerPhone.trim(),
			allowedPaymentMethods: selectedMethods(allowedPaymentMethods),
			expiresBy
		};

		submitting = true;
		try {
			const created = await createPaymentLinkRequest(payload);

			const link = persistCreatedPaymentLink(
				mapCreatedPaymentLink({
					response: created,
					paymentFor: paymentFor.trim(),
					receipt: receipt.trim(),
					expiresBy,
					createdBy: merchantSession.session?.merchantName ?? 'Merchant User',
					customerEmail: customerEmail.trim(),
					customerPhone: customerPhone.trim()
				})
			);

			toast.success(created.message || 'Payment link created');
			open = false;
			onCreated?.(link);
		} catch (error) {
			if (error instanceof PaymentLinkReceiptConflictError) {
				formError = error.message;
				fieldErrors = { ...fieldErrors, receipt: error.message };
				return;
			}
			formError =
				error instanceof Error ? error.message : 'Unable to create payment link. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<Modal bind:open title="Create Payment Link" class="max-h-[min(32rem,calc(100dvh-8rem))]">
	<form
		id="create-payment-link-form"
		class="flex max-h-80 flex-col gap-4 overflow-y-auto pe-1"
		onsubmit={handleSubmit}
	>
		<div class="flex flex-col gap-1.5">
			<label for="payment-link-amount" class="text-sm font-medium text-foreground">Amount</label>
			<div class="relative">
				<span
					class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
				>
					₹
				</span>
				<Input
					id="payment-link-amount"
					type="number"
					min="0"
					step="0.01"
					placeholder="0.00"
					bind:value={amount}
					class="pl-7"
					disabled={submitting}
				/>
			</div>
			{#if fieldErrors.amount}
				<p class="text-xs text-destructive">{fieldErrors.amount}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="payment-link-for" class="text-sm font-medium text-foreground">Payment For</label>
			<Input
				id="payment-link-for"
				placeholder="What is this payment for?"
				bind:value={paymentFor}
				disabled={submitting}
			/>
			{#if fieldErrors.paymentFor}
				<p class="text-xs text-destructive">{fieldErrors.paymentFor}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="payment-link-receipt" class="text-sm font-medium text-foreground">Receipt</label>
			<Input
				id="payment-link-receipt"
				placeholder="Unique receipt / reference ID"
				bind:value={receipt}
				disabled={submitting}
			/>
			{#if fieldErrors.receipt}
				<p class="text-xs text-destructive">{fieldErrors.receipt}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="payment-link-customer-name" class="text-sm font-medium text-foreground">
				Customer name
			</label>
			<Input
				id="payment-link-customer-name"
				placeholder="Customer name"
				bind:value={customerName}
				disabled={submitting}
			/>
			{#if fieldErrors.customerName}
				<p class="text-xs text-destructive">{fieldErrors.customerName}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="payment-link-customer-email" class="text-sm font-medium text-foreground">
				Customer email
			</label>
			<Input
				id="payment-link-customer-email"
				type="email"
				placeholder="customer@example.com"
				bind:value={customerEmail}
				disabled={submitting}
			/>
			{#if fieldErrors.customerEmail}
				<p class="text-xs text-destructive">{fieldErrors.customerEmail}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="payment-link-customer-phone" class="text-sm font-medium text-foreground">
				Customer phone
			</label>
			<PhoneInput
				id="payment-link-customer-phone"
				placeholder="9876543210"
				bind:value={customerPhone}
				disabled={submitting}
				invalid={Boolean(fieldErrors.customerPhone)}
			/>
			{#if fieldErrors.customerPhone}
				<p class="text-xs text-destructive">{fieldErrors.customerPhone}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<span id="payment-link-methods-label" class="text-sm font-medium text-foreground">
				Allowed payment methods
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

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-foreground">Expire On</span>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="flex flex-col gap-1.5">
					<span class="text-xs text-muted-foreground">Date</span>
					<DatePicker
						bind:value={expireOn}
						placeholder="DD-MM-YYYY"
						minValue={expiryMinDate}
						disabled={submitting}
					/>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="payment-link-expire-at" class="text-xs text-muted-foreground">Time</label>
					<Input
						id="payment-link-expire-at"
						type="time"
						bind:value={expireAt}
						disabled={submitting}
					/>
				</div>
			</div>
			{#if fieldErrors.expireOn}
				<p class="text-xs text-destructive">{fieldErrors.expireOn}</p>
			{/if}
			{#if fieldErrors.expireAt}
				<p class="text-xs text-destructive">{fieldErrors.expireAt}</p>
			{/if}
		</div>

		{#if formError}
			<p class="text-sm text-destructive">{formError}</p>
		{/if}
	</form>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button
				type="button"
				variant="outline"
				class="w-full sm:w-auto"
				disabled={submitting}
				onclick={() => (open = false)}
			>
				Cancel
			</Button>
			<Button
				type="button"
				class="w-full sm:w-auto"
				disabled={submitting}
				onclick={() => handleSubmit()}
			>
				{submitting ? 'Creating…' : 'Create Payment Link'}
			</Button>
		</div>
	{/snippet}
</Modal>
