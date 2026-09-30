import { invoicesSeedData } from '$lib/data/invoices-mock';
import type {
	Invoice,
	InvoiceCounts,
	InvoiceFilterQuery,
	InvoiceSearchField,
	InvoiceStatus
} from '$lib/types/invoice';
import { INVOICE_STATUSES } from '$lib/types/invoice';

const STORAGE_KEY = 'pg:merchant:invoices-v1';
const STORAGE_VERSION_KEY = 'pg:merchant:invoices-seeded-v1';

const TAB_STATUS_MAP: Record<Exclude<keyof InvoiceCounts, 'All'>, InvoiceStatus> = {
	Issued: 'issued',
	Attempted: 'attempted',
	Overdue: 'overdue',
	Paid: 'paid',
	Cancelled: 'cancelled',
	Expired: 'expired'
};

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
	return typeof value === 'string' && INVOICE_STATUSES.some((status) => status === value);
}

export function isInvoiceSearchField(value: unknown): value is InvoiceSearchField {
	return (
		value === 'id' ||
		value === 'receiptNo' ||
		value === 'customerPhone' ||
		value === 'customerEmail'
	);
}

function normalizeInvoice(value: unknown): Invoice | null {
	if (!value || typeof value !== 'object') return null;

	const row = value as Record<string, unknown>;
	if (
		typeof row.id !== 'string' ||
		typeof row.invoiceNumber !== 'string' ||
		typeof row.createdAt !== 'string' ||
		typeof row.createdAtMs !== 'number' ||
		typeof row.amount !== 'number' ||
		typeof row.description !== 'string' ||
		!isInvoiceStatus(row.status) ||
		typeof row.receiptNo !== 'string' ||
		typeof row.dueDate !== 'string' ||
		typeof row.customerName !== 'string' ||
		typeof row.customerEmail !== 'string' ||
		typeof row.customerPhone !== 'string' ||
		typeof row.notifyEmail !== 'boolean' ||
		typeof row.notifySms !== 'boolean' ||
		typeof row.createdBy !== 'string' ||
		!Array.isArray(row.allowedPaymentMethods)
	) {
		return null;
	}

	const methods = row.allowedPaymentMethods.filter(
		(method): method is string => typeof method === 'string'
	);

	return {
		id: row.id,
		invoiceNumber: row.invoiceNumber,
		createdAt: row.createdAt,
		createdAtMs: row.createdAtMs,
		amount: row.amount,
		description: row.description,
		status: row.status,
		receiptNo: row.receiptNo,
		dueDate: row.dueDate,
		customerName: row.customerName,
		customerEmail: row.customerEmail,
		customerPhone: row.customerPhone,
		customerAddress: typeof row.customerAddress === 'string' ? row.customerAddress : '',
		paymentLinkUrl: typeof row.paymentLinkUrl === 'string' ? row.paymentLinkUrl : null,
		allowedPaymentMethods: methods.filter(
			(method): method is Invoice['allowedPaymentMethods'][number] =>
				method === 'UPI' || method === 'CARD' || method === 'NET_BANKING'
		),
		notifyEmail: row.notifyEmail,
		notifySms: row.notifySms,
		transactionId: typeof row.transactionId === 'string' ? row.transactionId : null,
		createdBy: row.createdBy
	};
}

export function loadInvoices(): Invoice[] {
	if (typeof localStorage === 'undefined') return [...invoicesSeedData];

	try {
		const seeded = localStorage.getItem(STORAGE_VERSION_KEY);
		if (!seeded) {
			saveInvoices(invoicesSeedData);
			localStorage.setItem(STORAGE_VERSION_KEY, '1');
			return [...invoicesSeedData];
		}

		const storedValue = localStorage.getItem(STORAGE_KEY);
		if (!storedValue) return [...invoicesSeedData];

		const parsed: unknown = JSON.parse(storedValue);
		if (!Array.isArray(parsed)) return [...invoicesSeedData];

		const invoices = parsed
			.map(normalizeInvoice)
			.filter((invoice): invoice is Invoice => invoice !== null);

		return invoices.length > 0 ? invoices : [...invoicesSeedData];
	} catch {
		return [...invoicesSeedData];
	}
}

