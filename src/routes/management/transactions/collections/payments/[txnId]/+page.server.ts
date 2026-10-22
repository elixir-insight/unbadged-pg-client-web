import type { Logger } from 'pino';
import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { disputeClient } from '$lib/server/domains/dispute/client';
import type { DisputeListItem } from '$lib/server/domains/dispute/schema';
import { paymentAttemptClient } from '$lib/server/domains/payment-attempt/client';
import {
	mapPaymentAttemptDetail,
	mapPaymentRefunds,
	type PaymentAttemptDetailView
} from '$lib/server/domains/payment-attempt/mappers/from-api/list';
import { paymentOrderClient } from '$lib/server/domains/payment-order/client';
import { mapPaymentOrderTimeline } from '$lib/server/domains/payment-order/mappers/from-api/list';
import { resolveVirtualAccountNumber } from '../../../resolve-van';
import type { PayinRefundDetail, PayinTimelineEntry } from '$lib/types/payin';

function asText(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function matchPaymentDispute(
	items: DisputeListItem[],
	payment: PaymentAttemptDetailView
): DisputeListItem | undefined {
	const txnIds = new Set(
		[payment.pipelineTransactionId, payment.txnId].map((value) => value.trim()).filter(Boolean)
	);
	const orderId = payment.orderId !== '—' ? payment.orderId.trim() : '';

	return (
		items.find((item) => txnIds.has(asText(item.pipelineTransactionId))) ??
		(orderId ? items.find((item) => asText(item.orderId) === orderId) : undefined)
	);
}

async function resolvePaymentDisputeStatus(params: {
	fetch: typeof fetch;
	log: Logger;
	accessToken: string;
	gatewayToken: string;
	orgId: string;
	payment: PaymentAttemptDetailView;
}): Promise<string> {
	const { payment } = params;
	const fallback = payment.disputeStatus || (payment.disputeId ? 'DISPUTE_RAISED' : '');
	const orgId = payment.orgId.trim() || params.orgId.trim();
	if (!orgId) return fallback;

	if (payment.disputeId) {
		const result = await disputeClient.getById(
			params.fetch,
			params.log,
			params.accessToken,
			params.gatewayToken,
			orgId,
			payment.disputeId
		);
		if (result.ok) {
			const status = asText(result.data.data[0]?.status);
			return status || fallback || 'DISPUTE_RAISED';
		}
		return fallback;
	}

	const orderId = payment.orderId !== '—' ? payment.orderId : undefined;
	const result = await disputeClient.listByOrganization(
		params.fetch,
		params.log,
		params.accessToken,
		params.gatewayToken,
		orgId,
		{
			orderId,
			pipelineTransactionId: payment.pipelineTransactionId || undefined,
			limit: 100,
			page: 0
		}
	);
	if (!result.ok) return fallback;

	const match = matchPaymentDispute(result.data.data, payment);
	if (!match) return fallback;
	return asText(match.status) || 'DISPUTE_RAISED';
}

export const load: PageServerLoad = async ({
	params,
	url,
	cookies,
	fetch,
	locals,
	depends,
	parent
}) => {
	depends('management-payment-attempts:detail');

	const payinAttemptId = params.txnId;
	const parentData = await parent();
	const { virtualAccountNumber, scopeError } = resolveVirtualAccountNumber(
		parentData,
		url.searchParams.get('merchantId'),
		url.searchParams.get('vanId')
	);
	const log = locals.logger.child({
		action: 'management-payment-attempt-detail',
		payinAttemptId
	});
	const base = {
		payinAttemptId,
		payment: null as PaymentAttemptDetailView | null,
		refunds: [] as PayinRefundDetail[],
		timeline: [] as PayinTimelineEntry[],
		disputeStatus: ''
	};

	if (scopeError || !virtualAccountNumber) {
		const message = scopeError ?? 'Virtual account is required';
		return {
			...base,
			paymentError: message,
			refundsError: message,
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
				paymentError: error.message,
				refundsError: error.message,
				timelineError: error.message
			};
		}
		throw error;
	}

	const [paymentResult, refundsResult] = await Promise.all([
		paymentAttemptClient.list(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{
				payinAttemptId,
				virtualAccountNumber,
				limit: 1,
				page: 0
			},
			'management'
		),
		paymentAttemptClient.listRefunds(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			payinAttemptId,
			'management'
		)
	]);

	let payment: PaymentAttemptDetailView | null = null;
	let paymentError: string | null = null;
	const attempt = paymentResult.ok ? paymentResult.data.data[0] : undefined;
	if (paymentResult.ok) {
		if (attempt) payment = mapPaymentAttemptDetail(attempt);
		else paymentError = 'Payment attempt not found';
	} else {
		paymentError = paymentResult.error.message;
		log.warn(
			{ kind: paymentResult.error.kind, message: paymentResult.error.message },
			'GET management payment attempt detail failed'
		);
	}

	let refunds: PayinRefundDetail[] = [];
	let refundsError: string | null = null;
	if (refundsResult.ok) {
		refunds = mapPaymentRefunds(refundsResult.data.data);
	} else {
		refundsError = refundsResult.error.message;
		log.warn(
			{ kind: refundsResult.error.kind, message: refundsResult.error.message },
			'GET management payment attempt refunds failed'
		);
	}

	let timeline: PayinTimelineEntry[] = [];
	let timelineError: string | null = null;
	const orderId = attempt?.orderId?.trim();
	if (orderId) {
		const timelineResult = await paymentOrderClient.getTimeline(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			orderId,
			'management'
		);

		if (timelineResult.ok) {
			const relevantEvents = timelineResult.data.data.filter(
				(event) => !event.payinAttemptId?.trim() || event.payinAttemptId === payinAttemptId
			);
			timeline = mapPaymentOrderTimeline(relevantEvents);
		} else {
			timelineError = timelineResult.error.message;
			log.warn(
				{ kind: timelineResult.error.kind, message: timelineResult.error.message },
				'GET management payment attempt timeline failed'
			);
		}
	} else if (payment) {
		timelineError = 'Order ID is unavailable for this payment timeline';
	}

	const disputeStatus = payment
		? await resolvePaymentDisputeStatus({
				fetch,
				log,
				accessToken: tokens.accessToken,
				gatewayToken: tokens.gatewayToken,
				orgId: url.searchParams.get('merchantId')?.trim() ?? '',
				payment
			})
		: '';

	return {
		payinAttemptId,
		payment,
		refunds,
		timeline,
		disputeStatus,
		paymentError,
		refundsError,
		timelineError
	};
};
