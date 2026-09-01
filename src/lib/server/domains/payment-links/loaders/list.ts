import type { Logger } from 'pino';
import type { PaymentLink, PaymentLinkCounts } from '$lib/types/payment-link';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { paymentLinksClient, type PaymentLinkListQuery } from '../client';
import {
	emptyPaymentLinkCounts,
	emptyPaymentLinkPagination,
	mapPaymentLinkCardCounts,
	mapPaymentLinkListResponse
} from '../mappers/from-api/list';
import type { PaymentLinkPagination } from '../schema';

export type PaymentLinksLoadResult = {
	links: PaymentLink[];
	pagination: PaymentLinkPagination;
	counts: PaymentLinkCounts;
	listError: string | null;
	countsError: string | null;
};

export async function loadPaymentLinksList(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	query: PaymentLinkListQuery;
}): Promise<PaymentLinksLoadResult> {
	const limit = params.query.limit ?? 10;
	const page = params.query.page ?? 0;
	const empty = {
		links: [] as PaymentLink[],
		pagination: emptyPaymentLinkPagination(limit, page),
		counts: emptyPaymentLinkCounts(),
		listError: null as string | null,
		countsError: null as string | null
	};

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return { ...empty, listError: session.message, countsError: session.message };
	}

	const [listResult, countsResult] = await Promise.all([
		paymentLinksClient.list(params.fetch, params.log, session.accessToken, session.gatewayToken, {
			page,
			limit,
			orderId: params.query.orderId,
			statuses: params.query.statuses
		}),
		paymentLinksClient.getCounts(
			params.fetch,
			params.log,
			session.accessToken,
			session.gatewayToken
		)
	]);

	let links: PaymentLink[] = [];
	let pagination = emptyPaymentLinkPagination(limit, page);
	let listError: string | null = null;

	if (listResult.ok) {
		links = mapPaymentLinkListResponse(listResult.data.data);
		pagination = listResult.data.pagination ?? {
			limit,
			page,
			total: links.length
		};
	} else {
		listError = listResult.error.message;
		params.log.warn(
			{ kind: listResult.error.kind, message: listResult.error.message },
			'GET payment links failed'
		);
	}

	let counts = emptyPaymentLinkCounts();
	let countsError: string | null = null;

	if (countsResult.ok) {
		const apiCounts = countsResult.data.data[0];
		if (apiCounts) {
			counts = mapPaymentLinkCardCounts(apiCounts);
		} else {
			countsError = 'Payment link counts are empty';
		}
	} else {
		countsError = countsResult.error.message;
		params.log.warn(
			{ kind: countsResult.error.kind, message: countsResult.error.message },
			'GET payment link counts failed'
		);
	}

	return { links, pagination, counts, listError, countsError };
}
