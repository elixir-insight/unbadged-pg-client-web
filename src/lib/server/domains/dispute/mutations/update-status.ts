import * as v from 'valibot';
import type { Logger } from 'pino';
import { requireSession } from '$lib/server/domains/organization/mutations/session';
import {
	mutationFailure,
	type MutationResult
} from '$lib/server/domains/organization/mutations/types';
import { UpdateDisputeStatusRequestSchema } from '../client';
import { updateDisputeMutation } from './update';

export type UpdateDisputeStatusSuccess = {
	message: string;
	status: string;
};

export async function updateDisputeStatusMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	body: unknown;
}): Promise<MutationResult<UpdateDisputeStatusSuccess>> {
	const parsed = v.safeParse(UpdateDisputeStatusRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'update dispute status rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid status payload');
	}

	const result = await updateDisputeMutation({
		fetch: params.fetch,
		log: params.log,
		cookies: params.cookies,
		orgId: params.orgId,
		disputeId: params.disputeId,
		body: { status: parsed.output.toStatus }
	});

	if (!result.ok) return result;

	return {
		ok: true,
		message: result.message,
		status: result.status
	};
}
