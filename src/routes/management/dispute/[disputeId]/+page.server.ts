import type { PageServerLoad } from './$types';
import { loadDisputeById } from '$lib/server/domains/dispute/loaders/get-by-id';
import type { DisputeDetailView } from '$lib/server/domains/dispute/mappers/from-api/details';
import type { DisputeTimelineEventView } from '$lib/utils/dispute-status';

function resolveOrgId(
	raw: string | null,
	merchantOptions: { value: string; label: string }[]
): string {
	if (raw && merchantOptions.some((merchant) => merchant.value === raw)) return raw;
	return merchantOptions[0]?.value ?? '';
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
	depends('management-disputes:detail');

	const disputeId = params.disputeId?.trim() ?? '';
	const parentData = await parent();
	const orgId = resolveOrgId(url.searchParams.get('merchantId'), parentData.merchantOptions);
	const organizationName =
		parentData.merchantOptions.find((merchant) => merchant.value === orgId)?.label ?? orgId;
	const log = locals.logger.child({ action: 'management-dispute-detail', disputeId, orgId });

	const empty = {
		disputeId,
		orgId,
		dispute: null as DisputeDetailView | null,
		disputeError: null as string | null,
		events: [] as DisputeTimelineEventView[],
		eventsError: null as string | null
	};

	if (!disputeId) {
		return { ...empty, disputeError: 'Dispute id is required' };
	}

	if (!orgId) {
		return {
			...empty,
			disputeError: parentData.merchantsError ?? 'No merchants are available.'
		};
	}

	const result = await loadDisputeById({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		organizationName
	});

	return {
		disputeId,
		orgId,
		dispute: result.dispute,
		disputeError: result.disputeError,
		events: result.events,
		eventsError: result.eventsError
	};
};
