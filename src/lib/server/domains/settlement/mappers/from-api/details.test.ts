import { describe, expect, it } from 'vitest';
import { mapSettlementDetailItem } from './details';

describe('mapSettlementDetailItem', () => {
	it('maps detail API fields into ledger rows', () => {
		const row = mapSettlementDetailItem({
			bankPipelineCode: 'UPI',
			createdAt: '2026-07-14T10:00:00.000Z',
			description: 'Sale capture',
			grossTransactionAmount: '1000',
			id: 'DET-1',
			netSettlementAmount: '950',
			orderId: 'ORD-1',
			orgId: 'ORG-1000',
			payinAttemptId: 'PAYIN-1',
			settlementDatetime: '2026-07-14T12:00:00.000Z',
			settlementId: 'STL-1',
			taxOnTdrAmount: '9',
			tdrAmount: '41',
			tdrFixedFee: '0',
			tdrPaidByMerchantPercent: '100',
			tdrPercent: '2'
		});

		expect(row).toEqual({
			transactionId: 'PAYIN-1',
			orderId: 'ORD-1',
			type: 'sale',
			grossAmount: 1000,
			tdrAmount: 50,
			netAmount: 950,
			paymentMode: 'UPI'
		});
	});

	it('infers refund type from negative net amount', () => {
		const row = mapSettlementDetailItem({
			bankPipelineCode: '',
			createdAt: '',
			description: '',
			grossTransactionAmount: '-100',
			id: 'DET-2',
			netSettlementAmount: '-100',
			orderId: 'ORD-2',
			orgId: '',
			payinAttemptId: '',
			settlementDatetime: '',
			settlementId: 'STL-1',
			taxOnTdrAmount: '0',
			tdrAmount: '0',
			tdrFixedFee: '0',
			tdrPaidByMerchantPercent: '',
			tdrPercent: ''
		});

		expect(row.type).toBe('refund');
		expect(row.transactionId).toBe('DET-2');
		expect(row.paymentMode).toBe('—');
	});
});
