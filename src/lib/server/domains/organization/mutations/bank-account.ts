import * as v from 'valibot';
import type { Logger } from 'pino';
import { organizationClient } from '$lib/server/domains/organization/client';
import { extractBankAccountId } from '$lib/server/domains/organization/extract-bank-id';
import {
	AddBankFormBodySchema,
	buildAddOrganizationBankRequest,
	buildUpdateOrganizationBankRequest,
	type AddBankFormBody
} from '$lib/server/domains/organization/map-bank-request';
import { isSessionFailure, requireSession } from './session';
import { mutationFailure, upstreamErrorToFailure, type MutationResult } from './types';

export type AddBankAccountSuccess = {
	accountId: string | null;
	message: string;
};

export type UpdateBankAccountSuccess = {
	message: string;
};

export async function addBankAccountMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	body: AddBankFormBody;
}): Promise<MutationResult<AddBankAccountSuccess>> {
	const orgId = params.orgId.trim();
	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(AddBankFormBodySchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'add bank rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid bank account payload');
	}

	let upstreamBody;
	try {
		upstreamBody = buildAddOrganizationBankRequest(parsed.output);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Invalid bank account payload';
		params.log.warn({ message }, 'add bank rejected — mapping failed');
		return mutationFailure(400, message);
	}

	const result = await organizationClient.addBank(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		upstreamBody
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		accountId: extractBankAccountId(result.data),
		message: result.data.message ?? 'Bank account added successfully'
	};
}

export async function updateBankAccountMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	accountId: string;
	body: AddBankFormBody;
}): Promise<MutationResult<UpdateBankAccountSuccess>> {
	const orgId = params.orgId.trim();
	const accountId = params.accountId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}
	if (!accountId) {
		return mutationFailure(400, 'Bank account id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(AddBankFormBodySchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'update bank rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid bank account payload');
	}

	let upstreamBody;
	try {
		upstreamBody = buildUpdateOrganizationBankRequest(parsed.output);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Invalid bank account payload';
		params.log.warn({ message }, 'update bank rejected — mapping failed');
		return mutationFailure(400, message);
	}

	const result = await organizationClient.updateBank(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		accountId,
		upstreamBody
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Bank account updated successfully'
	};
}
