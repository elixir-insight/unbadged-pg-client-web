import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { virtualAccountClient } from '../client';
import { createVirtualAccountMutation } from '../mutations/create';
import { findPayinVirtualAccount } from '../mappers/from-api/payin-van';
import { DEFAULT_ACTIVATE_VIRTUAL_ACCOUNT_REQUEST } from '../schema';

export type PayinVanSummary = {
	virtualAccountNumber: string;
	pipelineCode: string;
	pipelineClass: string;
	status: string;
};

export type EnsurePayinVanResult = {
	payinVan: PayinVanSummary | null;
	vanError: string | null;
	vanCreated: boolean;
};

function toPayinVanSummary(
	account: NonNullable<ReturnType<typeof findPayinVirtualAccount>>
): PayinVanSummary {
	return {
		virtualAccountNumber: account.virtualAccountNumber,
		pipelineCode: account.pipelineCode?.trim() ?? '',
		pipelineClass: account.pipelineClass?.trim() ?? '',
		status: account.status?.trim() ?? ''
	};
}

async function listPayinVan(params: {
	fetch: typeof fetch;
	log: Logger;
	accessToken: string;
	gatewayToken: string;
	orgId: string;
}): Promise<EnsurePayinVanResult | null> {
	const listResult = await virtualAccountClient.listByOrganization(
		params.fetch,
		params.log,
		params.accessToken,
		params.gatewayToken,
		params.orgId
	);

	if (!listResult.ok) {
		return {
			payinVan: null,
			vanError: listResult.error.message,
			vanCreated: false
		};
	}

	const payinAccount = findPayinVirtualAccount(listResult.data.data);
	if (!payinAccount) {
		return null;
	}

	return {
		payinVan: toPayinVanSummary(payinAccount),
		vanError: null,
		vanCreated: false
	};
}

/**
 * Returns the org's PAYIN VAN, creating one with the activation defaults when missing.
 */
export async function ensurePayinVirtualAccount(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
}): Promise<EnsurePayinVanResult> {
	const orgId = params.orgId.trim();
	if (!orgId) {
		return {
			payinVan: null,
			vanError: 'Organization id is required',
			vanCreated: false
		};
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return {
			payinVan: null,
			vanError: session.message,
			vanCreated: false
		};
	}

	const existing = await listPayinVan({
		fetch: params.fetch,
		log: params.log,
		accessToken: session.accessToken,
		gatewayToken: session.gatewayToken,
		orgId
	});
	if (existing?.payinVan || existing?.vanError) {
		return existing;
	}

	const createResult = await createVirtualAccountMutation({
		fetch: params.fetch,
		log: params.log,
		cookies: params.cookies,
		orgId,
		body: DEFAULT_ACTIVATE_VIRTUAL_ACCOUNT_REQUEST
	});

	if (!createResult.ok) {
		params.log.warn({ orgId, message: createResult.message }, 'auto-create PAYIN VAN failed');
		return {
			payinVan: null,
			vanError: createResult.message,
			vanCreated: false
		};
	}

	const payinFromCreate = findPayinVirtualAccount(createResult.accounts);
	if (payinFromCreate) {
		return {
			payinVan: toPayinVanSummary(payinFromCreate),
			vanError: null,
			vanCreated: true
		};
	}

	const afterCreate = await listPayinVan({
		fetch: params.fetch,
		log: params.log,
		accessToken: session.accessToken,
		gatewayToken: session.gatewayToken,
		orgId
	});

	if (afterCreate?.payinVan) {
		return { ...afterCreate, vanCreated: true };
	}

	return {
		payinVan: null,
		vanError: afterCreate?.vanError ?? 'Virtual account was created but could not be loaded',
		vanCreated: true
	};
}
