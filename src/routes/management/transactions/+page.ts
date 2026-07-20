import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { getDefaultScope } from '$lib/data/management-van-mock';
import { scopeQueryString } from '$lib/utils/transaction-scope';

export function load() {
	const scope = getDefaultScope();
	throw redirect(
		303,
		`${resolve('/management/transactions/collections/orders')}${scopeQueryString(scope)}`
	);
}
