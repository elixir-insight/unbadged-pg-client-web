import * as v from 'valibot';
import { PAYMENT_LINK_ALLOWED_METHODS } from '$lib/types/payment-link';

const StringishSchema = v.pipe(
	v.union([v.string(), v.number()]),
	v.transform((value) => String(value))
);

export const CreatePaymentLinkClientRequestSchema = v.object({
	amount: v.pipe(v.string(), v.trim(), v.minLength(1, 'Amount is required')),
	description: v.pipe(v.string(), v.trim(), v.minLength(1, 'Payment For is required')),
	referenceId: v.pipe(v.string(), v.trim(), v.minLength(1, 'Receipt is required')),
	customerName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Customer name is required')),
	customerEmail: v.pipe(v.string(), v.trim(), v.email('Enter a valid email address')),
	customerPhone: v.pipe(
		v.string(),
		v.trim(),
		v.regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number')
	),
	allowedPaymentMethods: v.pipe(
		v.array(v.picklist(PAYMENT_LINK_ALLOWED_METHODS)),
		v.minLength(1, 'Select at least one payment method')
	),
	expiresBy: v.pipe(v.string(), v.trim(), v.minLength(1, 'Expiry is required'))
});

export const CreatePaymentLinkCustomerSchema = v.object({
	name: v.string(),
	email: v.string(),
	phoneNumber: v.string(),
	city: v.string(),
	country: v.string(),
	zipCode: v.string()
});

export const CreatePaymentLinkMerchantUrlSchema = v.object({
	cancelUrl: v.string(),
	failureUrl: v.string(),
	successUrl: v.string()
});

export const CreatePaymentLinkUpstreamRequestSchema = v.object({
	amount: v.string(),
	currency: v.literal('INR'),
	description: v.string(),
	referenceId: v.string(),
	allowedPaymentMethods: v.array(v.string()),
	expiresBy: v.string(),
	customer: CreatePaymentLinkCustomerSchema,
	merchantUrl: CreatePaymentLinkMerchantUrlSchema
});

export const CreatePaymentLinkCreatedSchema = v.object({
	amount: v.optional(v.nullable(StringishSchema), ''),
	checkoutUrl: v.pipe(v.string(), v.trim(), v.minLength(1)),
	clientOrderId: v.optional(v.nullable(StringishSchema), ''),
	message: v.optional(v.nullable(v.string()), ''),
	orderId: v.pipe(v.string(), v.trim(), v.minLength(1)),
	status: v.optional(v.nullable(v.string()), '')
});

export type CreatePaymentLinkClientRequest = v.InferOutput<
	typeof CreatePaymentLinkClientRequestSchema
>;
export type CreatePaymentLinkUpstreamRequest = v.InferOutput<
	typeof CreatePaymentLinkUpstreamRequestSchema
>;
export type CreatePaymentLinkCreated = v.InferOutput<typeof CreatePaymentLinkCreatedSchema>;