export function saveInvoices(invoices: Invoice[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

export function persistCreatedInvoice(invoice: Invoice): Invoice {
	const invoices = loadInvoices();
	saveInvoices([invoice, ...invoices]);
	return invoice;
}

export function cancelInvoice(id: string): Invoice | undefined {
	const invoices = loadInvoices();
	const index = invoices.findIndex((invoice) => invoice.id === id);
	const current = invoices[index];
	if (!current) return undefined;
	if (current.status === 'paid' || current.status === 'cancelled' || current.status === 'expired') {
		return current;
	}

	const next: Invoice = { ...current, status: 'cancelled', paymentLinkUrl: null };
	invoices[index] = next;
	saveInvoices(invoices);
	return next;
}

export function getInvoiceCounts(invoices: Invoice[]): InvoiceCounts {
	return {
		All: invoices.length,
		Issued: invoices.filter((invoice) => invoice.status === 'issued').length,
		Attempted: invoices.filter((invoice) => invoice.status === 'attempted').length,
		Overdue: invoices.filter((invoice) => invoice.status === 'overdue').length,
		Paid: invoices.filter((invoice) => invoice.status === 'paid').length,
		Cancelled: invoices.filter((invoice) => invoice.status === 'cancelled').length,
		Expired: invoices.filter((invoice) => invoice.status === 'expired').length
	};
}

export function filterInvoices(invoices: Invoice[], query: InvoiceFilterQuery): Invoice[] {
	let result = [...invoices];

	if (query.fromDateMs !== null && query.toDateMs !== null) {
		result = result.filter(
			(invoice) =>
				invoice.createdAtMs >= query.fromDateMs! && invoice.createdAtMs <= query.toDateMs!
		);
	}

	if (query.statusTab && query.statusTab !== 'All') {
		const status = TAB_STATUS_MAP[query.statusTab];
		result = result.filter((invoice) => invoice.status === status);
	}

	const search = query.search.trim().toLowerCase();
	if (search) {
		result = result.filter((invoice) => {
			const haystack =
				query.searchField === 'receiptNo'
					? invoice.receiptNo
					: query.searchField === 'customerPhone'
						? invoice.customerPhone
						: query.searchField === 'customerEmail'
							? invoice.customerEmail
							: invoice.id;
			return haystack.toLowerCase().includes(search);
		});
	}

	return result.sort((a, b) => b.createdAtMs - a.createdAtMs);
}

const amountFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2
});

export function formatInvoiceAmount(amount: number): string {
	return amountFormatter.format(amount);
}

export function formatInvoiceDateTime(iso: string | null | undefined): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Asia/Kolkata'
	}).format(date);
}

export function formatInvoiceDueDate(iso: string | null | undefined): string {
	if (!iso) return '—';
	if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
		const [year, month, day] = iso.split('-').map(Number);
		const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
		return new Intl.DateTimeFormat('en-IN', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(date);
	}
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		timeZone: 'Asia/Kolkata'
	}).format(date);
}

export function nextInvoiceNumber(existing: Invoice[]): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const prefix = `INV-${year}${month}-`;
	let max = 0;
	for (const invoice of existing) {
		if (!invoice.invoiceNumber.startsWith(prefix)) continue;
		const suffix = Number(invoice.invoiceNumber.slice(prefix.length));
		if (Number.isFinite(suffix) && suffix > max) max = suffix;
	}
	return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export function createInvoiceId(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
	let suffix = '';
	for (let i = 0; i < 14; i += 1) {
		const index = Math.floor(Math.random() * chars.length);
		suffix += chars[index];
	}
	return `inv_${suffix}`;
}
