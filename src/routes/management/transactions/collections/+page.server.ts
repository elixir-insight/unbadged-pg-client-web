import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';
import { getDefaultScope } from '$lib/utils/management-merchant-catalog';
import { scopeQueryString } from '$lib/utils/transaction-scope';

export const load: PageServerLoad = async ({ parent }) => {
	const { merchants, vans } = await parent();
	const scope = getDefaultScope(merchants, vans);
	const path = resolve('/management/transactions/collections/payments');
	throw redirect(303, scope ? `${path}${scopeQueryString(scope)}` : path);
};
