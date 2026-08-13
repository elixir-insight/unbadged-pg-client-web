import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { loadPaymentMethodConfigurations } from '$lib/server/domains/payment-method-configuration/loaders/list-by-pipeline';

export const GET: RequestHandler = async ({ params, cookies, locals, fetch }) => {
	const pipelineCode = params.pipelineCode?.trim() ?? '';
	const log = locals.logger.child({ action: 'payment-method-configurations' });

	if (!pipelineCode) {
		return json({ message: 'Pipeline code is required' }, { status: 400 });
	}

	try {
		await getValidSession(cookies, fetch, log);
	} catch (error) {
		if (error instanceof SessionInactiveError || error instanceof SessionError) {
			return json({ message: error.message }, { status: 401 });
		}
		throw error;
	}

	const result = await loadPaymentMethodConfigurations({
		fetch,
		log,
		cookies,
		pipelineCode
	});

	if (result.methodConfigurationsError) {
		const status = result.methodConfigurationsError.toLowerCase().includes('authenticated')
			? 401
			: 502;
		return json({ message: result.methodConfigurationsError }, { status });
	}

	return json({
		configurations: result.methodConfigurations,
		message: 'Payment method configurations retrieved successfully'
	});
};
