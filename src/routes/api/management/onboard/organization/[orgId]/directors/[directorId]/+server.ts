import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteDirectorMutation } from '$lib/server/domains/organization/mutations/delete-director';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const DELETE: RequestHandler = async ({ params, cookies, locals, fetch }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'delete');
	const orgId = params.orgId?.trim() ?? '';
	const directorId = params.directorId?.trim() ?? '';
	const log = locals.logger.child({ action: 'director-delete', orgId, directorId });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	const result = await deleteDirectorMutation({
		fetch,
		log,
		cookies,
		orgId,
		directorId
	});

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ message: result.message });
};
