import type { PaymentLink, PaymentLinkStatus } from '$lib/types/payment-link';

function daysAgo(days: number, hour = 10, minute = 30): { iso: string; ms: number } {
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
	return `https://pay.example.com/l/${id}`;
}

function seedLink(
	id: string,
	status: PaymentLinkStatus,
	amount: number,
	paymentFor: string,
	createdDaysAgo: number,
	overrides: Partial<PaymentLink> = {}
): PaymentLink {
	const { iso, ms } = daysAgo(createdDaysAgo);
	const amountPaid =
		status === 'paid' ? amount : status === 'partially_paid' ? Math.round(amount * 0.4) : 0;

	return {
		id,
		createdAt: iso,
		createdAtMs: ms,
		amount,
		amountPaid,
		paymentFor,
		paymentLinkUrl: buildLink(id),
		status,
		receiptNo:
			status === 'paid' || status === 'partially_paid'
				? `RCPT-${id.slice(4, 10).toUpperCase()}`
				: null,
		partialPaymentEnabled: status === 'partially_paid',
		expiresOn: status === 'expired' ? daysAgo(1).iso : daysFromNow(14),
		customerEmail: overrides.customerEmail ?? null,
		customerPhone: overrides.customerPhone ?? null,
		transactionId:
			status === 'paid' || status === 'partially_paid'
				? `PAT-${id.slice(4, 12).toUpperCase()}`
				: null,
		createdBy: 'Merchant Admin',
		...overrides
	};
}

export const paymentLinksSeedData: PaymentLink[] = [
	seedLink('inv_TR8w6NeWPKWZ3B', 'issued', 4999, 'Consultation fee — Dr. Sharma', 1),
	seedLink('inv_aK2mP9xLQvRn4C', 'issued', 12500, 'Annual membership renewal', 2),
	seedLink('inv_bN7qR3yMWsTp8D', 'issued', 850, 'Workshop registration', 0, {
		expiresOn: daysFromNow(30)
	}),
	seedLink('inv_cP4sT6zNXuVq2E', 'partially_paid', 10000, 'Event sponsorship deposit', 5, {
		customerEmail: 'arjun@example.com',
		customerPhone: '+91 98765 43210'
	}),
	seedLink('inv_dQ8uV1aOYwRs5F', 'partially_paid', 7500, 'Photography package — partial', 8, {
		customerPhone: '+91 91234 56789'
	}),
	seedLink('inv_eR2wX5bPZxTt7G', 'paid', 2499, 'Online course access', 3, {
		customerEmail: 'priya@example.com'
	}),
	seedLink('inv_fS6yZ9cQaYuU8H', 'paid', 18999, 'Premium plan — 12 months', 10, {
		customerEmail: 'vikram@example.com',
		customerPhone: '+91 99887 76655'
	}),
	seedLink('inv_gT3aB2dRbZvV1J', 'paid', 500, 'Donation — community fund', 14),
	seedLink('inv_hU7cD5eScAwW4K', 'paid', 3200, 'Product order #1042', 6, {
		customerEmail: 'meera@example.com'
	}),
	seedLink('inv_iV9eF8fTdBxX7L', 'cancelled', 1500, 'Cancelled — duplicate request', 4),
	seedLink('inv_jW1gH3gUeCyY2M', 'cancelled', 6200, 'Cancelled by merchant', 12),
	seedLink('inv_kX4hJ6hVfDzZ5N', 'expired', 999, 'Expired trial link', 20, {
		expiresOn: daysAgo(2).iso
	}),
	seedLink('inv_lY7iK9iWgEaA8O', 'expired', 4500, 'Expired invoice — Q1 services', 25, {
		expiresOn: daysAgo(5).iso,
		customerEmail: 'rahul@example.com'
	}),
	seedLink('inv_mZ2jL4jXhFbB1P', 'issued', 2750, 'Lab test booking', 7),
	seedLink('inv_nA5kM7kYiGcC4Q', 'paid', 15600, 'Corporate training batch', 18, {
		customerEmail: 'hr@acmecorp.com',
		customerPhone: '+91 90000 11122'
	}),
	seedLink('inv_oB8lN1lZjHdD7R', 'issued', 399, 'Digital download', 3, { expiresOn: null }),
	seedLink('inv_pC1mO4mAkIeE3S', 'partially_paid', 20000, 'Interior design advance', 11, {
		customerEmail: 'design@client.com'
	}),
	seedLink('inv_qD4nP7nBlJfF6T', 'expired', 1100, 'Expired gym pass', 30, {
		expiresOn: daysAgo(10).iso
	})
];
