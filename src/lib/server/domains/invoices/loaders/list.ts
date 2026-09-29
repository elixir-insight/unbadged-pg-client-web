import type { Logger } from 'pino';
import type { Invoice, InvoiceCounts } from '$lib/types/invoice';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { invoicesClient, type InvoiceListQuery } from '../client';
import {
	emptyInvoiceCounts,
	emptyInvoicePagination,
	mapInvoiceCardCounts,
	mapInvoiceListResponse
} from '../mappers/from-api/list';
import type { InvoicePagination } from '../schema';

export type InvoicesLoadResult = {
	invoices: Invoice[];
	pagination: InvoicePagination;
	counts: InvoiceCounts;
	listError: string | null;
	countsError: string | null;
};

export async function loadInvoicesList(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	query: InvoiceListQuery;
}): Promise<InvoicesLoadResult> {
	const limit = params.query.limit ?? 10;
	const page = params.query.page ?? 0;
	const empty = {
		invoices: [] as Invoice[],
		pagination: emptyInvoicePagination(limit, page),
		counts: emptyInvoiceCounts(),
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
		invoicesClient.list(params.fetch, params.log, session.accessToken, session.gatewayToken, {
			page,
			limit,
			orderId: params.query.orderId,
			statuses: params.query.statuses
		}),
		invoicesClient.getCounts(params.fetch, params.log, session.accessToken, session.gatewayToken)
	]);

	let invoices: Invoice[] = [];
	let pagination = emptyInvoicePagination(limit, page);
	let listError: string | null = null;

	if (listResult.ok) {
		invoices = mapInvoiceListResponse(listResult.data.data);
		pagination = listResult.data.pagination ?? {
			limit,
			page,
			total: invoices.length
		};
	} else {
		listError = listResult.error.message;
		params.log.warn(
			{ kind: listResult.error.kind, message: listResult.error.message },
			'GET invoices failed'
		);
	}

	let counts = emptyInvoiceCounts();
	let countsError: string | null = null;

	if (countsResult.ok) {
		const apiCounts = countsResult.data.data[0];
		if (apiCounts) {
			counts = mapInvoiceCardCounts(apiCounts);
		} else {
			countsError = 'Invoice counts are empty';
		}
	} else {
		countsError = countsResult.error.message;
		params.log.warn(
			{ kind: countsResult.error.kind, message: countsResult.error.message },
			'GET invoice counts failed'
		);
	}

	return { invoices, pagination, counts, listError, countsError };
}
