import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { updateOrganizationStatusMutation } from '$lib/server/domains/organization/mutations/update-status';
import { statusChangeRequiresRemarks } from './operational-status';
import type { OperationalProfileStatus } from './operational-status';

const ALLOWED_STATUSES: OperationalProfileStatus[] = ['ACTIVE', 'ON_HOLD', 'FROZEN'];

function isOperationalProfileStatus(value: string): value is OperationalProfileStatus {
	return ALLOWED_STATUSES.includes(value as OperationalProfileStatus);
}

export const actions = {
	updateStatus: async ({ request, params, cookies, fetch, locals }) => {
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';
		const formData = await request.formData();
		const profileStatus = String(formData.get('profileStatus') ?? '').trim();
		const remarks = String(formData.get('remarks') ?? '').trim();

		if (!isOperationalProfileStatus(profileStatus)) {
			return fail(400, {
				message: 'Only ACTIVE, ON_HOLD, and FROZEN are supported for this action',
				action: 'updateStatus' as const
			});
		}

		if (statusChangeRequiresRemarks(profileStatus) && !remarks) {
			return fail(400, {
				message: 'Remarks are required when setting status to FROZEN',
				action: 'updateStatus' as const
			});
		}

		const result = await updateOrganizationStatusMutation({
			fetch,
			log,
			cookies,
			orgId,
			body: {
				profileStatus,
				remarks: statusChangeRequiresRemarks(profileStatus) ? remarks : ''
			}
		});

		if (!result.ok) {
			return fail(result.status, { message: result.message, action: 'updateStatus' });
		}

		return {
			success: true,
			message: result.message,
			action: 'updateStatus' as const,
			profileStatus
		};
	}
} satisfies Actions;
