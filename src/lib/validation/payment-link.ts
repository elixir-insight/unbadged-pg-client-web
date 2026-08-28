import { getLocalTimeZone, parseDate, today } from '@internationalized/date';
import { toExpiryUtcIso, isValidExpiryTime } from '$lib/utils/payment-link-expiry';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

export interface CreatePaymentLinkFormValues {
	amount: string | number;
	paymentFor: string;
	receipt: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	allowedPaymentMethods: string[];
	expireOn: string;
	expireAt: string;
}

export type CreatePaymentLinkField = keyof CreatePaymentLinkFormValues;

export type CreatePaymentLinkErrors = Partial<Record<CreatePaymentLinkField, string>>;

export function toPaymentLinkAmountString(value: string | number | null | undefined): string {
	if (value === null || value === undefined || value === '') return '';
	return String(value).replace(/,/g, '').trim();
}

export function validateCreatePaymentLinkForm(
	values: CreatePaymentLinkFormValues
): CreatePaymentLinkErrors {
	const errors: CreatePaymentLinkErrors = {};

	const amountRaw = toPaymentLinkAmountString(values.amount);
	const amount = Number(amountRaw);
	if (!amountRaw) {
		errors.amount = 'Amount is required';
	} else if (!Number.isFinite(amount) || amount <= 0) {
		errors.amount = 'Enter an amount greater than zero';
	}

	const paymentFor = values.paymentFor.trim();
	if (!paymentFor) {
		errors.paymentFor = 'Payment For is required';
	}

	const receipt = values.receipt.trim();
	if (!receipt) {
		errors.receipt = 'Receipt is required';
	}

	const customerName = values.customerName.trim();
	if (!customerName) {
		errors.customerName = 'Customer name is required';
	}

	const customerEmail = values.customerEmail.trim();
	if (!customerEmail) {
		errors.customerEmail = 'Customer email is required';
	} else if (!EMAIL_PATTERN.test(customerEmail)) {
		errors.customerEmail = 'Enter a valid email address';
	}

	const customerPhone = values.customerPhone.trim();
	if (!customerPhone) {
		errors.customerPhone = 'Customer phone is required';
	} else if (!PHONE_PATTERN.test(customerPhone)) {
		errors.customerPhone = 'Enter a valid 10-digit phone number';
	}

	if (values.allowedPaymentMethods.length === 0) {
		errors.allowedPaymentMethods = 'Select at least one payment method';
	}

	if (!values.expireOn.trim()) {
		errors.expireOn = 'Expiry date is required';
	} else {
		try {
			const selected = parseDate(values.expireOn);
			const minDate = today(getLocalTimeZone());
			if (selected.compare(minDate) < 0) {
				errors.expireOn = 'Expiry date must be today or in the future';
			}
		} catch {
			errors.expireOn = 'Enter a valid expiry date';
		}
	}

	if (!values.expireAt.trim()) {
		errors.expireAt = 'Expiry time is required';
	} else if (!isValidExpiryTime(values.expireAt)) {
		errors.expireAt = 'Enter a valid expiry time';
	} else if (!errors.expireOn) {
		try {
			const expiry = new Date(toExpiryUtcIso(values.expireOn, values.expireAt));
			if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
				errors.expireAt = 'Expiry must be in the future';
			}
		} catch {
			errors.expireAt = 'Enter a valid expiry time';
		}
	}

	return errors;
}

export function firstPaymentLinkValidationError(
	errors: CreatePaymentLinkErrors
): string | undefined {
	return (
		errors.amount ??
		errors.paymentFor ??
		errors.receipt ??
		errors.customerName ??
		errors.customerEmail ??
		errors.customerPhone ??
		errors.allowedPaymentMethods ??
		errors.expireOn ??
		errors.expireAt
	);
}
