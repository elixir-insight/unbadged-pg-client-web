import type { PaymentLinkAllowedMethod, PaymentLinkDeliveryMethod } from '$lib/types/payment-link';

export type CreateInvoiceItemRequest = {
	itemName: string;
	price: string;
	quantity: number;
	total: string;
};

export type CreateInvoiceRequest = {
	amount: string;
	description: string;
	referenceId: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	allowedPaymentMethods: PaymentLinkAllowedMethod[];
	deliveryMethods: PaymentLinkDeliveryMethod[];
	expiresBy: string;
	items: CreateInvoiceItemRequest[];
	merchantName: string;
	gstNumber: string;
	customerAddress?: string;
};

export type CreateInvoiceResponse = {
	amount: string;
	clientOrderId: string;
	invoiceUrl: string;
	message: string;
	orderId: string;
	status: string;
};

interface ErrorResponseBody {
	message?: string;
}

export class InvoiceReferenceConflictError extends Error {
	constructor(message = 'Invoice already exists for this reference ID') {
		super(message);
		this.name = 'InvoiceReferenceConflictError';
	}
}

export async function createInvoiceRequest(
	body: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
	const res = await fetch('/api/invoices', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	const raw: (Partial<CreateInvoiceResponse> & ErrorResponseBody) | null = await res
		.json()
		.catch(() => null);

	if (!res.ok) {
		const message = raw?.message ?? `Request failed (${res.status})`;
		if (res.status === 409 || /already exists for (this )?reference/i.test(message)) {
			throw new InvoiceReferenceConflictError(
				raw?.message?.trim() || 'Invoice already exists for this reference ID'
			);
		}
		throw new Error(message);
	}

	if (!raw?.invoiceUrl || !raw.orderId) {
		throw new Error('Unexpected response from create invoice');
	}

	return {
		amount: raw.amount ?? body.amount,
		clientOrderId: raw.clientOrderId ?? body.referenceId,
		invoiceUrl: raw.invoiceUrl,
		message: raw.message ?? 'Invoice created successfully',
		orderId: raw.orderId,
		status: raw.status ?? 'issued'
	};
}
