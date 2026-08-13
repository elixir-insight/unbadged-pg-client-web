import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { createChargeConfigurationsMutation } from '$lib/server/domains/charge-configuration/mutations/create';
import { loadChargeConfigurations } from '$lib/server/domains/charge-configuration/loaders/list-by-organization';
import type { CreateChargeConfigurationsRequest } from '$lib/server/domains/charge-configuration/schema';

function summarizeChargeConfigBody(body: CreateChargeConfigurationsRequest) {
	return {
		chargeConfigCount: body.chargeConfig.length,
		methodConfigIds: [...new Set(body.chargeConfig.map((item) => String(item.methodConfigId)))],
		pipelineCodes: [...new Set(body.chargeConfig.map((item) => item.pipelineCode))],
		vaNumbers: [...new Set(body.chargeConfig.map((item) => item.vaNumber))]
	};
}

export const GET: RequestHandler = async ({ params, url, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const vaNumber = url.searchParams.get('vaNumber')?.trim() ?? '';
	const log = locals.logger.child({ action: 'charge-configurations' });

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

	const result = await loadChargeConfigurations({
		fetch,
		log,
		cookies,
		orgId,
		vaNumber
	});

	if (result.chargeConfigurationsError) {
		const status = result.chargeConfigurationsError.toLowerCase().includes('authenticated')
			? 401
			: 502;
		return json({ message: result.chargeConfigurationsError }, { status });
	}

	return json({
		configurations: result.chargeConfigurations,
		message: 'Charge configurations retrieved successfully'
	});
};

export const POST: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const log = locals.logger.child({ action: 'charge-configurations-create' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object' || !('chargeConfig' in body)) {
		return json({ message: 'Invalid charge configuration payload' }, { status: 400 });
	}

	const chargeConfigBody = body as CreateChargeConfigurationsRequest;
	if (Array.isArray(chargeConfigBody.chargeConfig)) {
		log.info(
			{
				orgId,
				...summarizeChargeConfigBody(chargeConfigBody)
			},
			'charge configurations tab — POST request received'
		);
	} else {
		log.info({ orgId }, 'charge configurations tab — POST request received (invalid chargeConfig)');
	}

	const result = await createChargeConfigurationsMutation({
		fetch,
		log,
		cookies,
		orgId,
		body: chargeConfigBody
	});

	if (!result.ok) {
		log.warn(
			{ orgId, status: result.status, message: result.message },
			'charge configurations tab — POST failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info({ orgId, message: result.message }, 'charge configurations tab — POST succeeded');

	return json({ message: result.message }, { status: 201 });
};
