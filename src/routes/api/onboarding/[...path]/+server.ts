import { error, json } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { resolveOnboardingUpstreamPath } from '$lib/server/domains/onboarding/routes';
import { apiFetch } from '$lib/server/http/fetchClient';
import { hasUnapprovedGroup } from '$lib/stores/auth/portal';

const handle: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
	// Self-onboarding endpoints are only for orgs that have not been approved yet.
	if (!hasUnapprovedGroup(locals.merchantSession?.groups)) {
		error(403, { message: 'Onboarding is not available for this account' });
	}

	const upstreamPath = resolveOnboardingUpstreamPath(request.method, params.path ?? '');
	if (!upstreamPath) {
		error(404, { message: 'Not found' });
	}

	const log = locals.logger.child({ action: 'self-onboarding', method: request.method });

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (cause) {
		if (cause instanceof SessionError) {
			error(401, { message: 'Unauthorized' });
		}
		throw cause;
	}

	const hasBody = request.method === 'POST' || request.method === 'PUT';
	const isMultipart = (request.headers.get('content-type') ?? '').startsWith('multipart/form-data');
	// FormData bodies (document uploads) pass straight through — apiFetch already forwards a
	// FormData body as-is and lets fetch set its own multipart boundary header.
	const body = hasBody
		? await (isMultipart ? request.formData() : request.json()).catch(() => undefined)
		: undefined;

	const result = await apiFetch(upstreamPath, {
		fetch,
		logger: log,
		method: request.method as 'GET' | 'POST' | 'PUT',
		accessToken: tokens.accessToken,
		gatewayToken: tokens.gatewayToken,
		body,
		schema: v.unknown()
	});

	if (!result.ok) {
		log.warn({ kind: result.error.kind, message: result.error.message }, 'onboarding call failed');
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		return json({ message: result.error.message }, { status: 502 });
	}

	return json(result.data);
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
