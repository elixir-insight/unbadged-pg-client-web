import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	PaymentLinkCountsResponseSchema,
	PaymentLinkListItemSchema,
	PaymentLinkListResponseSchema
} from '../../schema';
import {
	mapPaymentLinkCardCounts,
	mapPaymentLinkListItem,
	mapPaymentLinkListResponse,
	mapPaymentLinkUiStatus
} from './list';

const swaggerListItem = {
	Expiry: '2030-01-15T09:00:00.000Z',
	allowedPaymentMethods: ['UPI', 'CARD'],
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
};

describe('PaymentLinkListResponseSchema', () => {
	it('parses the documented list response', () => {
		const parsed = v.safeParse(PaymentLinkListResponseSchema, {
			data: [swaggerListItem],
			message: 'Payment link orders retrieved successfully',
			pagination: { limit: 10, page: 0, total: 1 },
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.data).toHaveLength(1);
			expect(parsed.output.data[0]?.orderId).toBe('ord_123');
			expect(parsed.output.pagination?.total).toBe(1);
		}
	});

	it('accepts a lowercase expiry field and a missing customer', () => {
		const parsed = v.safeParse(PaymentLinkListItemSchema, {
			expiry: '2030-01-15T09:00:00.000Z',
			amount: 2500,
			orderId: 'ord_124',
			paymentLink: 'https://dev-checkout.elixirpay.in/pl_def',
			status: 'PAID'
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.expiry).toBe('2030-01-15T09:00:00.000Z');
			expect(parsed.output.amount).toBe('2500');
		}
	});
});

describe('mapPaymentLinkListItem', () => {
	it('maps API fields onto the payment link row', () => {
		const item = v.parse(PaymentLinkListItemSchema, swaggerListItem);
		const row = mapPaymentLinkListItem(item);

		expect(row).toMatchObject({
			id: 'ord_123',
			amount: 1500.5,
			paymentFor: 'Workshop fee',
			paymentLinkUrl: 'https://dev-checkout.elixirpay.in/pl_abc',
			status: 'issued',
			receiptNo: 'rcpt-1001',
			expiresOn: '2030-01-15T09:00:00.000Z',
			customerEmail: 'customer@example.com',
			customerPhone: '9999999999',
			transactionId: 'att_1'
		});
		expect(row?.createdAtMs).toBe(Date.parse('2026-08-01T10:00:00.000Z'));
	});

	it('drops rows without an order id', () => {
		const item = v.parse(PaymentLinkListItemSchema, { amount: '10' });
		expect(mapPaymentLinkListItem(item)).toBeNull();
	});

	it('maps paid status and amount paid', () => {
		const item = v.parse(PaymentLinkListItemSchema, {
			...swaggerListItem,
			status: 'PAID',
			amount: '2000'
		});
		const row = mapPaymentLinkListItem(item);
		expect(row?.status).toBe('paid');
		expect(row?.amountPaid).toBe(2000);
	});
});

describe('mapPaymentLinkListResponse', () => {
	it('skips items that cannot be mapped', () => {
		const rows = mapPaymentLinkListResponse([
			v.parse(PaymentLinkListItemSchema, swaggerListItem),
			v.parse(PaymentLinkListItemSchema, { amount: '10' })
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.id).toBe('ord_123');
	});
});

describe('mapPaymentLinkUiStatus', () => {
	it('maps UI status filters to comma-separated API statuses', () => {
		expect(mapPaymentLinkUiStatus('issued')).toBe('CREATED');
		expect(mapPaymentLinkUiStatus('attempted')).toBe('ATTEMPTED');
		expect(mapPaymentLinkUiStatus('partially_paid')).toBeUndefined();
		expect(mapPaymentLinkUiStatus('paid')).toBe('CAPTURED');
		expect(mapPaymentLinkUiStatus(undefined)).toBeUndefined();
		expect(mapPaymentLinkUiStatus('unknown')).toBeUndefined();
	});
});

describe('mapPaymentLinkCardCounts', () => {
	it('maps API counts onto the dashboard cards', () => {
		expect(
			mapPaymentLinkCardCounts({
				attempted: 2,
				cancelled: 1,
				captured: 4,
				created: 3,
				expired: 1,
				suspected: 5
			})
		).toEqual({
			All: 16,
			Issued: 3,
			Attempted: 2,
			Paid: 4,
			Cancelled: 1,
			Expired: 1
		});
	});

	it('parses the documented counts response', () => {
		const parsed = v.safeParse(PaymentLinkCountsResponseSchema, {
			data: [
				{
					attempted: 8,
					cancelled: 0,
					captured: 0,
					created: 4,
					expired: 0,
					suspected: 0
				}
			],
			message: 'Payment link status counts retrieved successfully',
			statusCode: 200
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			const apiCounts = parsed.output.data[0];
			expect(apiCounts).toBeDefined();
			if (!apiCounts) return;
			expect(mapPaymentLinkCardCounts(apiCounts)).toEqual({
				All: 12,
				Issued: 4,
				Attempted: 8,
				Paid: 0,
				Cancelled: 0,
				Expired: 0
			});
		}
	});
});
