import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS, PAYMENT_LINK_MERCHANT_URL } from './constants';
import { buildCreatePaymentLinkRequest } from './mappers/to-api/create';
import {
	CancelPaymentLinkResponseSchema,
	CreatePaymentLinkClientRequestSchema,
	CreatePaymentLinkCreatedSchema,
	CreatePaymentLinkUpstreamRequestSchema,
	PaymentLinkCountsResponseSchema,
	PaymentLinkListResponseSchema
} from './schema';

const validClientBody = {
	amount: '1500.50',
	description: 'Workshop fee',
	referenceId: 'rcpt-1001',
	customerName: 'Test Customer',
	customerEmail: 'test.customer@example.com',
	customerPhone: '9999999999',
	allowedPaymentMethods: ['UPI', 'CARD'] as const,
	deliveryMethods: ['EMAIL', 'SMS'] as const,
	expiresBy: '2030-01-15T09:00:00.000Z'
};

describe('CreatePaymentLinkClientRequestSchema', () => {
	it('accepts a valid client body', () => {
		const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, validClientBody);
		expect(parsed.success).toBe(true);
	});

	it('accepts an E.164 Indian phone number', () => {
		const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, {
			...validClientBody,
			customerPhone: '+919999999999'
		});
		expect(parsed.success).toBe(true);
	});

	it('requires receipt, amount, and at least one payment method', () => {
		const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, {
			amount: '',
			description: 'Workshop fee',
			referenceId: '',
			allowedPaymentMethods: []
		});
		expect(parsed.success).toBe(false);
	});

	it('rejects unknown payment methods', () => {
		const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, {
			...validClientBody,
			allowedPaymentMethods: ['WALLET']
		});
		expect(parsed.success).toBe(false);
	});

	it('defaults delivery methods to empty when omitted', () => {
		const withoutDelivery = {
			amount: validClientBody.amount,
			description: validClientBody.description,
			referenceId: validClientBody.referenceId,
			customerName: validClientBody.customerName,
			customerEmail: validClientBody.customerEmail,
			customerPhone: validClientBody.customerPhone,
			allowedPaymentMethods: validClientBody.allowedPaymentMethods,
			expiresBy: validClientBody.expiresBy
		};
		const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, withoutDelivery);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.deliveryMethods).toEqual([]);
		}
	});

	it('rejects unknown delivery methods', () => {
		const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, {
			...validClientBody,
			deliveryMethods: ['WHATSAPP']
		});
		expect(parsed.success).toBe(false);
	});
});

describe('buildCreatePaymentLinkRequest', () => {
	it('attaches form customer details with dummy address, INR, and merchant callback URLs', () => {
		const parsed = v.parse(CreatePaymentLinkClientRequestSchema, validClientBody);
		const payload = buildCreatePaymentLinkRequest(parsed);

		expect(v.safeParse(CreatePaymentLinkUpstreamRequestSchema, payload).success).toBe(true);
		expect(payload.currency).toBe('INR');
		expect(payload.referenceId).toBe('rcpt-1001');
		expect(payload.expiresBy).toBe('2030-01-15T09:00:00.000Z');
		expect(payload.customer).toEqual({
			name: 'Test Customer',
			email: 'test.customer@example.com',
			phoneNumber: '+919999999999',
			...PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS
		});
		expect(payload.merchantUrl).toEqual(PAYMENT_LINK_MERCHANT_URL);
		expect(payload.deliveryMethods).toEqual(['EMAIL', 'SMS']);
	});

	it('sends an empty delivery methods list when none are selected', () => {
		const parsed = v.parse(CreatePaymentLinkClientRequestSchema, {
			...validClientBody,
			deliveryMethods: []
		});
		const payload = buildCreatePaymentLinkRequest(parsed);
		expect(payload.deliveryMethods).toEqual([]);
	});

	it('requires expiry', () => {
		const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, {
			...validClientBody,
			expiresBy: undefined
		});
		expect(parsed.success).toBe(false);
	});
});

