import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { paymentOrderClient } from '$lib/server/domains/payment-order/client';
import {
	mapPaymentOrderCardCounts,
	mapPaymentOrderListResponse,
	mapPaymentOrderUiStatus,
	type PaymentOrderCardCounts,
	type PaymentOrderListRow
} from '$lib/server/domains/payment-order/mappers/from-api/list';
import { resolveVirtualAccountNumber } from '../../resolve-van';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function emptyCounts(): PaymentOrderCardCounts {
	return { Orders: 0, Successful: 0, Pending: 0, Created: 0, Failed: 0 };
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends, parent }) => {
	depends('management-payment-orders:list');

	const log = locals.logger.child({ action: 'management-payment-orders-page' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);
	const orderId = url.searchParams.get('search')?.trim() || undefined;
	const status = url.searchParams.get('status')?.trim() || undefined;
	const fromDate = url.searchParams.get('fromDate')?.trim() || undefined;
	const toDate = url.searchParams.get('toDate')?.trim() || undefined;
	const parentData = await parent();
	const { virtualAccountNumber, scopeError } = resolveVirtualAccountNumber(
		parentData,
		url.searchParams.get('merchantId'),
		url.searchParams.get('vanId')
	);
	const base = {
		orders: [] as PaymentOrderListRow[],
		counts: emptyCounts(),
		pagination: { limit, page, total: 0 }
	};

	if (scopeError || !virtualAccountNumber) {
		return {
			...base,
			listError: scopeError ?? 'Virtual account is required',
			countsError: scopeError ?? 'Virtual account is required'
		};
	}

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return { ...base, listError: error.message };
		}
		throw error;
	}

	const [listResult, countsResult] = await Promise.all([
		paymentOrderClient.list(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{
				orderId,
				statuses: mapPaymentOrderUiStatus(status),
				fromDate,
				toDate,
				limit,
				page,
				virtualAccountNumber
			},
			'management'
		),
		paymentOrderClient.getCounts(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			virtualAccountNumber,
			'management'
		)
	]);

	let orders: PaymentOrderListRow[] = [];
	let pagination = base.pagination;
	let listError: string | null = null;
	if (listResult.ok) {
		orders = mapPaymentOrderListResponse(listResult.data.data);
		pagination = listResult.data.pagination ?? {
			limit,
			page,
			total: skip + listResult.data.data.length
		};
	} else {
		listError = listResult.error.message;
		log.warn(
			{ kind: listResult.error.kind, message: listResult.error.message },
			'GET management payment orders failed'
		);
	}

	let counts = emptyCounts();
	let countsError: string | null = null;
	if (countsResult.ok) {
		const apiCounts = countsResult.data.data[0];
		if (apiCounts) counts = mapPaymentOrderCardCounts(apiCounts);
		else countsError = 'Payment order counts are empty';
	} else {
		countsError = countsResult.error.message;
		log.warn(
			{ kind: countsResult.error.kind, message: countsResult.error.message },
			'GET management payment order counts failed'
		);
	}

	return {
		orders,
		counts,
		pagination,
		listError,
		countsError
	};
};
