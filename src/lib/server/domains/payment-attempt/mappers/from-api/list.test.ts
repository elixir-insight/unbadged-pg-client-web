import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { PaymentAttemptItemSchema, PaymentRefundItemSchema } from '../../schema';
import {
	mapPaymentAttemptApiStatus,
	mapPaymentAttemptCardCounts,
	mapPaymentAttemptListItem,
	mapPaymentAttemptUiStatus,
	mapPaymentRefund,
	mapRelatedPaymentAttempts
} from './list';

describe('payment attempt mappers', () => {
	it('maps transaction statuses into UI statuses', () => {
		expect(mapPaymentAttemptApiStatus('CAPTURED')).toBe('success');
		expect(mapPaymentAttemptApiStatus('AUTHORIZED')).toBe('authorized');
		expect(mapPaymentAttemptApiStatus('REJECTED')).toBe('failed');
		expect(mapPaymentAttemptApiStatus('INITIATED')).toBe('pending');
	});

	it('maps UI status filters to API statuses', () => {
		expect(mapPaymentAttemptUiStatus('success')).toBe('CAPTURED');
		expect(mapPaymentAttemptUiStatus('pending')).toContain('AUTHORIZED');
		expect(mapPaymentAttemptUiStatus('refunded')).toBeUndefined();
	});

	it('maps a payment attempt into a table row', () => {
		const row = mapPaymentAttemptListItem(
			v.parse(PaymentAttemptItemSchema, {
				payinAttemptId: 'PAT-1',
				orderId: 'ORD-1',
				createdAt: '2026-07-21T10:00:00.000Z',
				transactionAmount: '4500',
				transactionStatus: 'CAPTURED',
				paymentMethod: 'UPI',
				paymentChannel: 'UPI_COLLECT'
			})
		);

		expect(row.txnId).toBe('PAT-1');
		expect(row.orderId).toBe('ORD-1');
		expect(row.amount).toContain('4,500');
		expect(row.status).toBe('success');
	});

	it('maps order attempts for the related payments table', () => {
		const payments = mapRelatedPaymentAttempts([
			v.parse(PaymentAttemptItemSchema, {
				payinAttemptId: 'PAT-1',
				transactionAmount: '4500',
				transactionStatus: 'CAPTURED',
				paymentMethod: 'UPI'
			})
		]);

		expect(payments).toEqual([
			{
				txnId: 'PAT-1',
				attemptNumber: 1,
				paymentMethod: 'UPI',
				paymentStatus: 'success'
			}
		]);
	});

	it('aggregates status and refund counts for cards', () => {
		expect(
			mapPaymentAttemptCardCounts({
				authorizedCount: 2,
				cancelledCount: 3,
				capturedCount: 4,
				createdCount: 5,
				expiredCount: 6,
				failedCount: 7,
				initiatedCount: 8,
				refundInitiatedCount: 9,
				rejectedCount: 10,
				suspectedCount: 11,
				totalCount: 75
			})
		).toEqual({
			Payments: 75,
			Successful: 4,
			Pending: 26,
			Refunds: 9,
			Failed: 26
		});
	});

	it('maps refund records for the existing refund table', () => {
		const refund = mapPaymentRefund(
			v.parse(PaymentRefundItemSchema, {
				payinAttemptId: 'PAT-1',
				refundId: 'REF-1',
				refundAmount: '250',
				refundStatus: 'COMPLETED',
				refundType: 'PARTIAL',
				refundReason: 'Customer request'
			})
		);

		expect(refund.refundId).toBe('REF-1');
		expect(refund.refundAmount).toContain('250');
		expect(refund.refundStatus).toBe('completed');
		expect(refund.refundType).toBe('partial');
	});
});
