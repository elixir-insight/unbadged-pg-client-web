import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiFetch } from '$lib/server/http/fetchClient';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { UpdateOrganizationResponseSchema } from '$lib/server/domains/organization/schema';
import type { RemarkEntry, SectionPayload } from '$lib/kyb-review/types';

function isRemarkList(value: unknown): value is RemarkEntry[] {
	if (!Array.isArray(value)) return false;
	return value.every((entry) => {
		if (!entry || typeof entry !== 'object') return false;
		const record = entry as Record<string, unknown>;
		return (
			typeof record.fieldName === 'string' &&
			record.fieldName.trim().length > 0 &&
			typeof record.remarks === 'string'
		);
	});
}

function isStringList(value: unknown): value is string[] {
	return (
		Array.isArray(value) &&
		value.every((item) => typeof item === 'string' && item.trim().length > 0)
	);
}

function readPayload(value: unknown): SectionPayload | null {
	if (!value || typeof value !== 'object') return null;
	const record = value as Record<string, unknown>;
	const payload: SectionPayload = {};

	if ('verified' in record) {
		if (!isStringList(record.verified)) return null;
		if (record.verified.length > 0) payload.verified = record.verified;
	}

	if ('rejected' in record) {
		if (!isRemarkList(record.rejected)) return null;
		if (record.rejected.length > 0) payload.rejected = record.rejected;
	}

	if ('resetToPending' in record) {
		if (!isStringList(record.resetToPending)) return null;
		if (record.resetToPending.length > 0) payload.resetToPending = record.resetToPending;
	}

	if (!payload.verified && !payload.rejected && !payload.resetToPending) return null;
	return payload;
}

export const PATCH: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');

	const orgId = params.orgId?.trim() ?? '';
	if (!orgId) {
		error(400, { message: 'Organization id is required' });
	}

	const body: unknown = await request.json().catch(() => null);
	const payload = readPayload(body);
	if (!payload) {
		return json({ message: 'At least one verification change is required' }, { status: 400 });
	}

	const log = locals.logger.child({ action: 'patch-kyb-verifications', orgId });
	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (cause) {
		if (cause instanceof SessionInactiveError || cause instanceof SessionError) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}
		throw cause;
	}

	const result = await apiFetch(
		`api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/verifications`,
		{
			fetch,
			logger: log,
			method: 'PATCH',
			accessToken: tokens.accessToken,
			gatewayToken: tokens.gatewayToken,
			body: payload,
			schema: UpdateOrganizationResponseSchema
		}
	);

	if (!result.ok) {
		const status = result.error.kind === 'http' ? result.error.status : 502;
		log.warn({ payload, error: result.error }, 'PATCH verifications failed');
		return json({ message: result.error.message, request: payload }, { status });
	}

	log.info({ payload, response: result.data }, 'PATCH verifications succeeded');
	return json({
		message: result.data.message ?? 'Review submitted',
		request: payload,
		response: result.data
	});
};
