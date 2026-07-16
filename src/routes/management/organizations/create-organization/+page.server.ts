import type { PageServerLoad } from './$types';
import { pipelineClient } from '$lib/server/domains/pipeline/client';
import { toPipelineDropdownOptions } from '$lib/server/domains/pipeline/map-options';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	const log = locals.logger;

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return {
				payinPipelines: [],
				payoutPipelines: [],
				pipelinesError: e.message
			};
		}
		throw e;
	}

	const [payinResult, payoutResult] = await Promise.all([
		pipelineClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, 'PAYIN'),
		pipelineClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, 'PAYOUT')
	]);

	const failures = [
		!payinResult.ok ? payinResult.error.message : null,
		!payoutResult.ok ? payoutResult.error.message : null
	].filter((message): message is string => Boolean(message));

	return {
		payinPipelines: toPipelineDropdownOptions(payinResult.ok ? payinResult.data : null),
		payoutPipelines: toPipelineDropdownOptions(payoutResult.ok ? payoutResult.data : null),
		pipelinesError: failures.length > 0 ? [...new Set(failures)].join('; ') : null
	};
};
