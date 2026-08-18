import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import type { DisputeTimelineEventView } from '$lib/utils/dispute-status';
import { disputeClient } from '../client';
import { mapDisputeDetail, type DisputeDetailView } from '../mappers/from-api/details';
import { mapDisputeEvents } from '../mappers/from-api/events';

export type DisputeDetailLoadResult = {
	dispute: DisputeDetailView | null;
	disputeError: string | null;
	events: DisputeTimelineEventView[];
	eventsError: string | null;
};

export async function loadDisputeById(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	organizationName?: string;
}): Promise<DisputeDetailLoadResult> {
	const orgId = params.orgId.trim();
	const disputeId = params.disputeId.trim();
	const empty = {
		dispute: null as DisputeDetailView | null,
		disputeError: null as string | null,
		events: [] as DisputeTimelineEventView[],
		eventsError: null as string | null
	};

	if (!orgId) {
		return { ...empty, disputeError: 'Organization id is required' };
	}

	if (!disputeId) {
		return { ...empty, disputeError: 'Dispute id is required' };
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return { ...empty, disputeError: session.message, eventsError: session.message };
	}

	const [detailResult, eventsResult] = await Promise.all([
		disputeClient.getById(
			params.fetch,
			params.log,
			session.accessToken,
			session.gatewayToken,
			orgId,
			disputeId
		),
		disputeClient.listEvents(
			params.fetch,
			params.log,
			session.accessToken,
			session.gatewayToken,
			orgId,
			disputeId
		)
	]);

	if (!detailResult.ok) {
		params.log.warn(
			{ orgId, disputeId, message: detailResult.error.message, kind: detailResult.error.kind },
			'GET dispute detail failed'
		);
		empty.disputeError = detailResult.error.message;
	} else {
		const item = detailResult.data.data[0];
		if (!item) {
			empty.disputeError = 'Dispute not found';
		} else {
			empty.dispute = mapDisputeDetail(item, params.organizationName);
		}
	}

	if (!eventsResult.ok) {
		params.log.warn(
			{ orgId, disputeId, message: eventsResult.error.message, kind: eventsResult.error.kind },
			'GET dispute events failed'
		);
		empty.eventsError = eventsResult.error.message;
	} else {
		empty.events = mapDisputeEvents(eventsResult.data.data);
	}

	return empty;
}
