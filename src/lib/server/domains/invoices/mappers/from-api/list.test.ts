import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	InvoiceCountsResponseSchema,
	InvoiceListItemSchema,
	InvoiceListResponseSchema
} from '../../schema';
import {
	mapInvoiceCardCounts,
	mapInvoiceListItem,
	mapInvoiceListResponse,
	mapInvoiceStatus,
	mapInvoiceUiStatus
} from './list';

const liveListItem = {
	id: '1436',
	createdAt: '2026-09-29T12:44:28.969794+05:30',
	updatedAt: '',
	createdAtIst: '2026-09-29T12:44:28.969794Z',
	clientOrderId: 'inv_kMTFxoVfXcZdr6',
	orderId: 'ORD_H2TVXHOHU8',
	payinAttemptId: 'PAT_0',
	transactionAmount: '10',
	description: 'water',
	gatewayDescription: '',
	bankPipelineCode: 'TEST',
	pipelineClass: 'FACILITATED',
	customerPhoneNumber: '+917891734936',
	customerName: 'sabari',
	customerEmail: 'sabarivasan522@gmail.com',
	orgId: 'ORG_2bV',
	virtualAccountNumber: 'TEST202610013919',
	vaIdentifier: '202610013919',
	status: 'CREATED',
	checkoutExpiry: '2099-10-13T23:59:00+05:30',
	closedAt: '',
	redirectUrl: {
		successUrl: 'https://dev-checkout.elixirpay.in/',
		cancelUrl: 'https://dev-checkout.elixirpay.in/',
		failureUrl: 'https://dev-checkout.elixirpay.in/'
	},
	paymentLink: 'http://localhost:8080/ORD_H2TVXHOHU8',
	requestIpAddress: '106.51.59.68',
	allowedPaymentMethods: ['UPI', 'CARD'],
	invoice: {
		referenceId: 'inv_kMTFxoVfXcZdr6',
		description: 'water',
		merchantName: 'Elixir global',
		gstNumber: '29ABCDE1234F1Z5',
		customerAddress: '13\nBose Road, Aranmanai Vaasal',
		customerCity: 'Bengaluru',
		customerCountry: 'IN',
		customerZipCode: '560001',
		currency: 'INR',
		deliveryMethods: ['EMAIL', 'SMS'],
		items: [
			{
				itemName: 'water',
				quantity: 1,
				price: '10.00',
				total: '10.00'
			}
		]
	}
};

describe('InvoiceListResponseSchema', () => {
	it('parses the live list response shape', () => {
		const parsed = v.safeParse(InvoiceListResponseSchema, {
			data: [liveListItem],
			pagination: { total: 1, page: 0, limit: 10 },
			message: 'Successfully fetched invoice payments',
			statusCode: 200
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.data).toHaveLength(1);
			expect(parsed.output.data[0]?.orderId).toBe('ORD_H2TVXHOHU8');
			expect(parsed.output.pagination?.total).toBe(1);
		}
	});

	it('accepts numeric transaction amounts and missing invoice payload', () => {
		const parsed = v.safeParse(InvoiceListItemSchema, {
			orderId: 'ORD_ABC',
			clientOrderId: 'inv_abc',
			transactionAmount: 2500,
			status: 'CAPTURED',
			paymentLink: 'https://example.com/pay'
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.transactionAmount).toBe('2500');
		}
	});
});

