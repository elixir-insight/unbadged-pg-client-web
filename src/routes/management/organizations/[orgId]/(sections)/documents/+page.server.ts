import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	loadOrganizationDocuments,
	resolveOrganizationBase
} from '$lib/server/domains/organization/loaders/documents';
import {
	uploadDirectorDocumentsMutation,
	uploadOrgDocumentsMutation
} from '$lib/server/domains/organization/mutations/upload-documents';
import { failUploadAction } from '$lib/server/http/upload-action-error';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import {
	applyMockDocumentUploads,
	ensureUiOnlyMockOrganization,
	isUiOnlyMockOrganization
} from '$lib/server/domains/organization/utils/mock-platform-onboarding';

export const load: PageServerLoad = async ({ params, parent, cookies, fetch, locals, depends }) => {
	depends('org-documents');

	const parentData = await parent();
	const log = locals.logger;
	const orgId = params.orgId?.trim();
	const organizationBase = orgId ? resolveOrganizationBase(parentData, orgId) : null;

	if (!orgId || !organizationBase) {
		return {
			documentsLoadError: 'Organization id is required',
			documents: organizationBase?.documents ?? [],
			directors: organizationBase?.directors ?? []
		};
	}

	return loadOrganizationDocuments({
		fetch,
		log,
		cookies,
		orgId,
		organizationBase
	});
};

export const actions = {
	uploadOrgDocument: async ({ request, params, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';

		try {
			const formData = await request.formData();

			if (isUiOnlyMockOrganization(orgId, cookies)) {
				applyMockDocumentUploads(ensureUiOnlyMockOrganization(orgId), formData);
				log.info({ orgId }, 'mocked platform organization document upload');
				return {
					success: true,
					message: 'Documents uploaded successfully'
				};
			}

			const result = await uploadOrgDocumentsMutation({
				fetch,
				log,
				cookies,
				orgId,
				formData
			});

			if (!result.ok) {
				return fail(result.status, { message: result.message });
			}

			return {
				success: true,
				message: result.message
			};
		} catch (error) {
			log.error({ err: error, orgId }, 'upload organization document action failed');
			return failUploadAction(error);
		}
	},

	uploadDirectorDocument: async ({ request, params, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';

		try {
			const formData = await request.formData();
			const directorId = String(formData.get('directorId') ?? '').trim();

			if (!directorId) {
				return fail(400, { message: 'Director id is required' });
			}

			const uploadFormData = new FormData();
			for (const [fieldName, value] of formData.entries()) {
				if (fieldName === 'directorId') continue;
				uploadFormData.append(fieldName, value);
			}

			if (isUiOnlyMockOrganization(orgId, cookies)) {
				applyMockDocumentUploads(ensureUiOnlyMockOrganization(orgId), uploadFormData, directorId);
				log.info({ orgId, directorId }, 'mocked platform director document upload');
				return {
					success: true,
					message: 'Director documents uploaded successfully'
				};
			}

			const result = await uploadDirectorDocumentsMutation({
				fetch,
				log,
				cookies,
				orgId,
				directorId,
				formData: uploadFormData
			});

			if (!result.ok) {
				return fail(result.status, { message: result.message });
			}

			return {
				success: true,
				message: result.message
			};
		} catch (error) {
			log.error({ err: error, orgId }, 'upload director document action failed');
			return failUploadAction(error);
		}
	}
} satisfies Actions;
