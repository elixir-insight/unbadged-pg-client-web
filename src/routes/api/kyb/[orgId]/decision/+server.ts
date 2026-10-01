import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { organizationClient } from '$lib/server/domains/organization/client';
import type { ReviewDecision } from '$lib/kyb-review/types';

function readDecision(value: unknown): ReviewDecision | null {
	if (!value || typeof value !== 'object') return null;
	const record = value as Record<string, unknown>;
	const profileStatus = record.profileStatus;
	if (profileStatus !== 'APPROVED' && profileStatus !== 'REMARKED') return null;
	const remarks = typeof record.remarks === 'string' ? record.remarks.trim() : '';
	// Sending remarks back to the merchant without any remarks would tell them nothing.
	if (profileStatus === 'REMARKED' && !remarks) return null;
	return { profileStatus, remarks };
}

/** Finishes a KYB review: PUT .../organization/{orgId}/status with APPROVED or REMARKED. */
export const PUT: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
	// Matches preview activate/approve — finishing KYB is an approve action, not a draft write.
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'approve');

	const orgId = params.orgId?.trim() ?? '';
	if (!orgId) {
		error(400, { message: 'Organization id is required' });
	}

	const body: unknown = await request.json().catch(() => null);
	const decision = readDecision(body);
	if (!decision) {
		return json({ message: 'A valid review decision is required' }, { status: 400 });
	}

	const log = locals.logger.child({ action: 'put-kyb-decision', orgId });
	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (cause) {
		if (cause instanceof SessionInactiveError || cause instanceof SessionError) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}
		throw cause;
	}

	const result = await organizationClient.updateStatus(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		decision
	);

	if (!result.ok) {
		const status = result.error.kind === 'http' ? result.error.status : 502;
		log.warn({ decision, error: result.error }, 'PUT review decision failed');
		return json({ message: result.error.message }, { status });
	}

	return json({
		message:
			result.data.message ??
			(decision.profileStatus === 'APPROVED' ? 'Organization approved' : 'Remarks sent')
	});
};
