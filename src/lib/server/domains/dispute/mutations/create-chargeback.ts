import * as v from 'valibot';
import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import {
	mutationFailure,
	upstreamErrorToFailure,
	type MutationResult
} from '$lib/server/domains/organization/mutations/types';
import { CreateDisputeChargebackRequestSchema, disputeClient } from '../client';
import type { CreateDisputeChargebackRequest, DisputeChargebackItem } from '../schema';

export type CreateDisputeChargebackSuccess = {
	message: string;
	chargeback: DisputeChargebackItem | null;
};

function toApiAmount(value: string): string | null {
	const amount = Number(value.replace(/[₹,\s]/g, ''));
	if (!Number.isFinite(amount) || amount < 0) return null;
	return amount.toFixed(2);
}

export async function createDisputeChargebackMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	body: unknown;
}): Promise<MutationResult<CreateDisputeChargebackSuccess>> {
	const orgId = params.orgId.trim();
	const disputeId = params.disputeId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}
	if (!disputeId) {
		return mutationFailure(400, 'Dispute id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(CreateDisputeChargebackRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'create dispute chargeback rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid chargeback payload');
	}

	const additionalFees = toApiAmount(parsed.output.additionalFees || '0');
	const chargebackAmount = toApiAmount(parsed.output.chargebackAmount);
	const principalAmount = toApiAmount(parsed.output.principalAmount);

	if (!chargebackAmount) {
		return mutationFailure(400, 'Enter a valid chargeback amount');
	}
	if (!principalAmount) {
		return mutationFailure(400, 'Enter a valid principal amount');
	}
	if (additionalFees === null) {
		return mutationFailure(400, 'Enter a valid additional fees amount');
	}

	const body: CreateDisputeChargebackRequest = {
		additionalFees,
		bankReference: parsed.output.bankReference,
		chargebackAmount,
		currency: parsed.output.currency.toUpperCase(),
		notes: parsed.output.notes,
		principalAmount
	};

	params.log.info(
		{
			orgId,
			disputeId,
			chargebackAmount: body.chargebackAmount,
			principalAmount: body.principalAmount,
			currency: body.currency
		},
		'create dispute chargeback — POST upstream'
	);

	const result = await disputeClient.createChargeback(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		disputeId,
		body
	);

	if (!result.ok) {
		params.log.warn(
			{
				orgId,
				disputeId,
				message: result.error.message,
				kind: result.error.kind
			},
			'create dispute chargeback — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	const chargeback = result.data.data[0] ?? null;

	params.log.info(
		{
			orgId,
			disputeId,
			chargebackId: chargeback?.id,
			upstreamMessage: result.data.message
		},
		'create dispute chargeback — success'
	);

	return {
		ok: true,
		message: result.data.message ?? 'Dispute chargeback recorded successfully',
		chargeback
	};
}
