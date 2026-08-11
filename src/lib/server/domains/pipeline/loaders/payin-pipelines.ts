import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { pipelineClient } from '../client';
import { toPipelineDropdownOptions, type PipelineDropdownOption } from '../map-options';

export type PayinPipelinesLoadResult = {
	pipelineOptions: PipelineDropdownOption[];
	pipelinesError: string | null;
};

export async function loadPayinPipelineOptions(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
}): Promise<PayinPipelinesLoadResult> {
	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return {
			pipelineOptions: [],
			pipelinesError: session.message
		};
	}

	const result = await pipelineClient.list(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		'PAYIN'
	);

	if (!result.ok) {
		params.log.warn({ message: result.error.message }, 'GET payin pipelines failed');
		return {
			pipelineOptions: [],
			pipelinesError: result.error.message
		};
	}

	return {
		pipelineOptions: toPipelineDropdownOptions(result.data),
		pipelinesError: null
	};
}
