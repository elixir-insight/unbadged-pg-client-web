import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { parseUpdateKybSectionFormData } from '$lib/server/domains/organization/utils/form-data';
import { updateKybSectionMutation } from '$lib/server/domains/organization/mutations/update-kyb-section';

export const actions = {
	saveSection: async ({ request, params, cookies, fetch, locals }) => {
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
