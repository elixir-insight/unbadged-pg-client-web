import { fail, isRedirect, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadOrganizationBankAccounts } from '$lib/server/domains/organization/loaders/bank-accounts';
import {
	loadOrganizationDocuments,
	resolveOrganizationBase
} from '$lib/server/domains/organization/loaders/documents';
import { activateProfileMutation } from '$lib/server/domains/organization/mutations/activate-profile';
import { updateOrganizationStatusMutation } from '$lib/server/domains/organization/mutations/update-status';
import { failUploadAction } from '$lib/server/http/upload-action-error';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const load: PageServerLoad = async ({ params, parent, cookies, fetch, locals, depends }) => {
	depends('org-documents');
	depends('org-bank-accounts');

	const parentData = await parent();
	const log = locals.logger;
	const orgId = params.orgId?.trim();
	const organizationBase = orgId ? resolveOrganizationBase(parentData, orgId) : null;

	if (!orgId || !organizationBase) {
		return {
			documents: organizationBase?.documents ?? [],
			directors: organizationBase?.directors ?? [],
			documentsLoadError: 'Organization id is required',
			bankAccounts: organizationBase?.bankAccounts ?? [],
			bankAccountsLoadError: 'Organization id is required'
		};
	}

	const [documentsResult, bankResult] = await Promise.all([
		loadOrganizationDocuments({
			fetch,
			log,
			cookies,
			orgId,
			organizationBase
		}),
		loadOrganizationBankAccounts({
			fetch,
			log,
			cookies,
			orgId,
			organizationBase
		})
	]);

	return {
		documents: documentsResult.documents,
		directors: documentsResult.directors,
		documentsLoadError: documentsResult.documentsLoadError,
		bankAccounts: bankResult.bankAccounts,
		bankAccountsLoadError: bankResult.bankAccountsLoadError
	};
};

export const actions = {
	approve: async ({ params, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'ORGANIZATION', 'approve');
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

	activate: async ({ request, params, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'ORGANIZATION', 'approve');
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';

		try {
			const formData = await request.formData();
			const category = String(formData.get('category') ?? 'MERCHANT').toUpperCase();

			const result = await activateProfileMutation({
				fetch,
				log,
				cookies,
				orgId,
				category,
				formData
			});

			if (!result.ok) {
				return fail(result.status, { message: result.message, action: 'activate' });
			}

			redirect(303, result.redirectPath);
		} catch (error) {
			if (isRedirect(error)) throw error;
			log.error({ err: error, orgId }, 'activate profile action failed');
			return failUploadAction(error);
		}
	}
} satisfies Actions;
