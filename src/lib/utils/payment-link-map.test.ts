import { describe, expect, it } from 'vitest';
import {
	isPaymentLinkCancellable,
	mapCreatedPaymentLink,
	mapPaymentLinkStatus
} from './payment-link-map';

describe('mapPaymentLinkStatus', () => {
	it('maps known API statuses onto payment link statuses', () => {
		expect(mapPaymentLinkStatus('CREATED')).toBe('issued');
		expect(mapPaymentLinkStatus('ATTEMPTED')).toBe('attempted');
		expect(mapPaymentLinkStatus('CAPTURED')).toBe('paid');
		expect(mapPaymentLinkStatus('paid')).toBe('paid');
		expect(mapPaymentLinkStatus('canceled')).toBe('cancelled');
		expect(mapPaymentLinkStatus('unknown')).toBe('issued');
	});
});

describe('isPaymentLinkCancellable', () => {
	it('allows issued and attempted links', () => {
		expect(isPaymentLinkCancellable('issued')).toBe(true);
		expect(isPaymentLinkCancellable('attempted')).toBe(true);
	});

	it('blocks paid, cancelled, expired, and partially paid links', () => {
		expect(isPaymentLinkCancellable('paid')).toBe(false);
		expect(isPaymentLinkCancellable('cancelled')).toBe(false);
		expect(isPaymentLinkCancellable('expired')).toBe(false);
		expect(isPaymentLinkCancellable('partially_paid')).toBe(false);
	});
});

describe('mapCreatedPaymentLink', () => {
	it('maps a 201 create response onto the list row shape', () => {
		const link = mapCreatedPaymentLink({
			response: {
				amount: '2500',
				checkoutUrl: 'https://dev-checkout.elixirpay.in/pl_abc',
				clientOrderId: 'rcpt-1001',
				message: 'Success',
				orderId: 'ord_123',
				status: 'CREATED'
			},
			paymentFor: 'Workshop fee',
			receipt: 'rcpt-1001',
			expiresBy: '2030-01-15T09:00:00.000Z',
			createdBy: 'Test Merchant'
		});

		expect(link.id).toBe('ord_123');
		expect(link.paymentLinkUrl).toBe('https://dev-checkout.elixirpay.in/pl_abc');
		expect(link.amount).toBe(2500);
		expect(link.status).toBe('issued');
		expect(link.receiptNo).toBe('rcpt-1001');
		expect(link.paymentFor).toBe('Workshop fee');
		expect(link.expiresOn).toBe('2030-01-15T09:00:00.000Z');
	});

	it('uses the submitted receipt when clientOrderId is empty', () => {
		const link = mapCreatedPaymentLink({
			response: {
				amount: '100',
				checkoutUrl: 'https://dev-checkout.elixirpay.in/pl_abc',
				clientOrderId: '',
				message: 'Success',
				orderId: 'ord_124',
				status: 'issued'
			},
			paymentFor: 'Consultation',
			receipt: 'rcpt-fallback',
			expiresBy: null,
			createdBy: 'Test Merchant'
		});

		expect(link.receiptNo).toBe('rcpt-fallback');
		expect(link.expiresOn).toBeNull();
	});
});
