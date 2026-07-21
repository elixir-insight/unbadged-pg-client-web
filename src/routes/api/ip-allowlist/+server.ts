import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { ipAllowlistClient, parseIpAllowlistPortal } from '$lib/server/domains/ip-allowlist/client';
import { CreateIpAllowlistRequestSchema } from '$lib/server/domains/ip-allowlist/schema';

function resolveOrgId(locals: App.Locals): string | null {
	const orgId = locals.merchantSession?.organizationId?.trim();
	return orgId || null;
}

export const GET: RequestHandler = async ({ url, cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = locals.gatewayToken;

	if (!accessToken || !gatewayToken) {
		return json({ message: 'Not authenticated' }, { status: 401 });
	}

	const portal = parseIpAllowlistPortal(url.searchParams.get('portal'));
	if (!portal) {
		return json({ message: 'Invalid portal' }, { status: 400 });
	}

	const orgId = resolveOrgId(locals);
	if (!orgId) {
		return json({ message: 'Organization context is missing' }, { status: 400 });
	}

	const result = await ipAllowlistClient.list(
		fetch,
		locals.logger,
		accessToken,
		gatewayToken,
		portal,
		orgId
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		if (result.error.kind === 'validation') {
			locals.logger.warn(
				{ issues: result.error.issues },
				'ip-allowlist: response failed schema validation'
			);
			return json({ message: 'Unexpected response shape from backend' }, { status: 502 });
		}
		// network — couldn't reach the backend at all (DNS, timeout, connection refused, etc.)
		return json({ message: result.error.message }, { status: 503 });
	}

	return json(result.data);
};

export const POST: RequestHandler = async ({ url, request, cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = locals.gatewayToken;

	if (!accessToken || !gatewayToken) {
		return json({ message: 'Not authenticated' }, { status: 401 });
	}

	const portal = parseIpAllowlistPortal(url.searchParams.get('portal'));
	if (!portal) {
		return json({ message: 'Invalid portal' }, { status: 400 });
	}

	const orgId = resolveOrgId(locals);
	if (!orgId) {
		return json({ message: 'Organization context is missing' }, { status: 400 });
	}

	const rawBody: unknown = await request.json().catch(() => null);
	const parsedBody = v.safeParse(CreateIpAllowlistRequestSchema, rawBody);
	if (!parsedBody.success) {
		return json({ message: 'IP address is required' }, { status: 400 });
	}

	const result = await ipAllowlistClient.create(
		fetch,
		locals.logger,
		accessToken,
		gatewayToken,
		parsedBody.output,
		portal,
		orgId
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		if (result.error.kind === 'validation') {
			locals.logger.warn(
				{ issues: result.error.issues },
				'ip-allowlist: create response failed schema validation'
			);
			return json({ message: 'Unexpected response shape from backend' }, { status: 502 });
		}
		return json({ message: result.error.message }, { status: 503 });
	}

	return json(result.data);
};
