import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS, PAYMENT_LINK_MERCHANT_URL } from './constants';
import { buildCreatePaymentLinkRequest } from './mappers/to-api/create';
import {
	CreatePaymentLinkClientRequestSchema,
	CreatePaymentLinkCreatedSchema,
	CreatePaymentLinkUpstreamRequestSchema
} from './schema';

const validClientBody = {
	amount: '1500.50',
	description: 'Workshop fee',
	referenceId: 'rcpt-1001',
	customerName: 'Test Customer',
	customerEmail: 'test.customer@example.com',
	customerPhone: '9999999999',
	allowedPaymentMethods: ['UPI', 'CARD'] as const,
	expiresBy: '2030-01-15T09:00:00.000Z'
};

describe('CreatePaymentLinkClientRequestSchema', () => {
	it('accepts a valid client body', () => {
		const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, validClientBody);
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
			phoneNumber: '9999999999',
			...PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS
		});
		expect(payload.merchantUrl).toEqual(PAYMENT_LINK_MERCHANT_URL);
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
