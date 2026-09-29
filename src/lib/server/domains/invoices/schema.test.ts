import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	INVOICE_DUMMY_CUSTOMER_ADDRESS,
	INVOICE_DUMMY_CUSTOMER_ADDRESS_LINE,
	INVOICE_MERCHANT_URL
} from './constants';
import { buildCreateInvoiceRequest } from './mappers/to-api/create';
import {
	CreateInvoiceClientRequestSchema,
	CreateInvoiceCreatedSchema,
	CreateInvoiceUpstreamRequestSchema
} from './schema';

const validClientBody = {
	amount: '2000.00',
	description: 'Monthly consulting retainer',
	referenceId: 'inv_TeyCvL2N0eDw3A',
	customerName: 'Test Customer',
	customerEmail: 'test.customer@example.com',
	customerPhone: '9999999999',
	allowedPaymentMethods: ['UPI', 'CARD'] as const,
	deliveryMethods: ['EMAIL', 'SMS'] as const,
	expiresBy: '2030-01-15T18:29:00.000Z',
	items: [
		{
			itemName: 'Consulting',
			price: '2000.00',
			quantity: 1,
			total: '2000.00'
		}
	],
	merchantName: 'ElixirPay',
	gstNumber: '29AABCU9603R1ZM',
	customerAddress: ''
};

describe('CreateInvoiceClientRequestSchema', () => {
	it('accepts a valid client body', () => {
		const parsed = v.safeParse(CreateInvoiceClientRequestSchema, validClientBody);
		expect(parsed.success).toBe(true);
	});

	it('accepts an E.164 Indian phone number', () => {
		const parsed = v.safeParse(CreateInvoiceClientRequestSchema, {
			...validClientBody,
			customerPhone: '+919999999999'
		});
		expect(parsed.success).toBe(true);
	});

	it('requires invoice id, amount, items, and at least one payment method', () => {
		const parsed = v.safeParse(CreateInvoiceClientRequestSchema, {
			amount: '',
			description: 'Monthly consulting retainer',
			referenceId: '',
			allowedPaymentMethods: [],
			items: []
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
			expiresBy: validClientBody.expiresBy,
			items: validClientBody.items,
			merchantName: validClientBody.merchantName,
			gstNumber: validClientBody.gstNumber
		};
		const parsed = v.safeParse(CreateInvoiceClientRequestSchema, withoutDelivery);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.deliveryMethods).toEqual([]);
		}
	});
});

describe('buildCreateInvoiceRequest', () => {
	it('attaches form details with dummy address, INR, and merchant callback URLs', () => {
		const parsed = v.parse(CreateInvoiceClientRequestSchema, validClientBody);
		const payload = buildCreateInvoiceRequest(parsed);

		expect(v.safeParse(CreateInvoiceUpstreamRequestSchema, payload).success).toBe(true);
		expect(payload.currency).toBe('INR');
		expect(payload.referenceId).toBe('inv_TeyCvL2N0eDw3A');
		expect(payload.expiresBy).toBe('2030-01-15T18:29:00.000Z');
		expect(payload.customer).toEqual({
			name: 'Test Customer',
			email: 'test.customer@example.com',
			phoneNumber: '+919999999999',
			...INVOICE_DUMMY_CUSTOMER_ADDRESS
		});
		expect(payload.customerAddress).toBe(INVOICE_DUMMY_CUSTOMER_ADDRESS_LINE);
		expect(payload.merchantUrl).toEqual(INVOICE_MERCHANT_URL);
		expect(payload.merchantName).toBe('ElixirPay');
		expect(payload.gstNumber).toBe('29AABCU9603R1ZM');
		expect(payload.items).toEqual([
			{
				itemName: 'Consulting',
				price: '2000.00',
				quantity: 1,
				total: '2000.00'
			}
		]);
		expect(payload.deliveryMethods).toEqual(['EMAIL', 'SMS']);
	});

	it('keeps a provided customer address', () => {
		const parsed = v.parse(CreateInvoiceClientRequestSchema, {
			...validClientBody,
			customerAddress: '12 MG Road, Bengaluru'
		});
		const payload = buildCreateInvoiceRequest(parsed);
		expect(payload.customerAddress).toBe('12 MG Road, Bengaluru');
	});
});

describe('CreateInvoiceCreatedSchema', () => {
	it('parses a successful create response', () => {
		const parsed = v.safeParse(CreateInvoiceCreatedSchema, {
			amount: '2000.00',
			clientOrderId: 'inv_TeyCvL2N0eDw3A',
			invoiceUrl: 'https://dev-checkout.elixirpay.in/inv_abc',
			message: 'Invoice created successfully',
			orderId: 'ord_123',
			status: 'CREATED'
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.invoiceUrl).toBe('https://dev-checkout.elixirpay.in/inv_abc');
			expect(parsed.output.orderId).toBe('ord_123');
		}
	});
});
