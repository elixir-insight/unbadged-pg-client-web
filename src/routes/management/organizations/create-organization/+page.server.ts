import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { pipelineClient } from '$lib/server/domains/pipeline/client';
import { toPipelineDropdownOptions } from '$lib/server/domains/pipeline/map-options';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { parseCreateOrganizationFormData } from '$lib/server/domains/organization/utils/form-data';
import { createOrganizationMutation } from '$lib/server/domains/organization/mutations/create-organization';
import { rememberOrgCategory } from '$lib/server/domains/organization/utils/org-category-cookie';

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	const log = locals.logger;

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return {
				payinPipelines: [],
				payoutPipelines: [],
				pipelinesError: e.message
			};
		}
		throw e;
	}

	const [payinResult, payoutResult] = await Promise.all([
		pipelineClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, 'PAYIN'),
		pipelineClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, 'PAYOUT')
	]);

	const failures = [
		!payinResult.ok ? payinResult.error.message : null,
		!payoutResult.ok ? payoutResult.error.message : null
	].filter((message): message is string => Boolean(message));

	return {
		payinPipelines: toPipelineDropdownOptions(payinResult.ok ? payinResult.data : null),
		payoutPipelines: toPipelineDropdownOptions(payoutResult.ok ? payoutResult.data : null),
		pipelinesError: failures.length > 0 ? [...new Set(failures)].join('; ') : null
	};
};

export const actions = {
	create: async ({ request, cookies, fetch, locals }) => {
		const log = locals.logger;
		const formData = await request.formData();
		const parsed = parseCreateOrganizationFormData(formData);

		if (!parsed.success) {
			log.warn({ issues: parsed.issues }, 'create organization rejected — invalid form data');
			return fail(400, {
				message: parsed.issues[0]?.message ?? 'Invalid organization payload'
			});
		}

		const result = await createOrganizationMutation({
			fetch,
			log,
			cookies,
			body: parsed.output
		});

		if (!result.ok) {
			return fail(result.status, { message: result.message });
		}

		const category = parsed.output.selectedCategory === 'Partner' ? 'PARTNER' : 'MERCHANT';
		rememberOrgCategory(cookies, result.organizationId, category);
		const categoryQuery = category === 'MERCHANT' ? '' : `?category=${category}`;
		redirect(303, `/management/organizations/${result.organizationId}/kyb${categoryQuery}`);
	}
} satisfies Actions;
