import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { createCommissionConfigurationsMutation } from '$lib/server/domains/commission-configuration/mutations/create';
import { loadCommissionConfigurations } from '$lib/server/domains/commission-configuration/loaders/list-by-organization';
import type { CreateCommissionConfigurationsRequest } from '$lib/server/domains/commission-configuration/schema';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

function summarizeCommissionConfigBody(body: CreateCommissionConfigurationsRequest) {
	return {
		commissionConfigCount: body.commissionConfig.length,
		methodConfigIds: [...new Set(body.commissionConfig.map((item) => String(item.methodConfigId)))],
		pipelineCodes: [...new Set(body.commissionConfig.map((item) => item.pipelineCode))],
		vaNumbers: [...new Set(body.commissionConfig.map((item) => item.vaNumber))]
	};
}

export const GET: RequestHandler = async ({ params, url, cookies, locals, fetch }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'read');
	const orgId = params.orgId?.trim() ?? '';
	const vaNumber = url.searchParams.get('vaNumber')?.trim() ?? '';
	const log = locals.logger.child({ action: 'commission-configurations' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	if (!vaNumber) {
		return json({ message: 'Virtual account number is required' }, { status: 400 });
	}

	try {
		await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return json({ message: error.message }, { status: 401 });
		}
		throw error;
	}

	const result = await loadCommissionConfigurations({
		fetch,
		log,
		cookies,
		orgId,
		vaNumber
	});

	if (result.commissionConfigurationsError) {
		const status = result.commissionConfigurationsError.toLowerCase().includes('authenticated')
			? 401
			: 502;
		return json({ message: result.commissionConfigurationsError }, { status });
	}

	return json({
		configurations: result.commissionConfigurations,
		message: 'Commission configurations retrieved successfully'
	});
};

export const POST: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
	const orgId = params.orgId?.trim() ?? '';
	const log = locals.logger.child({ action: 'commission-configurations-create' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object' || !('commissionConfig' in body)) {
		return json({ message: 'Invalid commission configuration payload' }, { status: 400 });
	}

	const commissionConfigBody = body as CreateCommissionConfigurationsRequest;
	if (Array.isArray(commissionConfigBody.commissionConfig)) {
		log.info(
			{
				orgId,
				...summarizeCommissionConfigBody(commissionConfigBody)
			},
			'commission configurations tab — POST request received'
		);
	} else {
		log.info(
			{ orgId },
			'commission configurations tab — POST request received (invalid commissionConfig)'
		);
	}

	const result = await createCommissionConfigurationsMutation({
		fetch,
		log,
		cookies,
		orgId,
		body: commissionConfigBody
	});

	if (!result.ok) {
		log.warn(
			{ orgId, status: result.status, message: result.message },
			'commission configurations tab — POST failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info({ orgId, message: result.message }, 'commission configurations tab — POST succeeded');

	return json({ message: result.message }, { status: 201 });
};
