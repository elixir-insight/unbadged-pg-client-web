import { describe, expect, it } from 'vitest';
import {
	deriveFeesAmount,
	mapManagementSettlementListItem,
	mapSettlementApiStatus,
	mapSettlementApiStatusToManagement,
	mapSettlementListItem,
	mapSettlementListItemToDetail,
	mapUiStatusToApi,
	parseSettlementAmount
} from './list';

describe('parseSettlementAmount', () => {
	it('parses numeric strings', () => {
		expect(parseSettlementAmount('486230')).toBe(486230);
		expect(parseSettlementAmount('1,00,000')).toBe(100000);
	});

	it('returns null for empty or invalid values', () => {
		expect(parseSettlementAmount('')).toBeNull();
		expect(parseSettlementAmount('   ')).toBeNull();
		expect(parseSettlementAmount(null)).toBeNull();
		expect(parseSettlementAmount('n/a')).toBeNull();
	});
});

describe('deriveFeesAmount', () => {
	it('derives fees as gross minus net minus refunds and chargebacks', () => {
		expect(deriveFeesAmount('1000', '800', '50', '50')).toBe('₹100');
	});

	it('clamps negative fees to zero', () => {
		expect(deriveFeesAmount('100', '200', '0', '0')).toBe('₹0');
	});

	it('returns em dash when amounts are unparseable', () => {
		expect(deriveFeesAmount('n/a', '800', '0', '0')).toBe('—');
	});
});

describe('mapSettlementApiStatus', () => {
	it('maps API statuses to UI statuses', () => {
		expect(mapSettlementApiStatus('SETTLED')).toBe('settled');
		expect(mapSettlementApiStatus('PENDING')).toBe('processing');
		expect(mapSettlementApiStatus('FAILED')).toBe('failed');
		expect(mapSettlementApiStatus('unknown')).toBe('processing');
	});
});

describe('mapUiStatusToApi', () => {
	it('maps UI statuses to API statuses', () => {
		expect(mapUiStatusToApi('settled')).toBe('SETTLED');
		expect(mapUiStatusToApi('completed')).toBe('SETTLED');
		expect(mapUiStatusToApi('processing')).toBe('PENDING');
		expect(mapUiStatusToApi('failed')).toBe('FAILED');
		expect(mapUiStatusToApi(undefined)).toBeUndefined();
	});
});

describe('mapSettlementApiStatusToManagement', () => {
	it('maps API statuses to management UI statuses', () => {
		expect(mapSettlementApiStatusToManagement('SETTLED')).toBe('completed');
		expect(mapSettlementApiStatusToManagement('PENDING')).toBe('pending');
		expect(mapSettlementApiStatusToManagement('FAILED')).toBe('failed');
	});
});

describe('mapManagementSettlementListItem', () => {
	it('maps management list fields', () => {
		const row = mapManagementSettlementListItem({
			accountNumber: '1234',
			bankPipelineCode: '',
			bankReference: 'UTR1',
			chargebackAmount: '25',
			correctedAt: '',
			createdAt: '',
			description: '',
			destinationBank: 'HDFC',
			grossAmount: '10000',
			ifsc: '',
			legalCompanyName: 'Acme Retail',
			netSettledAmount: '9000',
			orgId: 'ORG-1000',
			pipelineSettlementId: '',
			refundAmount: '100',
			settlementDatetime: '2026-07-14T10:30:00.000Z',
			settlementId: 'STL-1',
			status: 'SETTLED'
		});

		expect(row.merchantId).toBe('ORG-1000');
		expect(row.merchantName).toBe('Acme Retail');
		expect(row.status).toBe('completed');
		expect(row.saleAmount).toBe(10000);
		expect(row.netPayout).toBe(9000);
		expect(row.deductions).toBe(1000);
	});
});

describe('mapSettlementListItem', () => {
	it('maps list item fields into display rows', () => {
		const row = mapSettlementListItem({
			accountNumber: '1234',
			bankPipelineCode: 'AXIS',
			bankReference: 'UTR2607010001',
			chargebackAmount: '25',
			correctedAt: '',
			createdAt: '2026-07-14T10:00:00.000Z',
			description: '',
			destinationBank: 'HDFC',
			grossAmount: '10000',
			ifsc: 'HDFC0001',
			legalCompanyName: 'Acme',
			netSettledAmount: '9000',
			orgId: '10050',
			pipelineSettlementId: 'PS-1',
			refundAmount: '100',
			settlementDatetime: '2026-07-14T10:30:00.000Z',
			settlementId: 'STL-20260714-0001',
			status: 'SETTLED'
		});

		expect(row).toEqual({
			id: 'STL-20260714-0001',
			utr: 'UTR2607010001',
			amount: '₹10,000',
			fees: '₹875',
			netAmount: '₹9,000',
			settledOn: expect.any(String),
			status: 'settled'
		});
		expect(row.settledOn).not.toBe('—');
	});

	it('treats empty bank reference as null UTR', () => {
		const row = mapSettlementListItem({
			accountNumber: '',
			bankPipelineCode: '',
			bankReference: '',
			chargebackAmount: '0',
			correctedAt: '',
			createdAt: '',
			description: '',
			destinationBank: '',
			grossAmount: '0',
			ifsc: '',
			legalCompanyName: '',
			netSettledAmount: '0',
			orgId: '',
			pipelineSettlementId: '',
			refundAmount: '0',
			settlementDatetime: '',
			settlementId: 'STL-1',
			status: 'PENDING'
		});

		expect(row.utr).toBeNull();
		expect(row.status).toBe('processing');
		expect(row.settledOn).toBe('—');
	});
});

describe('mapSettlementListItemToDetail', () => {
	it('maps list item into detail Settlement using settlementId', () => {
		const detail = mapSettlementListItemToDetail({
			accountNumber: '123456789012',
			bankPipelineCode: 'AXIS',
			bankReference: 'UTR1',
			chargebackAmount: '25',
			correctedAt: '',
			createdAt: '',
			description: '',
			destinationBank: 'HDFC Bank',
			grossAmount: '10000',
			ifsc: 'HDFC0001',
			legalCompanyName: 'Acme',
			netSettledAmount: '9000',
			orgId: '10050',
			pipelineSettlementId: 'PS-1',
			refundAmount: '100',
			settlementDatetime: '2026-07-14T10:30:00.000Z',
			settlementId: 'STL-20260714-0001',
			status: 'SETTLED'
		});

		expect(detail.id).toBe('STL-20260714-0001');
		expect(detail.utr).toBe('UTR1');
		expect(detail.status).toBe('settled');
		expect(detail.settledTo).toEqual({ bankName: 'HDFC Bank', accountLast4: '9012' });
		expect(detail.grossAmount).toBe(10000);
		expect(detail.netAmount).toBe(9000);
		expect(detail.refundsAndChargebacks).toBe(125);
		expect(detail.fees).toBe(875);
		expect(detail.orders).toEqual([]);
	});
});
