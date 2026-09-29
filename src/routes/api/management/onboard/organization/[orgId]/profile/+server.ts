import { error, json } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { requirePortalAccess } from '$lib/server/domains/auth/requirePortalAccess';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { organizationClient } from '$lib/server/domains/organization/client';
import { UpdateOrganizationProfileRequestSchema } from '$lib/server/domains/organization/schema';

export const GET: RequestHandler = async ({ params, cookies, fetch, locals }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'read');
	const orgId = params.orgId?.trim();
	if (!orgId) {
		error(400, { message: 'Organization id is required' });
	}

	const log = locals.logger.child({ action: 'get-organization-profile', orgId });

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (cause) {
		if (cause instanceof SessionError) {
			error(401, { message: 'Unauthorized' });
		}
		throw cause;
	}

	if (!locals.merchantSession) {
		error(401, { message: 'Unauthorized' });
	}
	requirePortalAccess('/management', locals.merchantSession);

	const result = await organizationClient.getProfile(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId
	);

	if (!result.ok) {
		log.warn(
			{ kind: result.error.kind, message: result.error.message },
			'organization profile fetch failed'
		);
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	const profile = result.data.data[0];
	if (!profile) {
		error(404, { message: 'Organization profile not found' });
	}

	return json({ profile });
};

/** KYB approval step 1: PATCH .../organization/{orgId}/profile before the status is set to APPROVED. */
export const PATCH: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
	const orgId = params.orgId?.trim();
	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	const parsed = v.safeParse(
		UpdateOrganizationProfileRequestSchema,
		await request.json().catch(() => null)
	);
	if (!parsed.success) {
		return json(
			{ message: parsed.issues[0]?.message ?? 'Invalid profile payload' },
			{ status: 400 }
		);
	}

	const log = locals.logger.child({ action: 'patch-organization-profile', orgId });

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (cause) {
		if (cause instanceof SessionError) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}
		throw cause;
	}

	if (!locals.merchantSession) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}
	requirePortalAccess('/management', locals.merchantSession);

	const result = await organizationClient.updateProfile(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		parsed.output
	);

	if (!result.ok) {
		const status = result.error.kind === 'http' ? result.error.status : 502;
		log.warn({ body: parsed.output, error: result.error }, 'organization profile update failed');
		return json({ message: result.error.message }, { status });
	}

	return json({ message: result.data.message ?? 'Organization profile updated' });
};
