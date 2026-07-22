import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { paymentOrderClient } from '$lib/server/domains/payment-order/client';
import {
	getPaymentOrderStatusCount,
	mapPaymentOrderCardCounts,
	mapPaymentOrderListResponse,
	mapPaymentOrderUiStatus,
	type PaymentOrderCardCounts,
	type PaymentOrderListRow
} from '$lib/server/domains/payment-order/mappers/from-api/list';
import {
	isNoPayinVirtualAccountError,
	resolvePayinVirtualAccountNumber
} from '$lib/server/domains/virtual-account/mappers/from-api/payin-van';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function emptyCounts(): PaymentOrderCardCounts {
	return { Orders: 0, Successful: 0, Pending: 0, Created: 0, Failed: 0 };
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('payment-orders:list');

	const log = locals.logger.child({ action: 'payment-orders-page' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);
	const orderId = url.searchParams.get('search')?.trim() || undefined;
	const uiStatus = url.searchParams.get('status')?.trim() || undefined;
	const fromDate = url.searchParams.get('fromDate')?.trim() || undefined;
	const toDate = url.searchParams.get('toDate')?.trim() || undefined;

	const base = {
		orders: [] as PaymentOrderListRow[],
		counts: emptyCounts(),
		pagination: { limit, page, total: 0 },
		vanSetupMessage: null as string | null
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return {
				...base,
				listError: error.message,
				countsError: error.message
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
		if (isNoPayinVirtualAccountError(vanResult.error)) {
			log.info('payment orders — no PAYIN virtual account yet');
			return {
				...base,
				vanSetupMessage: vanResult.error.message,
				listError: null,
				countsError: null
			};
		}
		log.warn(
			{ kind: vanResult.error.kind, message: vanResult.error.message },
			'GET merchant PAYIN virtual account failed'
		);
		return {
			...base,
			listError: vanResult.error.message,
			countsError: vanResult.error.message
		};
	}

	const virtualAccountNumber = vanResult.data;

	const [listResult, countsResult] = await Promise.all([
		paymentOrderClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
			orderId,
			statuses: mapPaymentOrderUiStatus(uiStatus),
			fromDate,
			toDate,
			limit,
			page,
			virtualAccountNumber
		}),
		paymentOrderClient.getCounts(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			virtualAccountNumber
		)
	]);

	let orders: PaymentOrderListRow[] = [];
	let listError: string | null = null;
	if (listResult.ok) {
		orders = mapPaymentOrderListResponse(listResult.data.data);
	} else {
		listError = listResult.error.message;
		log.warn(
			{ kind: listResult.error.kind, message: listResult.error.message },
			'GET merchant payment orders failed'
		);
	}

	let counts = emptyCounts();
	let countsError: string | null = null;
	let exactTotal: number | null = null;
	if (countsResult.ok) {
		const apiCounts = countsResult.data.data[0];
		if (apiCounts) {
			counts = mapPaymentOrderCardCounts(apiCounts);
			if (!orderId && !fromDate && !toDate) {
				exactTotal = getPaymentOrderStatusCount(apiCounts, uiStatus);
			}
		} else {
			countsError = 'Payment order counts are empty';
		}
	} else {
		countsError = countsResult.error.message;
		log.warn(
			{ kind: countsResult.error.kind, message: countsResult.error.message },
			'GET merchant payment order counts failed'
		);
	}

	return {
		orders,
		counts,
		pagination: {
			limit,
			page,
			total: exactTotal ?? skip + orders.length + (orders.length === limit && !listError ? 1 : 0)
		},
		listError,
		countsError,
		vanSetupMessage: null
	};
};
