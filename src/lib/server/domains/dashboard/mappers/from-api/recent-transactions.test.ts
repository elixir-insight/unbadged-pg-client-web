import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { PaymentAttemptItemSchema } from '../../../payment-attempt/schema';
import {
	mapPaymentAttemptApiStatus,
	mapRecentTransaction,
	mapRecentTransactions
} from './recent-transactions';

describe('mapRecentTransactions', () => {
	it('maps payment attempt statuses', () => {
		expect(mapPaymentAttemptApiStatus('CAPTURED')).toBe('success');
		expect(mapPaymentAttemptApiStatus('AUTHORIZED')).toBe('authorized');
		expect(mapPaymentAttemptApiStatus('REJECTED')).toBe('failed');
		expect(mapPaymentAttemptApiStatus('INITIATED')).toBe('pending');
	});

	it('maps a payment attempt into a dashboard transaction row', () => {
		const row = mapRecentTransaction(
			v.parse(PaymentAttemptItemSchema, {
				payinAttemptId: 'PAT-1',
				orderId: 'ORD-1',
				createdAt: '2026-07-21T10:00:00.000Z',
				transactionAmount: '4500.50',
				transactionStatus: 'CAPTURED',
				paymentMethod: 'UPI',
				payerVpa: 'user@upi',
				settlementId: 'STL-1'
			})
		);

		expect(row.txnId).toBe('PAT-1');
		expect(row.orderId).toBe('ORD-1');
		expect(row.customer).toBe('user@upi');
		expect(row.amount).toBe(4500.5);
		expect(row.method).toBe('UPI');
		expect(row.status).toBe('success');
		expect(row.settlement).toBe('Settled');
		expect(row.date).not.toBe('—');
	});

	it('marks successful unsettled payments as awaiting', () => {
		const [row] = mapRecentTransactions([
			v.parse(PaymentAttemptItemSchema, {
				payinAttemptId: 'PAT-2',
				transactionAmount: '100',
				transactionStatus: 'CAPTURED'
			})
		]);

		expect(row.settlement).toBe('Awaiting');
		expect(row.orderId).toBe('—');
		expect(row.customer).toBe('—');
	});
});
