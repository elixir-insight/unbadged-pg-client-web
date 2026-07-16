import type { PageServerLoad } from './$types';
import {
	loadOrganizationDocuments,
	resolveOrganizationBase
} from '$lib/server/domains/organization/load-documents';

export const load: PageServerLoad = async ({ params, parent, cookies, fetch, locals, depends }) => {
	depends('org-documents');

	const parentData = await parent();
	const log = locals.logger;
	const orgId = params.orgId?.trim();
	const organizationBase = orgId ? resolveOrganizationBase(parentData, orgId) : null;

	if (!orgId || !organizationBase) {
		return {
			documents: organizationBase?.documents ?? [],
			directors: organizationBase?.directors ?? []
		};
	}

	const result = await loadOrganizationDocuments({
		fetch,
		log,
		cookies,
		orgId,
		organizationBase
	});

	return {
		documents: result.documents,
		directors: result.directors
	};
};
