import type { OrganizationDirector } from '$lib/data/mockData';
import { organizationClient } from '$lib/server/domains/organization/client';
import { mapDirectorDocumentsResponse } from '$lib/server/domains/organization/map-get-documents-response';
import type { Logger } from 'pino';

export async function loadDirectorDocuments(params: {
	fetch: typeof fetch;
	log: Logger;
	accessToken: string;
	gatewayToken: string;
	orgId: string;
	directors: OrganizationDirector[];
}): Promise<OrganizationDirector[]> {
	const { fetch, log, accessToken, gatewayToken, orgId, directors } = params;

	if (directors.length === 0) return directors;

	return Promise.all(
		directors.map(async (director) => {
			const result = await organizationClient.getDirectorDocuments(
				fetch,
				log,
				accessToken,
				gatewayToken,
				orgId,
				director.id
			);

			if (!result.ok) {
				log.warn(
					{
						orgId,
						directorId: director.id,
						kind: result.error.kind,
						message: result.error.message
					},
					'GET director documents failed'
				);
				return director;
			}

			return mapDirectorDocumentsResponse(result.data.data ?? [], director);
		})
	);
}