describe('CreatePaymentLinkCreatedSchema', () => {
	it('parses the documented 201 response', () => {
		const parsed = v.safeParse(CreatePaymentLinkCreatedSchema, {
			amount: '1500.50',
			checkoutUrl: 'https://dev-checkout.elixirpay.in/pl_abc',
			clientOrderId: 'rcpt-1001',
			message: 'Success',
			orderId: 'ord_123',
			status: 'CREATED'
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.checkoutUrl).toBe('https://dev-checkout.elixirpay.in/pl_abc');
			expect(parsed.output.orderId).toBe('ord_123');
		}
	});
});

describe('PaymentLinkListResponseSchema', () => {
	it('parses the documented 200 list response', () => {
		const parsed = v.safeParse(PaymentLinkListResponseSchema, {
			data: [
				{
					Expiry: '2030-01-15T09:00:00.000Z',
					allowedPaymentMethods: ['UPI'],
					amount: '1500.50',
					attemptId: 'att_1',
					closedAt: '',
					createdAt: '2026-08-01T10:00:00.000Z',
					customer: {
						city: 'Bengaluru',
						country: 'IN',
						email: 'customer@example.com',
						name: 'Test Customer',
						phoneNumber: '9999999999',
						zipCode: '560001'
					},
					description: 'Workshop fee',
					gatewayDescription: '',
					merchantUrl: {
						cancelUrl: 'https://example.com/cancel',
						failureUrl: 'https://example.com/failure',
						successUrl: 'https://example.com/success'
					},
					orderId: 'ord_123',
					paymentLink: 'https://dev-checkout.elixirpay.in/pl_abc',
					referenceId: 'rcpt-1001',
					sourceType: 'PAYMENT_LINK',
					status: 'CREATED',
					updatedAt: '2026-08-01T10:00:00.000Z',
					virtualAccountNumber: 'VA123'
				}
			],
			message: 'Payment link orders retrieved successfully',
			pagination: { limit: 10, page: 0, total: 1 },
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.data[0]?.orderId).toBe('ord_123');
			expect(parsed.output.pagination?.total).toBe(1);
		}
	});
});

describe('PaymentLinkCountsResponseSchema', () => {
	it('parses the documented 200 counts response', () => {
		const parsed = v.safeParse(PaymentLinkCountsResponseSchema, {
			data: [
				{
					attempted: 2,
					cancelled: 1,
					captured: 4,
					created: 3,
					expired: 1,
					suspected: 0
				}
			],
			message: 'Payment link status counts retrieved successfully',
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.data[0]?.created).toBe(3);
			expect(parsed.output.data[0]?.captured).toBe(4);
		}
	});
});

describe('CancelPaymentLinkResponseSchema', () => {
	it('parses the documented cancel envelope', () => {
		const parsed = v.safeParse(CancelPaymentLinkResponseSchema, {
			data: {
				amount: '1500.50',
				clientOrderId: 'rcpt-1001',
				message: 'Payment link cancelled successfully',
				orderId: 'ORD_GGZII3IT0K',
				status: 'CANCELLED'
			},
			message: 'Payment link cancelled successfully',
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.data.orderId).toBe('ORD_GGZII3IT0K');
			expect(parsed.output.data.status).toBe('CANCELLED');
			expect(parsed.output.data.amount).toBe('1500.50');
			expect(parsed.output.message).toBe('Payment link cancelled successfully');
		}
	});

	it('coerces a numeric amount to a string', () => {
		const parsed = v.safeParse(CancelPaymentLinkResponseSchema, {
			data: {
				amount: 1500.5,
				clientOrderId: 'rcpt-1001',
				message: 'Cancelled',
				orderId: 'ORD_GGZII3IT0K',
				status: 'CANCELLED'
			},
			message: 'Cancelled',
			statusCode: 0
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.data.amount).toBe('1500.5');
		}
	});

	it('rejects a response without an orderId', () => {
		const parsed = v.safeParse(CancelPaymentLinkResponseSchema, {
			data: {
				amount: '1500.50',
				clientOrderId: 'rcpt-1001',
				message: 'Cancelled',
				status: 'CANCELLED'
			},
			message: 'Cancelled',
			statusCode: 200
		});

		expect(parsed.success).toBe(false);
	});
});
