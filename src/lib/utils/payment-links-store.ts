import { paymentLinksSeedData } from '$lib/data/payment-links-mock';
import type {
	PaymentLink,
	PaymentLinkCounts,
	PaymentLinkFilterQuery,
	PaymentLinkStatus
} from '$lib/types/payment-link';
import { PAYMENT_LINK_STATUSES } from '$lib/types/payment-link';

const STORAGE_KEY = 'pg:merchant:payment-links-v1';
const STORAGE_VERSION_KEY = 'pg:merchant:payment-links-seeded-v1';

const TAB_STATUS_MAP: Record<Exclude<keyof PaymentLinkCounts, 'All'>, PaymentLinkStatus> = {
	Issued: 'issued',
	'Partially Paid': 'partially_paid',
	Paid: 'paid',
	Cancelled: 'cancelled',
	Expired: 'expired'
};

export function isPaymentLinkStatus(value: unknown): value is PaymentLinkStatus {
	return typeof value === 'string' && PAYMENT_LINK_STATUSES.some((status) => status === value);
}

function normalizePaymentLink(value: unknown): PaymentLink | null {
	if (!value || typeof value !== 'object') return null;

	const row = value as Record<string, unknown>;
	if (
		typeof row.id !== 'string' ||
		typeof row.createdAt !== 'string' ||
		typeof row.createdAtMs !== 'number' ||
		typeof row.amount !== 'number' ||
		typeof row.amountPaid !== 'number' ||
		typeof row.paymentFor !== 'string' ||
		typeof row.paymentLinkUrl !== 'string' ||
		!isPaymentLinkStatus(row.status) ||
		typeof row.partialPaymentEnabled !== 'boolean' ||
		typeof row.createdBy !== 'string'
	) {
		return null;
	}

	return {
		id: row.id,
		createdAt: row.createdAt,
		createdAtMs: row.createdAtMs,
		amount: row.amount,
		amountPaid: row.amountPaid,
		paymentFor: row.paymentFor,
		paymentLinkUrl: row.paymentLinkUrl,
		status: row.status,
		receiptNo: typeof row.receiptNo === 'string' ? row.receiptNo : null,
		partialPaymentEnabled: row.partialPaymentEnabled,
		expiresOn: typeof row.expiresOn === 'string' ? row.expiresOn : null,
		customerEmail: typeof row.customerEmail === 'string' ? row.customerEmail : null,
		customerPhone: typeof row.customerPhone === 'string' ? row.customerPhone : null,
		transactionId: typeof row.transactionId === 'string' ? row.transactionId : null,
		createdBy: row.createdBy
	};
}

export function loadPaymentLinks(): PaymentLink[] {
	if (typeof localStorage === 'undefined') return [...paymentLinksSeedData];

	try {
		const seeded = localStorage.getItem(STORAGE_VERSION_KEY);
		if (!seeded) {
			savePaymentLinks(paymentLinksSeedData);
			localStorage.setItem(STORAGE_VERSION_KEY, '1');
			return [...paymentLinksSeedData];
		}

		const storedValue = localStorage.getItem(STORAGE_KEY);
		if (!storedValue) return [...paymentLinksSeedData];

		const parsed: unknown = JSON.parse(storedValue);
		if (!Array.isArray(parsed)) return [...paymentLinksSeedData];

		const links = parsed
			.map(normalizePaymentLink)
			.filter((link): link is PaymentLink => link !== null);

		return links.length > 0 ? links : [...paymentLinksSeedData];
	} catch {
		return [...paymentLinksSeedData];
	}
}

export function savePaymentLinks(links: PaymentLink[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function getPaymentLinkById(id: string): PaymentLink | undefined {
	return loadPaymentLinks().find((link) => link.id === id);
}

export function persistCreatedPaymentLink(link: PaymentLink): PaymentLink {
	const links = loadPaymentLinks();
	savePaymentLinks([link, ...links]);
	return link;
}

export function getPaymentLinkCounts(links: PaymentLink[]): PaymentLinkCounts {
	return {
		All: links.length,
		Issued: links.filter((l) => l.status === 'issued').length,
		'Partially Paid': links.filter((l) => l.status === 'partially_paid').length,
		Paid: links.filter((l) => l.status === 'paid').length,
		Cancelled: links.filter((l) => l.status === 'cancelled').length,
		Expired: links.filter((l) => l.status === 'expired').length
	};
}

export function filterPaymentLinks(
	links: PaymentLink[],
	query: PaymentLinkFilterQuery
): PaymentLink[] {
	let result = [...links];

	if (query.fromDateMs !== null && query.toDateMs !== null) {
		result = result.filter(
			(link) => link.createdAtMs >= query.fromDateMs! && link.createdAtMs <= query.toDateMs!
		);
	}

	if (query.statusTab && query.statusTab !== 'All') {
		const status = TAB_STATUS_MAP[query.statusTab];
		result = result.filter((link) => link.status === status);
	}

	const search = query.search.trim().toLowerCase();
	if (search) {
		result = result.filter((link) => link.id.toLowerCase().includes(search));
	}

	return result.sort((a, b) => b.createdAtMs - a.createdAtMs);
}

const amountFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2
});

export function formatPaymentLinkAmount(amount: number): string {
	return amountFormatter.format(amount);
}

export function formatPaymentLinkDate(iso: string | null): string {
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

export function formatPaymentLinkExpiry(iso: string | null): string {
	if (!iso) return 'No expiry';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: 'Asia/Kolkata'
	}).format(date);
}
