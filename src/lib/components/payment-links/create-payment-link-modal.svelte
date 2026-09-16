<script lang="ts">
	import {
		Button,
		Checkbox,
		DatePicker,
		Input,
		Modal,
		MultiSelect,
		PhoneInput,
		Textarea,
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
	import { mapCreatedPaymentLink } from '$lib/utils/payment-link-map';
	import { toExpiryUtcIso } from '$lib/utils/payment-link-expiry';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import {
		PAYMENT_LINK_ALLOWED_METHODS,
		PAYMENT_LINK_METHOD_OPTIONS,
		type PaymentLink,
		type PaymentLinkAllowedMethod,
		type PaymentLinkDeliveryMethod
	} from '$lib/types/payment-link';

	interface Props {
		open?: boolean;
		onCreated?: (link: PaymentLink) => void;
	}

	let { open = $bindable(false), onCreated }: Props = $props();

	const DEFAULT_EXPIRE_AT = '23:59';
	const expiryMinDate = today(getLocalTimeZone());
	const fieldRow =
		'grid grid-cols-1 items-start gap-2 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-x-8';
	const fieldLabel = 'text-sm font-medium text-muted-foreground sm:pt-2';

	let amount = $state('');
	let paymentFor = $state('');
	let receipt = $state('');
	let customerName = $state('');
	let customerEmail = $state('');
	let customerPhone = $state('');
	let allowedPaymentMethods = $state<string[]>([]);
	let sendByEmail = $state(false);
	let sendBySms = $state(false);
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
		sendByEmail = false;
		sendBySms = false;
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

	function selectedDeliveryMethods(): PaymentLinkDeliveryMethod[] {
		const methods: PaymentLinkDeliveryMethod[] = [];
		if (sendByEmail) methods.push('EMAIL');
		if (sendBySms) methods.push('SMS');
		return methods;
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
			deliveryMethods: selectedDeliveryMethods(),
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
		const customerPhoneE164 = `+91${customerPhone.trim()}`;

		const payload = {
			amount: amountValue,
			description: paymentFor.trim(),
			referenceId: receipt.trim(),
			customerName: customerName.trim(),
			customerEmail: customerEmail.trim(),
			customerPhone: customerPhoneE164,
			allowedPaymentMethods: selectedMethods(allowedPaymentMethods),
			deliveryMethods: selectedDeliveryMethods(),
			expiresBy
		};

		submitting = true;
		try {
			const created = await createPaymentLinkRequest(payload);

			const link = mapCreatedPaymentLink({
				response: created,
				paymentFor: paymentFor.trim(),
				receipt: receipt.trim(),
				expiresBy,
				createdBy: merchantSession.session?.merchantName ?? 'Merchant User',
				customerEmail: customerEmail.trim(),
				customerPhone: customerPhoneE164
			});

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

<Modal
	bind:open
	title="Create Payment Link"
	class="max-h-[min(90vh,calc(100dvh-4rem))] sm:max-w-2xl"
>
	<form id="create-payment-link-form" class="flex flex-col gap-6 py-2" onsubmit={handleSubmit}>
		<div class={fieldRow}>
			<label for="payment-link-amount" class={fieldLabel}>
				Amount <span class="text-destructive">*</span>
			</label>
			<div class="flex min-w-0 flex-col gap-2">
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
		</div>

		<div class={fieldRow}>
			<label for="payment-link-for" class={fieldLabel}>
				Payment For <span class="text-destructive">*</span>
			</label>
			<div class="flex min-w-0 flex-col gap-2">
				<Textarea
					id="payment-link-for"
					placeholder="Payment description"
					bind:value={paymentFor}
					disabled={submitting}
					rows={3}
				/>
				<p class="text-xs text-muted-foreground">This will be visible to the customer.</p>
				{#if fieldErrors.paymentFor}
					<p class="text-xs text-destructive">{fieldErrors.paymentFor}</p>
				{/if}
			</div>
		</div>

		<div class={fieldRow}>
			<span id="payment-link-customer-label" class={fieldLabel}>
				Customer details <span class="text-destructive">*</span>
			</span>
			<div
				class="flex min-w-0 flex-col gap-4"
				role="group"
				aria-labelledby="payment-link-customer-label"
			>
				<div class="flex flex-col gap-2">
					<label for="payment-link-customer-name" class="sr-only">Customer name</label>
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
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="flex min-w-0 flex-col gap-2">
						<label for="payment-link-customer-phone" class="sr-only">Mobile</label>
						<PhoneInput
							id="payment-link-customer-phone"
							placeholder="Mobile"
							bind:value={customerPhone}
							disabled={submitting}
							invalid={Boolean(fieldErrors.customerPhone)}
						/>
						{#if fieldErrors.customerPhone}
							<p class="text-xs text-destructive">{fieldErrors.customerPhone}</p>
						{/if}
					</div>
					<div class="flex min-w-0 flex-col gap-2">
						<label for="payment-link-customer-email" class="sr-only">Email</label>
						<Input
							id="payment-link-customer-email"
							type="email"
							placeholder="Email"
							bind:value={customerEmail}
							disabled={submitting}
						/>
						{#if fieldErrors.customerEmail}
							<p class="text-xs text-destructive">{fieldErrors.customerEmail}</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class={fieldRow}>
			<span id="payment-link-notify-label" class={fieldLabel}>Notify</span>
			<div
				class="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
				role="group"
				aria-labelledby="payment-link-notify-label"
			>
				<Checkbox
					id="payment-link-send-sms"
					label="via SMS"
					bind:checked={sendBySms}
					disabled={submitting}
				/>
				<Checkbox
					id="payment-link-send-email"
					label="via Email"
					bind:checked={sendByEmail}
					disabled={submitting}
				/>
			</div>
		</div>

		<div class={fieldRow}>
			<label for="payment-link-receipt" class={fieldLabel}>
				Receipt <span class="text-destructive">*</span>
			</label>
			<div class="flex min-w-0 flex-col gap-2">
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
		</div>

		<div class={fieldRow}>
			<span id="payment-link-methods-label" class={fieldLabel}>
				Payment methods <span class="text-destructive">*</span>
			</span>
			<div class="flex min-w-0 flex-col gap-2">
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
		</div>

		<div class={fieldRow}>
			<span class={fieldLabel}>Expire On <span class="text-destructive">*</span></span>
			<div class="flex min-w-0 flex-col gap-2">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="flex min-w-0 flex-col gap-2">
						<span class="sr-only">Date</span>
						<DatePicker
							bind:value={expireOn}
							placeholder="DD-MM-YYYY"
							minValue={expiryMinDate}
							disabled={submitting}
						/>
						{#if fieldErrors.expireOn}
							<p class="text-xs text-destructive">{fieldErrors.expireOn}</p>
						{/if}
					</div>
					<div class="flex min-w-0 flex-col gap-2">
						<label for="payment-link-expire-at" class="sr-only">Time</label>
						<Input
							id="payment-link-expire-at"
							type="time"
							bind:value={expireAt}
							disabled={submitting}
						/>
						{#if fieldErrors.expireAt}
							<p class="text-xs text-destructive">{fieldErrors.expireAt}</p>
						{/if}
					</div>
				</div>
			</div>
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
