import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import {
	mutationFailure,
	upstreamErrorToFailure,
	type MutationResult
} from '$lib/server/domains/organization/mutations/types';
import { paymentLinksClient } from '../client';
import type { CancelPaymentLinkData } from '../schema';

export type CancelPaymentLinkSuccess = {
	cancelled: CancelPaymentLinkData;
	message: string;
};

export async function cancelPaymentLinkMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orderId: string;
}): Promise<MutationResult<CancelPaymentLinkSuccess>> {
	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const orderId = params.orderId.trim();
	if (!orderId) {
		params.log.warn('cancel payment link rejected — missing orderId');
		return mutationFailure(400, 'Payment link ID is required');
	}

	const result = await paymentLinksClient.cancel(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orderId
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		cancelled: result.data.data,
		message: result.data.message || result.data.data.message || 'Payment link cancelled'
	};
}
