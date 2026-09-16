import type { PaymentLinkAllowedMethod, PaymentLinkDeliveryMethod } from '$lib/types/payment-link';

export type CreatePaymentLinkRequest = {
	amount: string;
	description: string;
	referenceId: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	allowedPaymentMethods: PaymentLinkAllowedMethod[];
	deliveryMethods: PaymentLinkDeliveryMethod[];
	expiresBy: string;
};

export type CreatePaymentLinkResponse = {
	amount: string;
	checkoutUrl: string;
	clientOrderId: string;
	message: string;
	orderId: string;
	status: string;
};

interface ErrorResponseBody {
	message?: string;
}

export class PaymentLinkReceiptConflictError extends Error {
	constructor(message = 'A payment link already exists for this receipt.') {
		super(message);
		this.name = 'PaymentLinkReceiptConflictError';
	}
}

export async function createPaymentLinkRequest(
	body: CreatePaymentLinkRequest
): Promise<CreatePaymentLinkResponse> {
	const res = await fetch('/api/payment-links', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	const raw: (Partial<CreatePaymentLinkResponse> & ErrorResponseBody) | null = await res
		.json()
		.catch(() => null);

	if (!res.ok) {
		const message = raw?.message ?? `Request failed (${res.status})`;
		if (res.status === 409 || /already exists for (the )?reference/i.test(message)) {
			throw new PaymentLinkReceiptConflictError('A payment link already exists for this receipt.');
		}
		throw new Error(message);
	}

	if (!raw?.checkoutUrl || !raw.orderId) {
		throw new Error('Unexpected response from create payment link');
	}

	return {
		amount: raw.amount ?? body.amount,
		checkoutUrl: raw.checkoutUrl,
		clientOrderId: raw.clientOrderId ?? body.referenceId,
		message: raw.message ?? 'Payment link created successfully',
		orderId: raw.orderId,
		status: raw.status ?? 'issued'
	};
}
