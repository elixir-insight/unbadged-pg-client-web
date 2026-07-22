import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { paymentOrderClient } from '$lib/server/domains/payment-order/client';
import { paymentAttemptClient } from '$lib/server/domains/payment-attempt/client';
import {
	mapPaymentOrderDetail,
	mapPaymentOrderTimeline,
	type PaymentOrderDetailView
} from '$lib/server/domains/payment-order/mappers/from-api/list';
import {
	mapRelatedPaymentAttempts,
	type RelatedPaymentAttempt
} from '$lib/server/domains/payment-attempt/mappers/from-api/list';
import { resolvePayinVirtualAccountNumber } from '$lib/server/domains/virtual-account/mappers/from-api/payin-van';
import type { PayinTimelineEntry } from '$lib/types/payin';

export const load: PageServerLoad = async ({ params, cookies, fetch, locals, depends }) => {
	depends('payment-orders:detail');

	const orderId = params.orderId;
	const log = locals.logger.child({ action: 'payment-order-detail', orderId });
	const base = {
		orderId,
		order: null as PaymentOrderDetailView | null,
		payments: [] as RelatedPaymentAttempt[],
		timeline: [] as PayinTimelineEntry[]
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return {
				...base,
				orderError: error.message,
				paymentsError: error.message,
				timelineError: error.message
			};
		}
		throw error;
	}

	const vanResult = await resolvePayinVirtualAccountNumber(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken
	);
	if (!vanResult.ok) {
		log.warn(
			{ kind: vanResult.error.kind, message: vanResult.error.message },
			'GET merchant PAYIN virtual account failed'
		);
		return {
			...base,
			orderError: vanResult.error.message,
			paymentsError: vanResult.error.message,
			timelineError: vanResult.error.message
		};
	}

	const virtualAccountNumber = vanResult.data;

	const [orderResult, paymentsResult, timelineResult] = await Promise.all([
		paymentOrderClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
			orderId,
			limit: 1,
			page: 0,
			virtualAccountNumber
		}),
		paymentAttemptClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
			orderId,
			limit: 100,
			page: 0,
			virtualAccountNumber
		}),
		paymentOrderClient.getTimeline(fetch, log, tokens.accessToken, tokens.gatewayToken, orderId)
	]);

	let order: PaymentOrderDetailView | null = null;
	let orderError: string | null = null;
	if (orderResult.ok) {
		const apiOrder = orderResult.data.data[0];
		if (apiOrder) order = mapPaymentOrderDetail(apiOrder);
		else orderError = 'Payment order not found';
	} else {
		orderError = orderResult.error.message;
		log.warn(
			{ kind: orderResult.error.kind, message: orderResult.error.message },
			'GET merchant payment order detail failed'
		);
	}

	let payments: RelatedPaymentAttempt[] = [];
	let paymentsError: string | null = null;
	if (paymentsResult.ok) {
		payments = mapRelatedPaymentAttempts(paymentsResult.data.data);
	} else {
		paymentsError = paymentsResult.error.message;
		log.warn(
			{ kind: paymentsResult.error.kind, message: paymentsResult.error.message },
			'GET merchant order payment attempts failed'
		);
	}

	let timeline: PayinTimelineEntry[] = [];
	let timelineError: string | null = null;
	if (timelineResult.ok) {
		timeline = mapPaymentOrderTimeline(timelineResult.data.data);
	} else {
		timelineError = timelineResult.error.message;
		log.warn(
			{ kind: timelineResult.error.kind, message: timelineResult.error.message },
			'GET merchant payment order timeline failed'
		);
	}

	return {
		orderId,
		order,
		payments,
		timeline,
		orderError,
		paymentsError,
		timelineError
	};
};
