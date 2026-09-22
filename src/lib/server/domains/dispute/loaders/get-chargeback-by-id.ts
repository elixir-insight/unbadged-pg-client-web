import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { disputeClient, type DisputePortal } from '../client';
import {
	mapChargebackDetailItem,
	type ChargebackDetailRow
} from '../mappers/from-api/chargeback-detail';
import type { DisputeChargebackItem } from '../schema';

export type ChargebackByIdLoadResult = {
	chargeback: ChargebackDetailRow | null;
	chargebackError: string | null;
};

function normalizeChargebackData(
	data: DisputeChargebackItem | DisputeChargebackItem[] | undefined
): DisputeChargebackItem | null {
	if (!data) return null;
	if (Array.isArray(data)) return data[0] ?? null;
	return data;
}

export async function loadChargebackById(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	chargebackId: string;
	portal?: DisputePortal;
}): Promise<ChargebackByIdLoadResult> {
	const orgId = params.orgId.trim();
	const disputeId = params.disputeId.trim();
	const chargebackId = params.chargebackId.trim();
	const portal = params.portal ?? 'management';
	const empty = {
		chargeback: null as ChargebackDetailRow | null,
		chargebackError: null as string | null
	};

	if (!orgId) {
		return { ...empty, chargebackError: 'Organization id is required' };
	}
	if (!disputeId) {
		return { ...empty, chargebackError: 'Dispute id is required' };
	}
	if (!chargebackId) {
		return { ...empty, chargebackError: 'Chargeback id is required' };
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return { ...empty, chargebackError: session.message };
	}

	const result = await disputeClient.getChargebackById(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		disputeId,
		chargebackId,
		portal
	);

	if (!result.ok) {
		params.log.warn(
			{
				orgId,
				disputeId,
				chargebackId,
				portal,
				message: result.error.message,
				kind: result.error.kind
			},
			'GET chargeback detail failed'
		);
		return { ...empty, chargebackError: result.error.message };
	}

	const item = normalizeChargebackData(result.data.data);
	if (!item) {
		return { ...empty, chargebackError: 'Chargeback not found' };
	}

	return {
		chargeback: mapChargebackDetailItem(item),
		chargebackError: null
	};
}
