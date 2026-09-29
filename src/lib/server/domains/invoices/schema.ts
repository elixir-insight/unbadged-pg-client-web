import * as v from 'valibot';
import {
	PAYMENT_LINK_ALLOWED_METHODS,
	PAYMENT_LINK_DELIVERY_METHODS
} from '$lib/types/payment-link';

const StringishSchema = v.pipe(
	v.union([v.string(), v.number()]),
	v.transform((value) => String(value))
);

export const CreateInvoiceItemClientSchema = v.object({
	itemName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Item name is required')),
	price: v.pipe(v.string(), v.trim(), v.minLength(1, 'Item price is required')),
	quantity: v.pipe(v.number(), v.minValue(1, 'Quantity must be at least 1')),
	total: v.pipe(v.string(), v.trim(), v.minLength(1, 'Item total is required'))
});

export const CreateInvoiceClientRequestSchema = v.object({
	amount: v.pipe(v.string(), v.trim(), v.minLength(1, 'Amount is required')),
	description: v.pipe(v.string(), v.trim(), v.minLength(1, 'Description is required')),
	referenceId: v.pipe(v.string(), v.trim(), v.minLength(1, 'Invoice id is required')),
	customerName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Customer name is required')),
	customerEmail: v.pipe(v.string(), v.trim(), v.email('Enter a valid email address')),
	customerPhone: v.pipe(
		v.string(),
		v.trim(),
		v.regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit phone number')
	),
	allowedPaymentMethods: v.pipe(
		v.array(v.picklist(PAYMENT_LINK_ALLOWED_METHODS)),
		v.minLength(1, 'Select at least one payment method')
	),
	deliveryMethods: v.optional(v.array(v.picklist(PAYMENT_LINK_DELIVERY_METHODS)), []),
	expiresBy: v.pipe(v.string(), v.trim(), v.minLength(1, 'Expiry is required')),
	items: v.pipe(v.array(CreateInvoiceItemClientSchema), v.minLength(1, 'Add at least one item')),
	merchantName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Merchant name is required')),
	gstNumber: v.pipe(v.string(), v.trim(), v.minLength(1, 'GST number is required')),
	customerAddress: v.optional(v.string(), '')
});

export const CreateInvoiceCustomerSchema = v.object({
	name: v.string(),
	email: v.string(),
	phoneNumber: v.string(),
	city: v.string(),
	country: v.string(),
	zipCode: v.string()
});

export const CreateInvoiceMerchantUrlSchema = v.object({
	cancelUrl: v.string(),
	failureUrl: v.string(),
	successUrl: v.string()
});

export const CreateInvoiceItemUpstreamSchema = v.object({
	itemName: v.string(),
	price: v.string(),
	quantity: v.number(),
	total: v.string()
});

export const CreateInvoiceUpstreamRequestSchema = v.object({
	amount: v.string(),
	currency: v.literal('INR'),
	description: v.string(),
	referenceId: v.string(),
	allowedPaymentMethods: v.array(v.string()),
	deliveryMethods: v.optional(v.array(v.string()), []),
	expiresBy: v.string(),
	customer: CreateInvoiceCustomerSchema,
	customerAddress: v.string(),
	gstNumber: v.string(),
	items: v.array(CreateInvoiceItemUpstreamSchema),
	merchantName: v.string(),
	merchantUrl: CreateInvoiceMerchantUrlSchema
});

export const CreateInvoiceCreatedSchema = v.object({
	amount: v.optional(v.nullable(StringishSchema), ''),
	clientOrderId: v.optional(v.nullable(StringishSchema), ''),
	invoiceUrl: v.pipe(v.string(), v.trim(), v.minLength(1)),
	message: v.optional(v.nullable(v.string()), ''),
	orderId: v.pipe(v.string(), v.trim(), v.minLength(1)),
	status: v.optional(v.nullable(v.string()), '')
});

export type CreateInvoiceClientRequest = v.InferOutput<typeof CreateInvoiceClientRequestSchema>;
export type CreateInvoiceUpstreamRequest = v.InferOutput<typeof CreateInvoiceUpstreamRequestSchema>;
export type CreateInvoiceCreated = v.InferOutput<typeof CreateInvoiceCreatedSchema>;
