import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import {
	emptyDisputeDocumentsByType,
	type DisputeDocumentsByType
} from '$lib/utils/dispute-documents';
import type { DisputeStatusOption, DisputeTimelineEventView } from '$lib/utils/dispute-status';
import { disputeClient, type DisputePortal } from '../client';
import { mapDisputeDetail, type DisputeDetailView } from '../mappers/from-api/details';
import { mapDisputeDocumentsGrouped } from '../mappers/from-api/documents';
import { mapDisputeEvents } from '../mappers/from-api/events';

export type DisputeDetailLoadResult = {
	dispute: DisputeDetailView | null;
	disputeError: string | null;
	events: DisputeTimelineEventView[];
	eventsError: string | null;
	documents: DisputeDocumentsByType;
	documentsError: string | null;
	hasChargeback: boolean;
};

export async function loadDisputeById(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	organizationName?: string;
	statuses?: DisputeStatusOption[];
	portal?: DisputePortal;
	includeEvents?: boolean;
	includeDocuments?: boolean;
	includeChargebacks?: boolean;
}): Promise<DisputeDetailLoadResult> {
	const orgId = params.orgId.trim();
	const disputeId = params.disputeId.trim();
	const portal = params.portal ?? 'management';
	const includeEvents = params.includeEvents ?? portal === 'management';
	const includeDocuments = params.includeDocuments ?? portal === 'management';
	const includeChargebacks = params.includeChargebacks ?? portal === 'management';
	const empty = {
		dispute: null as DisputeDetailView | null,
		disputeError: null as string | null,
		events: [] as DisputeTimelineEventView[],
		eventsError: null as string | null,
		documents: emptyDisputeDocumentsByType(),
		documentsError: null as string | null,
		hasChargeback: false
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
		return {
			...empty,
			disputeError: session.message,
			eventsError: includeEvents ? session.message : null,
			documentsError: includeDocuments ? session.message : null
		};
	}

	const [detailResult, eventsResult, documentsResult, chargebacksResult] = await Promise.all([
		disputeClient.getById(
			params.fetch,
			params.log,
			session.accessToken,
			session.gatewayToken,
			orgId,
			disputeId,
			portal
		),
		includeEvents
			? disputeClient.listEvents(
					params.fetch,
					params.log,
					session.accessToken,
					session.gatewayToken,
					orgId,
					disputeId,
					portal
				)
			: Promise.resolve(null),
		includeDocuments
			? disputeClient.listDocuments(
					params.fetch,
					params.log,
					session.accessToken,
					session.gatewayToken,
					orgId,
					disputeId,
					portal
				)
			: Promise.resolve(null),
		includeChargebacks
			? disputeClient.listChargebacksByOrganization(
					params.fetch,
					params.log,
					session.accessToken,
					session.gatewayToken,
					orgId,
					{ limit: 100, page: 0 },
					portal
				)
			: Promise.resolve(null)
	]);

	if (!detailResult.ok) {
		params.log.warn(
			{
				orgId,
				disputeId,
				portal,
				message: detailResult.error.message,
				kind: detailResult.error.kind
			},
			'GET dispute detail failed'
		);
		empty.disputeError = detailResult.error.message;
	} else {
		const item = detailResult.data.data[0];
		if (!item) {
			empty.disputeError = 'Dispute not found';
		} else {
			empty.dispute = mapDisputeDetail(item, params.organizationName, params.statuses);
		}
	}

	if (eventsResult) {
		if (!eventsResult.ok) {
			params.log.warn(
				{
					orgId,
					disputeId,
					portal,
					message: eventsResult.error.message,
					kind: eventsResult.error.kind
				},
				'GET dispute events failed'
			);
			empty.eventsError = eventsResult.error.message;
		} else {
			empty.events = mapDisputeEvents(eventsResult.data.data, params.statuses);
		}
	}

	if (documentsResult) {
		if (!documentsResult.ok) {
			params.log.warn(
				{
					orgId,
					disputeId,
					portal,
					message: documentsResult.error.message,
					kind: documentsResult.error.kind
				},
				'GET dispute documents failed'
			);
			empty.documentsError = documentsResult.error.message;
		} else {
			empty.documents = mapDisputeDocumentsGrouped(documentsResult.data.data[0]);
		}
	}

	if (chargebacksResult) {
		if (!chargebacksResult.ok) {
			params.log.warn(
				{
					orgId,
					disputeId,
					message: chargebacksResult.error.message,
					kind: chargebacksResult.error.kind
				},
				'GET organization chargebacks failed'
			);
		} else {
			const normalizedDisputeId = disputeId.toUpperCase();
			const items = chargebacksResult.data.data ?? [];
			empty.hasChargeback = items.some((item) => {
				const itemDisputeId =
					item.disputeId === null || item.disputeId === undefined
						? ''
						: String(item.disputeId).trim().toUpperCase();
				return itemDisputeId === normalizedDisputeId;
			});
			params.log.info(
				{
					orgId,
					disputeId,
					hasChargeback: empty.hasChargeback,
					totalReturned: items.length
				},
				'resolved hasChargeback for raise-chargeback button'
			);
		}
	}

	return empty;
}
