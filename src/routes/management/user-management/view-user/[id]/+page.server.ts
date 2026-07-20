import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ApiUserDetailResponse } from '$lib/stores/user-management/api-types';
import { mapUserDetailResponse } from '$lib/stores/user-management/user-mapper';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const memberId = params.id;
	const log = locals.logger.child({ action: 'view-user-page', memberId });

	log.info('loading user detail for view page');

	const res = await fetch(`/api/users?userId=${encodeURIComponent(memberId)}&portal=management`);
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		log.warn(
			{ status: res.status, message: body?.message },
			'failed to load user detail for view page'
		);
		error(res.status === 404 ? 404 : 500, {
			message: body?.message ?? 'Failed to load user'
		});
	}

	const raw: ApiUserDetailResponse = await res.json();
	const user = mapUserDetailResponse(raw);
	if (!user) {
		log.warn('user detail mapped to null');
		error(404, { message: 'User not found' });
	}

	log.info(
		{
			userName: user.name,
			reportingTo: user.reportingManager?.name ?? null
		},
		'user detail ready for view page'
	);

	return { user };
};
