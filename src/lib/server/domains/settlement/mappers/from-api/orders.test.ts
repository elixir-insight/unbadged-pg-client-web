import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { PaymentAttemptItemSchema } from '$lib/server/domains/payment-attempt/schema';
import { mapPaymentAttemptFeeBreakdown, mapSettlementOrderRow } from './orders';

describe('mapSettlementOrderRow', () => {
	it('maps payment attempt fields into settlement order table rows', () => {
		const row = mapSettlementOrderRow(
			v.parse(PaymentAttemptItemSchema, {
				payinAttemptId: 'PAT-1',
				orderId: 'ORD-1',
				clientDescription: 'Invoice #42',
				transactionAmount: '1000',
				transactionStatus: 'CAPTURED',
				paymentMethod: 'UPI',
				payerVpa: 'shopper@upi',
				processingFee: '10',
				gatewayFee: '5',
				gatewayGst: '2.7',
				partnerFee: '0',
				partnerGst: '0'
			})
		);

		expect(row.txnId).toBe('PAT-1');
		expect(row.orderId).toBe('ORD-1');
		expect(row.description).toBe('Invoice #42');
		expect(row.customer).toBe('shopper@upi');
		expect(row.paymentMethod).toBe('UPI');
		expect(row.status).toBe('success');
		expect(row.amount).toContain('1,000');
		expect(row.fee).toContain('17.7');
		expect(row.netAmount).toContain('982.3');
		expect(row.feeBreakdown).toEqual({
			processingFee: 15,
			gst: 2.7,
			totalFee: 17.7
		});
	});
});

describe('mapPaymentAttemptFeeBreakdown', () => {
	it('sums processing and GST components', () => {
		const breakdown = mapPaymentAttemptFeeBreakdown(
			v.parse(PaymentAttemptItemSchema, {
				payinAttemptId: 'PAT-2',
				transactionAmount: '500',
				transactionStatus: 'CAPTURED',
				processingFee: '4',
				gatewayFee: '1',
				gatewayGst: '0.9',
				partnerFee: '2',
				partnerGst: '0.36'
			})
		);

		expect(breakdown).toEqual({
			processingFee: 7,
			gst: 1.26,
			totalFee: 8.26
		});
	});
});
