import { describe, expect, it } from 'vitest';
import { invoicesSeedData } from '$lib/data/invoices-mock';
import {
	filterInvoices,
	getInvoiceCounts,
	isInvoiceStatus,
	nextInvoiceNumber
} from '$lib/utils/invoices-store';
import { validateCreateInvoiceForm } from '$lib/validation/invoice';

describe('invoices-store', () => {
	it('recognizes invoice statuses', () => {
		expect(isInvoiceStatus('issued')).toBe(true);
		expect(isInvoiceStatus('overdue')).toBe(true);
		expect(isInvoiceStatus('partially_paid')).toBe(false);
	});

	it('filters by status tab and search field', () => {
		const issued = filterInvoices(invoicesSeedData, {
			statusTab: 'Issued',
			search: '',
			searchField: 'id',
			fromDateMs: null,
			toDateMs: null
		});
		expect(issued.every((invoice) => invoice.status === 'issued')).toBe(true);

		const byPhone = filterInvoices(invoicesSeedData, {
			statusTab: 'All',
			search: '9988776655',
			searchField: 'customerPhone',
			fromDateMs: null,
			toDateMs: null
		});
		expect(byPhone).toHaveLength(1);
		expect(byPhone[0]?.id).toBe('inv_Ovrd8pL5WsT1cB');
	});

	it('computes tab counts', () => {
		const counts = getInvoiceCounts(invoicesSeedData);
		expect(counts.All).toBe(invoicesSeedData.length);
		expect(
			counts.Issued +
				counts.Attempted +
				counts.Overdue +
				counts.Paid +
				counts.Cancelled +
				counts.Expired
		).toBe(counts.All);
	});

	it('increments invoice numbers for the current month', () => {
		const now = new Date();
		const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
		const seed = invoicesSeedData[0];
		if (!seed) throw new Error('expected seed invoice');
		const next = nextInvoiceNumber([
			{
				...seed,
				invoiceNumber: `${prefix}0004`
			}
		]);
		expect(next).toBe(`${prefix}0005`);
	});
});

describe('validateCreateInvoiceForm', () => {
	it('requires customer, items, and due date', () => {
		const errors = validateCreateInvoiceForm({
			invoiceNumber: '',
			customerName: '',
			customerEmail: 'bad',
			customerPhone: '123',
			items: [],
			dueDate: '',
			allowedPaymentMethods: [],
			notifyEmail: false,
			notifySms: false
		});
		expect(errors.invoiceNumber).toBeDefined();
		expect(errors.customerName).toBeDefined();
		expect(errors.customerEmail).toBeDefined();
		expect(errors.customerPhone).toBeDefined();
		expect(errors.items).toBeDefined();
		expect(errors.dueDate).toBeDefined();
		expect(errors.allowedPaymentMethods).toBeDefined();
	});
});
