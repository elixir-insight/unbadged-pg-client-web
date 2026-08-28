import { describe, expect, it } from 'vitest';
import { paymentLinksSeedData } from '$lib/data/payment-links-mock';
import {
	filterPaymentLinks,
	getPaymentLinkCounts,
	isPaymentLinkStatus,
	persistCreatedPaymentLink
} from '$lib/utils/payment-links-store';
import { validateCreatePaymentLinkForm } from '$lib/validation/payment-link';
import type { PaymentLink } from '$lib/types/payment-link';

describe('payment-links-store', () => {
	it('recognizes valid payment link statuses', () => {
		expect(isPaymentLinkStatus('issued')).toBe(true);
		expect(isPaymentLinkStatus('invalid')).toBe(false);
	});

	it('filters by status tab and search', () => {
		const links = paymentLinksSeedData;
		const issuedOnly = filterPaymentLinks(links, {
			statusTab: 'Issued',
			search: '',
			fromDateMs: null,
			toDateMs: null
		});
		expect(issuedOnly.every((link) => link.status === 'issued')).toBe(true);

		const byId = filterPaymentLinks(links, {
			statusTab: 'All',
			search: 'inv_TR8w6NeWPKWZ3B',
			fromDateMs: null,
			toDateMs: null
		});
		expect(byId).toHaveLength(1);
		expect(byId[0]?.id).toBe('inv_TR8w6NeWPKWZ3B');
	});

	it('computes tab counts', () => {
		const counts = getPaymentLinkCounts(paymentLinksSeedData);
		expect(counts.All).toBe(paymentLinksSeedData.length);
		expect(counts.Issued).toBeGreaterThan(0);
		expect(counts.Paid).toBeGreaterThan(0);
	});
});

const validForm = {
	amount: '1500',
	paymentFor: 'Workshop fee',
	receipt: 'rcpt-1001',
	customerName: 'Test Customer',
	customerEmail: 'test.customer@example.com',
	customerPhone: '9999999999',
	allowedPaymentMethods: ['UPI'],
	expireOn: '2030-01-15',
	expireAt: '14:30'
};

describe('validateCreatePaymentLinkForm', () => {
	it('requires amount, payment for, receipt, customer details, and payment methods', () => {
		const errors = validateCreatePaymentLinkForm({
			amount: '',
			paymentFor: '',
			receipt: '',
			customerName: '',
			customerEmail: '',
			customerPhone: '',
			allowedPaymentMethods: [],
			expireOn: '',
			expireAt: ''
		});
		expect(errors.amount).toBeDefined();
		expect(errors.paymentFor).toBeDefined();
		expect(errors.receipt).toBeDefined();
		expect(errors.customerName).toBeDefined();
		expect(errors.customerEmail).toBeDefined();
		expect(errors.customerPhone).toBeDefined();
		expect(errors.allowedPaymentMethods).toBeDefined();
		expect(errors.expireOn).toBeDefined();
		expect(errors.expireAt).toBeDefined();
	});

	it('requires expiry date and time', () => {
		const errors = validateCreatePaymentLinkForm({
			...validForm,
			expireOn: '',
			expireAt: ''
		});
		expect(errors.expireOn).toBeDefined();
		expect(errors.expireAt).toBeDefined();
	});

	it('rejects a previous expiry date', () => {
		const errors = validateCreatePaymentLinkForm({
			...validForm,
			expireOn: '2020-01-15',
			expireAt: '10:00'
		});
		expect(errors.expireOn).toBeDefined();
	});

	it('accepts a numeric amount from type=number inputs', () => {
		const errors = validateCreatePaymentLinkForm({
			...validForm,
			amount: 1500
		});
		expect(Object.keys(errors)).toHaveLength(0);
	});
});

describe('persistCreatedPaymentLink', () => {
	it('returns the API-mapped link unchanged', () => {
		const now = new Date();
		const created: PaymentLink = {
			id: 'ord_123',
			createdAt: now.toISOString(),
			createdAtMs: now.getTime(),
			amount: 2500,
			amountPaid: 0,
			paymentFor: 'Test payment',
			paymentLinkUrl: 'https://dev-checkout.elixirpay.in/pl_abc',
			status: 'issued',
			receiptNo: 'rcpt-1001',
			partialPaymentEnabled: false,
			expiresOn: null,
			customerEmail: null,
			customerPhone: null,
			transactionId: null,
			createdBy: 'Test Merchant'
		};

		const link = persistCreatedPaymentLink(created);
		expect(link).toEqual(created);
		expect(link.paymentLinkUrl).toBe('https://dev-checkout.elixirpay.in/pl_abc');
	});
});
