import type { Invoice, InvoiceIssuer, InvoiceStatus } from '$lib/types/invoice';
import { PAYMENT_LINK_ALLOWED_METHODS } from '$lib/types/payment-link';

function daysAgo(days: number, hour = 11, minute = 9): { iso: string; ms: number } {
	const date = new Date();
	date.setDate(date.getDate() - days);
	date.setHours(hour, minute, 0, 0);
	return { iso: date.toISOString(), ms: date.getTime() };
}

function daysFromNow(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	date.setHours(23, 59, 59, 0);
	return date.toISOString();
}

function buildLink(id: string): string {
	return `https://pay.example.com/inv/${id}`;
}

export const mockInvoiceIssuer: InvoiceIssuer = {
	brandName: 'Payment Gateway',
	companyName: 'PaymentGateway Finance Company',
	gstin: '29AABCU9603R1ZM',
	location: 'IND',
	address: '12 Residency Road, Bengaluru, Karnataka 560025',
	phone: '+91 80 4567 8901'
};

function seedInvoice(
	id: string,
	invoiceNumber: string,
	status: InvoiceStatus,
	amount: number,
	description: string,
	createdDaysAgo: number,
	overrides: Partial<Invoice> = {}
): Invoice {
	const { iso, ms } = daysAgo(createdDaysAgo);
	const hasLink = status !== 'cancelled';

	return {
		id,
		invoiceNumber,
		createdAt: iso,
		createdAtMs: ms,
		amount,
		description,
		status,
		receiptNo: invoiceNumber.replace('INV-', 'RCPT-'),
		dueDate: status === 'overdue' || status === 'expired' ? daysAgo(2).iso : daysFromNow(14),
		customerName: 'Acme Enterprise',
		customerEmail: 'billing@acme.example',
		customerPhone: '9876501234',
		customerAddress: '42 Industrial Layout, Bengaluru, Karnataka 560025',
		paymentLinkUrl: hasLink ? buildLink(id) : null,
		allowedPaymentMethods: [...PAYMENT_LINK_ALLOWED_METHODS],
		notifyEmail: true,
		notifySms: false,
		transactionId: status === 'paid' ? `PAT-${id.slice(4, 12).toUpperCase()}` : null,
		createdBy: 'Merchant Admin',
		...overrides
	};
}

export const invoicesSeedData: Invoice[] = [
	seedInvoice(
		'inv_TeyCvL2N0eDw3A',
		'INV-202609-0001',
		'issued',
		2000,
		'Monthly consulting retainer',
		0,
		{
			customerName: 'Acme Enterprise',
			customerEmail: 'cme@enterprise.com',
			customerPhone: '7845753114'
		}
	),
	seedInvoice(
		'inv_TefGXp3BVw2sov',
		'INV-202609-0002',
		'issued',
		2000,
		'Website maintenance — September',
		1,
		{
			customerPhone: '7845753114',
			customerEmail: 'ops@acme.example'
		}
	),
	seedInvoice('inv_TeeiGQAnVnp9PL', 'INV-202609-0003', 'paid', 2000, 'Design sprint workshop', 1, {
		customerPhone: '7845753114',
		customerEmail: 'finance@acme.example'
	}),
	seedInvoice('inv_Tede7ug1Y8yhzf', 'INV-202609-0004', 'paid', 4000, 'Brand identity package', 1, {
		customerPhone: '7845753114',
		customerEmail: 'creative@acme.example'
	}),
	seedInvoice('inv_Atmp9kQ2LmN4xR', 'INV-202609-0005', 'attempted', 7500, 'Cloud hosting — Q3', 3, {
		customerName: 'Northwind Traders',
		customerEmail: 'ap@northwind.example',
		customerPhone: '9123456780'
	}),
	seedInvoice(
		'inv_Ovrd8pL5WsT1cB',
		'INV-202608-0012',
		'overdue',
		12500,
		'Annual support contract',
		20,
		{
			customerName: 'Lumen Health',
			customerEmail: 'accounts@lumen.example',
			customerPhone: '9988776655'
		}
	),
	seedInvoice('inv_Cncl3mH7YkP2dF', 'INV-202608-0008', 'cancelled', 1500, 'Duplicate invoice', 12, {
		customerName: 'Riverline Partners',
		customerEmail: 'ops@riverline.example',
		customerPhone: '9000011122',
		paymentLinkUrl: null
	}),
	seedInvoice('inv_Expd4nJ8ZqR6eG', 'INV-202607-0021', 'expired', 999, 'Trial onboarding fee', 40, {
		customerName: 'Meera Shah',
		customerEmail: 'meera@example.com',
		customerPhone: '9811122233'
	})
];