describe('mapInvoiceListItem', () => {
	it('maps API fields onto the invoice row', () => {
		const item = v.parse(InvoiceListItemSchema, liveListItem);
		const row = mapInvoiceListItem(item);

		expect(row).toMatchObject({
			id: 'inv_kMTFxoVfXcZdr6',
			invoiceNumber: 'inv_kMTFxoVfXcZdr6',
			amount: 10,
			description: 'water',
			status: 'issued',
			receiptNo: 'inv_kMTFxoVfXcZdr6',
			customerName: 'sabari',
			customerEmail: 'sabarivasan522@gmail.com',
			customerPhone: '+917891734936',
			paymentLinkUrl: 'http://localhost:8080/ORD_H2TVXHOHU8',
			notifyEmail: true,
			notifySms: true,
			transactionId: null,
			createdBy: 'Elixir global'
		});
		expect(row?.items).toEqual([
			{
				id: 'item_1',
				name: 'water',
				description: '',
				amount: 10,
				quantity: 1,
				taxPercent: 0
			}
		]);
		expect(row?.createdAtMs).toBe(Date.parse('2026-09-29T12:44:28.969794+05:30'));
	});

	it('drops rows without client or order id', () => {
		const item = v.parse(InvoiceListItemSchema, { transactionAmount: '10' });
		expect(mapInvoiceListItem(item)).toBeNull();
	});

	it('maps captured status and attempt id', () => {
		const item = v.parse(InvoiceListItemSchema, {
			...liveListItem,
			status: 'CAPTURED',
			payinAttemptId: 'PAT_99',
			transactionAmount: '2000'
		});
		const row = mapInvoiceListItem(item);
		expect(row?.status).toBe('paid');
		expect(row?.transactionId).toBe('PAT_99');
		expect(row?.amount).toBe(2000);
	});
});

describe('mapInvoiceListResponse', () => {
	it('skips items that cannot be mapped', () => {
		const rows = mapInvoiceListResponse([
			v.parse(InvoiceListItemSchema, liveListItem),
			v.parse(InvoiceListItemSchema, { transactionAmount: '10' })
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.id).toBe('inv_kMTFxoVfXcZdr6');
	});
});

describe('mapInvoiceUiStatus', () => {
	it('maps UI status filters to API statuses', () => {
		expect(mapInvoiceUiStatus('issued')).toBe('CREATED');
		expect(mapInvoiceUiStatus('attempted')).toBe('ATTEMPTED');
		expect(mapInvoiceUiStatus('overdue')).toBe('CREATED');
		expect(mapInvoiceUiStatus('paid')).toBe('CAPTURED');
		expect(mapInvoiceUiStatus(undefined)).toBeUndefined();
		expect(mapInvoiceUiStatus('unknown')).toBeUndefined();
	});
});

describe('mapInvoiceStatus', () => {
	it('marks created invoices past expiry as overdue', () => {
		expect(mapInvoiceStatus('CREATED', '2020-01-01T00:00:00+05:30')).toBe('overdue');
		expect(mapInvoiceStatus('CREATED', '2099-01-01T00:00:00+05:30')).toBe('issued');
	});
});

describe('mapInvoiceCardCounts', () => {
	it('maps API counts onto the dashboard cards', () => {
		expect(
			mapInvoiceCardCounts({
				totalCount: 10,
				createdCount: 3,
				initiatedCount: 1,
				authorizedCount: 1,
				capturedCount: 2,
				failedCount: 1,
				rejectedCount: 0,
				suspectedCount: 0,
				cancelledCount: 1,
				expiredCount: 1
			})
		).toEqual({
			All: 10,
			Issued: 3,
			Attempted: 2,
			Overdue: 0,
			Paid: 2,
			Cancelled: 1,
			Expired: 1
		});
	});

	it('parses the live counts response', () => {
		const parsed = v.safeParse(InvoiceCountsResponseSchema, {
			data: [
				{
					totalCount: 3,
					createdCount: 3,
					initiatedCount: 0,
					authorizedCount: 0,
					capturedCount: 0,
					failedCount: 0,
					rejectedCount: 0,
					suspectedCount: 0,
					cancelledCount: 0,
					expiredCount: 0
				}
			],
			message: 'Successfully fetched invoice payments counts',
			statusCode: 200
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			const apiCounts = parsed.output.data[0];
			expect(apiCounts).toBeDefined();
			if (!apiCounts) return;
			expect(mapInvoiceCardCounts(apiCounts)).toEqual({
				All: 3,
				Issued: 3,
				Attempted: 0,
				Overdue: 0,
				Paid: 0,
				Cancelled: 0,
				Expired: 0
			});
		}
	});
});
