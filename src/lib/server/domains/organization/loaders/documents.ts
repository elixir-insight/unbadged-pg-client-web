import { createOrganizationShell, organizations, type Organization } from '$lib/data/mockData';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '../client';
import { loadDirectorDocuments } from './director-documents';
import { mapGetDocumentsResponse } from '../mappers/from-api/get-documents';
import type { Logger } from 'pino';

export function resolveOrganizationBase(
	parentData: {
		organization: Organization | null;
		orgId: string;
		allowShell: boolean;
	},
	orgId: string
): Organization {
	if (parentData.organization) return parentData.organization;

	const seeded = organizations.find((candidate) => candidate.id === orgId);
	if (seeded) return seeded;

	if (parentData.allowShell) return createOrganizationShell({ id: orgId });

	return createOrganizationShell({ id: orgId });
}

export async function loadOrganizationDocuments(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof getValidSession>[0];
	orgId: string;
	organizationBase: Organization;
}) {
	const { fetch, log, cookies, orgId, organizationBase } = params;

	try {
		let tokens;
		try {
			tokens = await getValidSession(cookies, fetch, log);
		} catch (e) {
			if (e instanceof SessionInactiveError || e instanceof SessionError) {
				return {
					documentsLoadError: e.message,
					documents: organizationBase.documents,
					directors: organizationBase.directors
				};
			}
			throw e;
		}

		const result = await organizationClient.getDocuments(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			orgId
		);

		let documents = organizationBase.documents;
		let directors = organizationBase.directors;

		if (!result.ok) {
			log.warn(
				{
					orgId,
					kind: result.error.kind,
					message: result.error.message
				},
				'GET organization documents failed'
			);
		} else {
			const mapped = mapGetDocumentsResponse(result.data.data ?? [], organizationBase);
			documents = mapped.documents;
			directors = mapped.directors;
		}

		directors = await loadDirectorDocuments({
			fetch,
			log,
			accessToken: tokens.accessToken,
			gatewayToken: tokens.gatewayToken,
			orgId,
			directors
		});

		return {
			documentsLoadError: result.ok ? null : result.error.message,
			documents,
			directors
		};
	} catch (error) {
		log.error({ err: error, orgId }, 'load organization documents failed');
		return {
			documentsLoadError: 'Failed to load documents. Please refresh and try again.',
			documents: organizationBase.documents,
			directors: organizationBase.directors
		};
	}
}
