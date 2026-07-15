import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import { ListPipelinesResponseSchema, type PipelineRole } from './schema';

export const pipelineClient = {
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		pipelineRole: PipelineRole
	) =>
		apiFetch('/api/v1/management/pipelines/list', {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			query: { pipelineRole },
			schema: ListPipelinesResponseSchema
		})
};
