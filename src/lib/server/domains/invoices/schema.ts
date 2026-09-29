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

const OptionalStringishSchema = v.optional(v.nullable(StringishSchema), '');
const OptionalStringSchema = v.optional(v.nullable(v.string()), '');

export const InvoiceListItemSchema = v.object({
	id: OptionalStringishSchema,
	createdAt: OptionalStringishSchema,
	updatedAt: OptionalStringishSchema,
	createdAtIst: OptionalStringishSchema,
	clientOrderId: OptionalStringishSchema,
	orderId: OptionalStringishSchema,
	payinAttemptId: OptionalStringishSchema,
	transactionAmount: OptionalStringishSchema,
	description: OptionalStringishSchema,
	gatewayDescription: OptionalStringishSchema,
	bankPipelineCode: OptionalStringishSchema,
	pipelineClass: OptionalStringishSchema,
	customerPhoneNumber: OptionalStringishSchema,
	customerName: OptionalStringishSchema,
	customerEmail: OptionalStringishSchema,
	orgId: OptionalStringishSchema,
	virtualAccountNumber: OptionalStringishSchema,
	vaIdentifier: OptionalStringishSchema,
	status: OptionalStringishSchema,
	checkoutExpiry: OptionalStringishSchema,
	closedAt: OptionalStringishSchema,
	redirectUrl: v.optional(
		v.nullable(
			v.object({
				successUrl: OptionalStringSchema,
				cancelUrl: OptionalStringSchema,
				failureUrl: OptionalStringSchema
			})
		)
	),
	paymentLink: OptionalStringishSchema,
	requestIpAddress: OptionalStringishSchema,
	allowedPaymentMethods: v.optional(v.nullable(v.array(v.string())), []),
	invoice: v.optional(
		v.nullable(
			v.object({
				referenceId: OptionalStringishSchema,
				description: OptionalStringishSchema,
				merchantName: OptionalStringishSchema,
				gstNumber: OptionalStringishSchema,
				customerAddress: OptionalStringishSchema,
				customerCity: OptionalStringishSchema,
				customerCountry: OptionalStringishSchema,
				customerZipCode: OptionalStringishSchema,
				currency: OptionalStringishSchema,
				deliveryMethods: v.optional(v.nullable(v.array(v.string())), []),
				items: v.optional(
					v.nullable(
						v.array(
							v.object({
								itemName: OptionalStringishSchema,
								quantity: v.optional(v.nullable(v.number()), 0),
								price: OptionalStringishSchema,
								total: OptionalStringishSchema
							})
						)
					),
					[]
				)
			})
		)
	)
});

export const InvoicePaginationSchema = v.object({
	limit: v.number(),
	page: v.number(),
	total: v.number()
});

export const InvoiceListResponseSchema = v.object({
	data: v.array(InvoiceListItemSchema),
	message: v.optional(v.nullable(v.string()), ''),
	pagination: v.optional(InvoicePaginationSchema),
	statusCode: v.optional(v.nullable(v.number()), 200)
});

const CountSchema = v.optional(v.nullable(v.number()), 0);

export const InvoiceCountsSchema = v.object({
	totalCount: CountSchema,
	createdCount: CountSchema,
	initiatedCount: CountSchema,
	authorizedCount: CountSchema,
	capturedCount: CountSchema,
	failedCount: CountSchema,
	rejectedCount: CountSchema,
	suspectedCount: CountSchema,
	cancelledCount: CountSchema,
	expiredCount: CountSchema
});

export const InvoiceCountsResponseSchema = v.object({
	data: v.array(InvoiceCountsSchema),
	message: v.optional(v.nullable(v.string()), ''),
	statusCode: v.optional(v.nullable(v.number()), 200)
});

export type CreateInvoiceClientRequest = v.InferOutput<typeof CreateInvoiceClientRequestSchema>;
export type CreateInvoiceUpstreamRequest = v.InferOutput<typeof CreateInvoiceUpstreamRequestSchema>;
export type CreateInvoiceCreated = v.InferOutput<typeof CreateInvoiceCreatedSchema>;
export type InvoiceListItem = v.InferOutput<typeof InvoiceListItemSchema>;
export type InvoicePagination = v.InferOutput<typeof InvoicePaginationSchema>;
export type InvoiceListResponse = v.InferOutput<typeof InvoiceListResponseSchema>;
export type InvoiceApiCounts = v.InferOutput<typeof InvoiceCountsSchema>;
export type InvoiceCountsResponse = v.InferOutput<typeof InvoiceCountsResponseSchema>;
