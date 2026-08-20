import type { PageServerLoad } from './$types';
import { loadDisputeById } from '$lib/server/domains/dispute/loaders/get-by-id';
import type { DisputeDetailView } from '$lib/server/domains/dispute/mappers/from-api/details';
import {
	emptyDisputeDocumentsByType,
	type DisputeDocumentsByType
} from '$lib/utils/dispute-documents';
import type { DisputeTimelineEventView } from '$lib/utils/dispute-status';

export const load: PageServerLoad = async ({ params, cookies, fetch, locals, depends }) => {
	depends('merchant-disputes:detail');

	const disputeId = params.disputeId?.trim() ?? '';
	const orgId =
		locals.merchantSession?.displayOrgId?.trim() ||
		locals.merchantSession?.organizationId?.trim() ||
		'';
	const organizationName = locals.merchantSession?.merchantName?.trim() || orgId;
	const log = locals.logger.child({ action: 'merchant-dispute-detail', disputeId, orgId });

	const empty = {
		disputeId,
		orgId,
		dispute: null as DisputeDetailView | null,
		disputeError: null as string | null,
		events: [] as DisputeTimelineEventView[],
		eventsError: null as string | null,
		documents: emptyDisputeDocumentsByType() as DisputeDocumentsByType,
		documentsError: null as string | null
	};

	if (!disputeId) {
		return { ...empty, disputeError: 'Dispute id is required' };
	}

	if (!orgId) {
		return {
			...empty,
			disputeError: 'Organization id is unavailable for this session.'
		};
	}

	const result = await loadDisputeById({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		organizationName,
		portal: 'merchant',
		includeEvents: false,
		includeDocuments: false
	});

	return {
		disputeId,
		orgId,
		dispute: result.dispute,
		disputeError: result.disputeError,
		events: result.events,
		eventsError: result.eventsError,
		documents: result.documents,
		documentsError: result.documentsError
	};
};
