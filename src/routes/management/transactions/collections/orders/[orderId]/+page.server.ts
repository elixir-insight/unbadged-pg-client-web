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
import { resolveVirtualAccountNumber } from '../../../resolve-van';
import type { PayinTimelineEntry } from '$lib/types/payin';

export const load: PageServerLoad = async ({
	params,
	url,
	cookies,
	fetch,
	locals,
	depends,
	parent
}) => {
	depends('management-payment-orders:detail');

	const orderId = params.orderId;
	const parentData = await parent();
	const { virtualAccountNumber, scopeError } = resolveVirtualAccountNumber(
		parentData,
		url.searchParams.get('merchantId'),
		url.searchParams.get('vanId')
	);
	const log = locals.logger.child({ action: 'management-payment-order-detail', orderId });
	const base = {
		orderId,
		order: null as PaymentOrderDetailView | null,
		payments: [] as RelatedPaymentAttempt[],
		timeline: [] as PayinTimelineEntry[]
	};

	if (scopeError || !virtualAccountNumber) {
		const message = scopeError ?? 'Virtual account is required';
		return {
			...base,
			orderError: message,
			paymentsError: message,
			timelineError: message
		};
	}

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

	const [orderResult, paymentsResult, timelineResult] = await Promise.all([
		paymentOrderClient.list(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{ orderId, virtualAccountNumber, limit: 1, page: 0 },
			'management'
		),
		paymentAttemptClient.list(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{ orderId, virtualAccountNumber, limit: 100, page: 0 },
			'management'
		),
		paymentOrderClient.getTimeline(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			orderId,
			'management'
		)
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
			'GET management payment order detail failed'
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
			'GET management order payment attempts failed'
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
			'GET management payment order timeline failed'
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
