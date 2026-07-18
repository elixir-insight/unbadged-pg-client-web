import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	loadOrganizationDocuments,
	resolveOrganizationBase
} from '$lib/server/domains/organization/load-documents';
import { activateProfileMutation } from '$lib/server/domains/organization/mutations/activate-profile';
import { updateOrganizationStatusMutation } from '$lib/server/domains/organization/mutations/update-status';

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

export const actions = {
	approve: async ({ params, cookies, fetch, locals }) => {
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';

		const result = await updateOrganizationStatusMutation({
			fetch,
			log,
			cookies,
			orgId,
			body: {
				profileStatus: 'APPROVED',
				remarks: 'All onboarding sections complete'
			}
		});

		if (!result.ok) {
			return fail(result.status, { message: result.message, action: 'approve' });
		}

		return {
			success: true,
			message: result.message,
			action: 'approve' as const
		};
	},

	activate: async ({ request, params, locals }) => {
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';
		const formData = await request.formData();
		const category = String(formData.get('category') ?? 'MERCHANT').toUpperCase();

		const result = await activateProfileMutation({
			log,
			orgId,
			category,
			formData
		});

		if (!result.ok) {
			return fail(result.status, { message: result.message, action: 'activate' });
		}

		redirect(303, result.redirectPath);
	}
} satisfies Actions;
