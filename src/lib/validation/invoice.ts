import { getLocalTimeZone, parseDate, today } from '@internationalized/date';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

export interface InvoiceFormLineItem {
	id: string;
	name: string;
	description: string;
	amount: string;
	quantity: string;
	taxPercent: string;
}

export interface CreateInvoiceFormValues {
	invoiceNumber: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	customerAddress: string;
	items: InvoiceFormLineItem[];
	dueDate: string;
	allowedPaymentMethods: string[];
	notifyEmail: boolean;
	notifySms: boolean;
}

export type CreateInvoiceField =
	Exclude<keyof CreateInvoiceFormValues, 'items'> | 'description' | 'amount' | 'items';
export type CreateInvoiceErrors = Partial<Record<CreateInvoiceField, string>>;

export function toInvoiceAmountString(value: string | number | null | undefined): string {
	if (value === null || value === undefined || value === '') return '';
	return String(value).replace(/,/g, '').trim();
}

export function createEmptyInvoiceLineItem(): InvoiceFormLineItem {
	return {
		id: `line_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`,
		name: '',
		description: '',
		amount: '',
		quantity: '1',
		taxPercent: '0'
	};
}

export function lineItemQuantity(item: Pick<InvoiceFormLineItem, 'quantity'>): number {
	const quantity = Number(toInvoiceAmountString(item.quantity));
	if (!Number.isFinite(quantity) || quantity <= 0) return 0;
	return Math.floor(quantity);
}

export function lineItemTotal(item: Pick<InvoiceFormLineItem, 'amount' | 'quantity'>): number {
	const amount = Number(toInvoiceAmountString(item.amount));
	const quantity = lineItemQuantity(item);
	if (!Number.isFinite(amount) || amount <= 0 || quantity <= 0) return 0;
	return amount * quantity;
}

export function invoiceItemsSubtotal(items: InvoiceFormLineItem[]): number {
	return items.reduce((sum, item) => sum + lineItemTotal(item), 0);
}

export function invoiceItemsDescription(items: InvoiceFormLineItem[]): string {
	return items
		.map((item) => {
			const name = item.name.trim();
			const description = item.description.trim();
			if (name && description) return `${name} — ${description}`;
			return name || description;
		})
		.filter(Boolean)
		.join('; ');
}

export type InvoiceLineItemField = 'name' | 'description' | 'amount' | 'quantity' | 'taxPercent';
export type InvoiceLineItemErrors = Partial<Record<InvoiceLineItemField, string>>;

export function validateInvoiceLineItem(
	values: Pick<InvoiceFormLineItem, InvoiceLineItemField>
): InvoiceLineItemErrors {
	const errors: InvoiceLineItemErrors = {};

	if (!values.name.trim()) {
		errors.name = 'Item name is required';
	}

	const amountRaw = toInvoiceAmountString(values.amount);
	const amount = Number(amountRaw);
	if (!amountRaw) {
		errors.amount = 'Amount is required';
	} else if (!Number.isFinite(amount) || amount <= 0) {
		errors.amount = 'Enter an amount greater than zero';
	}

	const quantityRaw = toInvoiceAmountString(values.quantity);
	const quantity = Number(quantityRaw);
	if (!quantityRaw) {
		errors.quantity = 'Quantity is required';
	} else if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
		errors.quantity = 'Enter a whole number of at least 1';
	}

	return errors;
}

export type InvoiceCustomerField =
	'customerName' | 'customerEmail' | 'customerPhone' | 'customerAddress';
export type InvoiceCustomerErrors = Partial<Record<InvoiceCustomerField, string>>;

export function validateInvoiceCustomer(
	values: Pick<CreateInvoiceFormValues, InvoiceCustomerField>
): InvoiceCustomerErrors {
	const errors: InvoiceCustomerErrors = {};

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

	if (!values.customerAddress.trim()) {
		errors.customerAddress = 'Customer address is required';
	}

	return errors;
}

export function validateCreateInvoiceForm(values: CreateInvoiceFormValues): CreateInvoiceErrors {
	const errors: CreateInvoiceErrors = {
		...validateInvoiceCustomer(values)
	};

	const invoiceNumber = values.invoiceNumber.trim();
	if (!invoiceNumber) {
		errors.invoiceNumber = 'Invoice number is required';
	}

	if (values.items.length === 0) {
		errors.items = 'Add at least one item';
	} else {
		const incomplete = values.items.some(
			(item) => Object.keys(validateInvoiceLineItem(item)).length > 0
		);
		if (incomplete) {
			errors.items = 'Each item needs a name, quantity, and an amount greater than zero';
		}
	}

	if (!values.dueDate.trim()) {
		errors.dueDate = 'Due date is required';
	} else {
		try {
			const selected = parseDate(values.dueDate);
			const minDate = today(getLocalTimeZone());
			if (selected.compare(minDate) < 0) {
				errors.dueDate = 'Due date must be today or in the future';
			}
		} catch {
			errors.dueDate = 'Enter a valid due date';
		}
	}

	if (values.allowedPaymentMethods.length === 0) {
		errors.allowedPaymentMethods = 'Select at least one payment method';
	}

	if (values.notifyEmail && !values.customerEmail.trim()) {
		errors.customerEmail = 'Customer email is required to send by email';
	}
	if (values.notifySms && !values.customerPhone.trim()) {
		errors.customerPhone = 'Customer phone is required to send by SMS';
	}

	return errors;
}

export function firstInvoiceValidationError(errors: CreateInvoiceErrors): string | undefined {
	return (
		errors.invoiceNumber ??
		errors.customerName ??
		errors.customerEmail ??
		errors.customerPhone ??
		errors.customerAddress ??
		errors.items ??
		errors.description ??
		errors.amount ??
		errors.dueDate ??
		errors.allowedPaymentMethods
	);
}
