import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { paymentAttemptClient } from '$lib/server/domains/payment-attempt/client';
import {
	mapPaymentAttemptCardCounts,
	mapPaymentAttemptListResponse,
	mapPaymentAttemptUiStatus,
	type PaymentAttemptCardCounts,
	type PaymentAttemptListRow
} from '$lib/server/domains/payment-attempt/mappers/from-api/list';
import {
	isNoPayinVirtualAccountError,
	resolvePayinVirtualAccountNumber
} from '$lib/server/domains/virtual-account/mappers/from-api/payin-van';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function emptyCounts(): PaymentAttemptCardCounts {
	return { Payments: 0, Successful: 0, Pending: 0, Refunds: 0, Failed: 0 };
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('payment-attempts:list');

	const log = locals.logger.child({ action: 'payment-attempts-page' });
	const requestedLimit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);
	const search = url.searchParams.get('search')?.trim() || undefined;
	const searchField = url.searchParams.get('searchField')?.trim() || 'payinAttemptId';
	const status = url.searchParams.get('status')?.trim() || undefined;
	const paymentMethod = url.searchParams.get('type')?.trim() || undefined;
	const fromDate = url.searchParams.get('fromDate')?.trim() || undefined;
	const toDate = url.searchParams.get('toDate')?.trim() || undefined;

	const searchQuery = {
		orderId: searchField === 'orderId' ? search : undefined,
		payinAttemptId: searchField === 'payinAttemptId' ? search : undefined,
		settlementId: searchField === 'settlementId' ? search : undefined
	};

	const base = {
		payments: [] as PaymentAttemptListRow[],
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
			log.info('payment attempts — no PAYIN virtual account yet');
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
		paymentAttemptClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
			...searchQuery,
			paymentMethods: paymentMethod,
			statuses: mapPaymentAttemptUiStatus(status),
			fromDate,
			toDate,
			limit,
			page,
			virtualAccountNumber
		}),
		paymentAttemptClient.getCounts(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			virtualAccountNumber
		)
	]);

	let payments: PaymentAttemptListRow[] = [];
	let pagination = base.pagination;
	let listError: string | null = null;
	if (listResult.ok) {
		payments = mapPaymentAttemptListResponse(listResult.data.data);
		pagination = listResult.data.pagination;
	} else {
		listError = listResult.error.message;
		log.warn(
			{ kind: listResult.error.kind, message: listResult.error.message },
			'GET merchant payment attempts failed'
		);
	}

	let counts = emptyCounts();
	let countsError: string | null = null;
	if (countsResult.ok) {
		const apiCounts = countsResult.data.data[0];
		if (apiCounts) {
			counts = mapPaymentAttemptCardCounts(apiCounts);
		} else {
			countsError = 'Payment attempt counts are empty';
		}
	} else {
		countsError = countsResult.error.message;
		log.warn(
			{ kind: countsResult.error.kind, message: countsResult.error.message },
			'GET merchant payment attempt counts failed'
		);
	}

	return { payments, counts, pagination, listError, countsError, vanSetupMessage: null };
};
