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
import { invoicesClient } from '../client';
import { buildCreateInvoiceRequest } from '../mappers/to-api/create';
import {
	CreateInvoiceClientRequestSchema,
	type CreateInvoiceClientRequest,
	type CreateInvoiceCreated
} from '../schema';

export type CreateInvoiceSuccess = {
	created: CreateInvoiceCreated;
};

export async function createInvoiceMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	body: CreateInvoiceClientRequest;
}): Promise<MutationResult<CreateInvoiceSuccess>> {
	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(CreateInvoiceClientRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'create invoice rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid invoice payload');
	}

	const upstreamBody = buildCreateInvoiceRequest(parsed.output);

	const result = await invoicesClient.create(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		upstreamBody
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		created: result.data
	};
}
