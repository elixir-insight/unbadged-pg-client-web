import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPartnerMerchantById, getPartnerSettlementEntries } from './data';

export const load: PageLoad = async ({ params, depends }) => {
	depends('partner:settlements');

	const merchant = await getPartnerMerchantById(params.merchantId);
	if (!merchant) {
		error(404, 'Merchant not found');
	}

	const entries = await getPartnerSettlementEntries(params.merchantId);

	return { merchant, entries };
};
