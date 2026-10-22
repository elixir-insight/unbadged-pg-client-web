import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cancelPaymentLinkMutation } from '$lib/server/domains/payment-links/mutations/cancel';

function httpStatus(status: number): number {
	return status >= 400 && status <= 599 ? status : 502;
}

export const POST: RequestHandler = async ({ params, cookies, locals, fetch }) => {
	const orderId = params.orderId?.trim() ?? '';
	if (!orderId) {
		return json({ message: 'Payment link ID is required' }, { status: 400 });
	}

	const result = await cancelPaymentLinkMutation({
		fetch,
		log: locals.logger,
		cookies,
		orderId
	});

	if (!result.ok) {
		return json({ message: result.message }, { status: httpStatus(result.status) });
	}

	return json({
		amount: result.cancelled.amount,
		clientOrderId: result.cancelled.clientOrderId,
		message: result.message || result.cancelled.message || 'Payment link cancelled',
		orderId: result.cancelled.orderId,
		status: result.cancelled.status
	});
};
