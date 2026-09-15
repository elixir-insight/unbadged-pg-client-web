import * as v from 'valibot';
import {
	PAYMENT_LINK_ALLOWED_METHODS,
	PAYMENT_LINK_DELIVERY_METHODS
} from '$lib/types/payment-link';

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
		v.regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit phone number')
	),
	allowedPaymentMethods: v.pipe(
		v.array(v.picklist(PAYMENT_LINK_ALLOWED_METHODS)),
		v.minLength(1, 'Select at least one payment method')
	),
	deliveryMethods: v.optional(v.array(v.picklist(PAYMENT_LINK_DELIVERY_METHODS)), []),
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
	deliveryMethods: v.optional(v.array(v.string()), []),
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

const OptionalStringishSchema = v.optional(v.nullable(StringishSchema), '');
const OptionalStringSchema = v.optional(v.nullable(v.string()), '');

export const PaymentLinkListCustomerSchema = v.object({
	city: OptionalStringishSchema,
	country: OptionalStringishSchema,
	email: OptionalStringishSchema,
	name: OptionalStringishSchema,
	phoneNumber: OptionalStringishSchema,
	zipCode: OptionalStringishSchema
});

export const PaymentLinkListMerchantUrlSchema = v.object({
	cancelUrl: OptionalStringSchema,
	failureUrl: OptionalStringSchema,
	successUrl: OptionalStringSchema
});

export const PaymentLinkListItemSchema = v.object({
	Expiry: OptionalStringishSchema,
	expiry: OptionalStringishSchema,
	allowedPaymentMethods: v.optional(v.nullable(v.array(v.string())), []),
	amount: OptionalStringishSchema,
	attemptId: OptionalStringishSchema,
	closedAt: OptionalStringishSchema,
	createdAt: OptionalStringishSchema,
	customer: v.optional(v.nullable(PaymentLinkListCustomerSchema)),
	description: OptionalStringishSchema,
	gatewayDescription: OptionalStringishSchema,
	merchantUrl: v.optional(v.nullable(PaymentLinkListMerchantUrlSchema)),
	orderId: OptionalStringishSchema,
	paymentLink: OptionalStringishSchema,
	referenceId: OptionalStringishSchema,
	sourceType: OptionalStringishSchema,
	status: OptionalStringishSchema,
	updatedAt: OptionalStringishSchema,
	virtualAccountNumber: OptionalStringishSchema
});

export const PaymentLinkPaginationSchema = v.object({
	limit: v.number(),
	page: v.number(),
	total: v.number()
});

export const PaymentLinkListResponseSchema = v.object({
	data: v.array(PaymentLinkListItemSchema),
	message: v.optional(v.nullable(v.string()), ''),
	pagination: v.optional(PaymentLinkPaginationSchema),
	statusCode: v.optional(v.nullable(v.number()), 200)
});

const CountSchema = v.optional(v.nullable(v.number()), 0);

export const PaymentLinkCountsSchema = v.object({
	attempted: CountSchema,
	cancelled: CountSchema,
	captured: CountSchema,
	created: CountSchema,
	expired: CountSchema,
	suspected: CountSchema
});

export const PaymentLinkCountsResponseSchema = v.object({
	data: v.array(PaymentLinkCountsSchema),
	message: v.optional(v.nullable(v.string()), ''),
	statusCode: v.optional(v.nullable(v.number()), 200)
});

export type CreatePaymentLinkClientRequest = v.InferOutput<
	typeof CreatePaymentLinkClientRequestSchema
>;
export type CreatePaymentLinkUpstreamRequest = v.InferOutput<
	typeof CreatePaymentLinkUpstreamRequestSchema
>;
export type CreatePaymentLinkCreated = v.InferOutput<typeof CreatePaymentLinkCreatedSchema>;
export type PaymentLinkListItem = v.InferOutput<typeof PaymentLinkListItemSchema>;
export type PaymentLinkPagination = v.InferOutput<typeof PaymentLinkPaginationSchema>;
export type PaymentLinkListResponse = v.InferOutput<typeof PaymentLinkListResponseSchema>;
export type PaymentLinkApiCounts = v.InferOutput<typeof PaymentLinkCountsSchema>;
export type PaymentLinkCountsResponse = v.InferOutput<typeof PaymentLinkCountsResponseSchema>;
