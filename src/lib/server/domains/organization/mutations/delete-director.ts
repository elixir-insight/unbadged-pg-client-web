import type { Logger } from 'pino';
import { organizationClient } from '$lib/server/domains/organization/client';
import { isSessionFailure, requireSession } from './session';
import { mutationFailure, upstreamErrorToFailure, type MutationResult } from './types';

export type DeleteDirectorSuccess = {
	message: string;
};

export async function deleteDirectorMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	directorId: string;
}): Promise<MutationResult<DeleteDirectorSuccess>> {
	const orgId = params.orgId.trim();
	const directorId = params.directorId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}
	if (!directorId) {
		return mutationFailure(400, 'Director id is required');
	}
	if (!/^\d+$/.test(directorId)) {
		return mutationFailure(400, 'Invalid director id');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const result = await organizationClient.deleteDirector(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		directorId
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Director deleted successfully'
	};
}
