import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { parseUpdateKybSectionFormData } from '$lib/server/domains/organization/utils/form-data';
import { updateKybSectionMutation } from '$lib/server/domains/organization/mutations/update-kyb-section';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import {
	applyMockKybSection,
	ensureUiOnlyMockOrganization,
	isUiOnlyMockOrganization
} from '$lib/server/domains/organization/utils/mock-platform-onboarding';
import { rememberOrgBrandName } from '$lib/server/domains/organization/utils/org-brand-name-cookie';

export const actions = {
	saveSection: async ({ request, params, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';
		const formData = await request.formData();
		const parsed = parseUpdateKybSectionFormData(formData);

		if (!parsed.success) {
			log.warn({ issues: parsed.issues }, 'update organization rejected — invalid form data');
			return fail(400, {
				message: parsed.issues[0]?.message ?? 'Invalid organization payload'
			});
		}

		if (isUiOnlyMockOrganization(orgId, cookies, parsed.output.category)) {
			const organization = ensureUiOnlyMockOrganization(orgId);
			applyMockKybSection(organization, parsed.output);
			if (parsed.output.brandName?.trim()) {
				rememberOrgBrandName(cookies, orgId, parsed.output.brandName);
			}
			log.info({ orgId }, 'mocked platform KYB section save');
			return {
				success: true,
				message: 'Organization updated successfully',
				section: parsed.output.section
			};
		}

		const result = await updateKybSectionMutation({
			fetch,
			log,
			cookies,
			orgId,
			body: parsed.output
		});

		if (!result.ok) {
			return fail(result.status, { message: result.message });
		}

		return {
			success: true,
			message: result.message,
			section: parsed.output.section
		};
	}
} satisfies Actions;
