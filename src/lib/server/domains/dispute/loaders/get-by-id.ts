import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { disputeClient } from '../client';
import { mapDisputeDetail, type DisputeDetailView } from '../mappers/from-api/details';

export type DisputeDetailLoadResult = {
	dispute: DisputeDetailView | null;
	disputeError: string | null;
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

	if (!orgId) {
		return { dispute: null, disputeError: 'Organization id is required' };
	}

	if (!disputeId) {
		return { dispute: null, disputeError: 'Dispute id is required' };
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return { dispute: null, disputeError: session.message };
	}

	const result = await disputeClient.getById(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		disputeId
	);

	if (!result.ok) {
		params.log.warn(
			{ orgId, disputeId, message: result.error.message, kind: result.error.kind },
			'GET dispute detail failed'
		);
		return { dispute: null, disputeError: result.error.message };
	}

	const item = result.data.data[0];
	if (!item) {
		return { dispute: null, disputeError: 'Dispute not found' };
	}

	return {
		dispute: mapDisputeDetail(item, params.organizationName),
		disputeError: null
	};
}
